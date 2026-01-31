import Foundation
import Combine
import PrivySDK

// MARK: - SPL Token Balance

struct SPLTokenBalance {
    let mintAddress: String
    let symbol: String
    let balance: Double
    let decimals: Int
    let uiAmount: String

    var formattedBalance: String {
        String(format: "%.\(min(decimals, 6))f %@", balance, symbol)
    }
}

// MARK: - Well-Known Token Mints

enum WellKnownToken {
    static let USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    static let USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    static let SOL = "So11111111111111111111111111111111111111112"

    static func symbol(for mint: String) -> String {
        switch mint {
        case USDC: return "USDC"
        case USDT: return "USDT"
        case SOL: return "SOL"
        default: return String(mint.prefix(4)) + "..."
        }
    }

    static func decimals(for mint: String) -> Int {
        switch mint {
        case USDC, USDT: return 6
        case SOL: return 9
        default: return 9
        }
    }
}

// MARK: - Solana Wallet Service Protocol

protocol SolanaWalletServicing {
    var walletStatePublisher: AnyPublisher<WalletConnectionState, Never> { get }
    var transactionsPublisher: AnyPublisher<[SolanaTransaction], Never> { get }

    @MainActor func connect() async throws -> SolanaWalletInfo
    func disconnect() async
    func refreshBalance() async throws -> SolanaWalletInfo
    func loadTransactions(limit: Int) async throws -> [SolanaTransaction]
    @MainActor func send(to address: String, amount: Double, memo: String?) async throws -> String
    func requestAirdrop(amount: Double) async throws -> String  // Devnet only
    func getTokenBalance(mintAddress: String) async throws -> SPLTokenBalance
    func getAllTokenBalances() async throws -> [SPLTokenBalance]
}

// MARK: - Solana Wallet Service Implementation

final class SolanaWalletService: SolanaWalletServicing {
    private let keyStore: SolanaKeyStore

    private let walletStateSubject = CurrentValueSubject<WalletConnectionState, Never>(.disconnected)
    private let transactionsSubject = CurrentValueSubject<[SolanaTransaction], Never>([])

    var walletStatePublisher: AnyPublisher<WalletConnectionState, Never> {
        walletStateSubject.eraseToAnyPublisher()
    }

    var transactionsPublisher: AnyPublisher<[SolanaTransaction], Never> {
        transactionsSubject.eraseToAnyPublisher()
    }

    /// Current cluster configuration - uses centralized PrivyConfiguration
    private var cluster: AppSolanaCluster {
        PrivyConfiguration.currentCluster
    }

    /// RPC URL for the current cluster
    private var rpcURL: String {
        cluster.rpcURL
    }

    init(keyStore: SolanaKeyStore = SolanaKeyStore()) {
        self.keyStore = keyStore
    }

    @MainActor
    func connect() async throws -> SolanaWalletInfo {
        walletStateSubject.send(.connecting)

        do {
            let privyAuth = PrivyAuthService.shared

            // Determine which wallet to use (server or embedded)
            let publicKey: String

            // 1. First try server wallet (new flow)
            if privyAuth.useServerWallets, let serverAddress = WalletAPIService.shared.solanaAddress {
                publicKey = serverAddress
                print("[SolanaWalletService] Using server wallet: \(publicKey)")
            }
            // 2. Try to load server wallets if authenticated but not loaded yet
            else if privyAuth.authState.isAuthenticated {
                do {
                    try await privyAuth.loadServerWallets()
                    if privyAuth.useServerWallets, let serverAddress = WalletAPIService.shared.solanaAddress {
                        publicKey = serverAddress
                        print("[SolanaWalletService] Loaded and using server wallet: \(publicKey)")
                    } else {
                        // No server wallets, check for embedded wallet
                        publicKey = try await useEmbeddedOrCreateWallet(privyAuth)
                    }
                } catch {
                    // Server wallet loading failed, fall back to embedded
                    print("[SolanaWalletService] Server wallet load failed, using embedded: \(error)")
                    publicKey = try await useEmbeddedOrCreateWallet(privyAuth)
                }
            }
            // 3. Fall back to local keystore for testing (devnet only)
            else {
                publicKey = try await keyStore.loadOrCreateKeypair()
                print("[SolanaWalletService] Using local keystore (devnet testing)")
            }

            // Fetch balance from RPC
            let balance = try await fetchBalance(for: publicKey)

            let walletInfo = SolanaWalletInfo(publicKey: publicKey, balance: balance)
            walletStateSubject.send(.connected(walletInfo))

            return walletInfo
        } catch {
            walletStateSubject.send(.error(error.localizedDescription))
            throw error
        }
    }

    /// Helper to use embedded wallet or create a new one
    @MainActor
    private func useEmbeddedOrCreateWallet(_ privyAuth: PrivyAuthService) async throws -> String {
        if let privyWalletAddress = privyAuth.solanaWalletAddress {
            print("[SolanaWalletService] Using embedded wallet: \(privyWalletAddress)")
            return privyWalletAddress
        } else if privyAuth.authState.isAuthenticated {
            // User is authenticated but no wallet - create one
            let wallet = try await privyAuth.createSolanaWallet()
            print("[SolanaWalletService] Created embedded wallet: \(wallet.address)")
            return wallet.address
        } else {
            throw SolanaError.notConnected
        }
    }
    
    func disconnect() async {
        walletStateSubject.send(.disconnected)
        transactionsSubject.send([])
    }
    
    func refreshBalance() async throws -> SolanaWalletInfo {
        guard case .connected(let currentInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }
        
        let balance = try await fetchBalance(for: currentInfo.publicKey)
        let updatedInfo = SolanaWalletInfo(publicKey: currentInfo.publicKey, balance: balance)
        walletStateSubject.send(.connected(updatedInfo))
        
        return updatedInfo
    }
    
    func loadTransactions(limit: Int = 20) async throws -> [SolanaTransaction] {
        guard case .connected(let walletInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }
        
        let transactions = try await fetchTransactions(for: walletInfo.publicKey, limit: limit)
        transactionsSubject.send(transactions)
        
        return transactions
    }
    
    @MainActor
    func send(to address: String, amount: Double, memo: String?) async throws -> String {
        guard case .connected(let walletInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }

        // Validate address
        guard isValidSolanaAddress(address) else {
            throw SolanaError.invalidAddress
        }

        // Convert SOL to lamports
        let lamports = UInt64(amount * 1_000_000_000)

        // Check sufficient balance (including estimated fee)
        let estimatedFee: UInt64 = 5000  // 0.000005 SOL typical fee
        guard walletInfo.balance >= lamports + estimatedFee else {
            throw SolanaError.insufficientFunds
        }

        // Create and send transaction
        let signature = try await createAndSendTransaction(
            from: walletInfo.publicKey,
            to: address,
            lamports: lamports,
            memo: memo
        )

        // Refresh balance after send
        _ = try? await refreshBalance()

        return signature
    }
    
    func requestAirdrop(amount: Double) async throws -> String {
        guard !cluster.isProduction else {
            throw SolanaError.airdropNotAvailable
        }

        guard case .connected(let walletInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }

        let lamports = UInt64(amount * 1_000_000_000)
        let signature = try await requestAirdropRPC(to: walletInfo.publicKey, lamports: lamports)

        // Wait a bit then refresh balance
        try await Task.sleep(nanoseconds: 2_000_000_000)
        _ = try? await refreshBalance()

        return signature
    }

    // MARK: - Token Balance Methods

    func getTokenBalance(mintAddress: String) async throws -> SPLTokenBalance {
        guard case .connected(let walletInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }

        let tokenAccounts = try await fetchTokenAccountsByMint(
            owner: walletInfo.publicKey,
            mint: mintAddress
        )

        let symbol = WellKnownToken.symbol(for: mintAddress)
        let decimals = WellKnownToken.decimals(for: mintAddress)

        // Sum up balance from all token accounts for this mint
        var totalBalance: Double = 0
        for account in tokenAccounts {
            totalBalance += account.balance
        }

        return SPLTokenBalance(
            mintAddress: mintAddress,
            symbol: symbol,
            balance: totalBalance,
            decimals: decimals,
            uiAmount: String(format: "%.\(min(decimals, 6))f", totalBalance)
        )
    }

    func getAllTokenBalances() async throws -> [SPLTokenBalance] {
        guard case .connected(let walletInfo) = walletStateSubject.value else {
            throw SolanaError.notConnected
        }

        let tokenAccounts = try await fetchAllTokenAccounts(owner: walletInfo.publicKey)
        return tokenAccounts
    }

    func getUSDCBalance() async throws -> Double {
        let balance = try await getTokenBalance(mintAddress: WellKnownToken.USDC)
        return balance.balance
    }

    // MARK: - Private RPC Methods
    
    private func fetchBalance(for publicKey: String) async throws -> UInt64 {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [publicKey]
        ]
        
        let response = try await makeRPCRequest(body: body)
        
        guard let result = response["result"] as? [String: Any],
              let value = result["value"] as? UInt64 else {
            throw SolanaError.rpcError("Failed to parse balance response")
        }
        
        return value
    }
    
    private func fetchTransactions(for publicKey: String, limit: Int) async throws -> [SolanaTransaction] {
        // Step 1: Get transaction signatures
        let signaturesBody: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [
                publicKey,
                ["limit": limit]
            ]
        ]

        let signaturesResponse = try await makeRPCRequest(body: signaturesBody)

        guard let signatureResults = signaturesResponse["result"] as? [[String: Any]] else {
            return []
        }

        // Step 2: Fetch full transaction details for each signature
        var transactions: [SolanaTransaction] = []

        for item in signatureResults {
            guard let signature = item["signature"] as? String else { continue }

            let blockTime = item["blockTime"] as? TimeInterval
            let timestamp = blockTime.map { Date(timeIntervalSince1970: $0) }
            let signatureErr = item["err"]
            let memo = item["memo"] as? String

            // Fetch full transaction details
            if let txDetails = try? await fetchTransactionDetails(signature: signature, walletAddress: publicKey) {
                transactions.append(SolanaTransaction(
                    id: signature,
                    timestamp: timestamp,
                    amount: txDetails.amount,
                    from: txDetails.from,
                    to: txDetails.to,
                    fee: txDetails.fee,
                    status: txDetails.status,
                    memo: memo ?? txDetails.memo
                ))
            } else {
                // Fallback if detailed fetch fails - use signature-only data
                let status: SolanaTransaction.TransactionStatus = signatureErr == nil ? .confirmed : .failed
                transactions.append(SolanaTransaction(
                    id: signature,
                    timestamp: timestamp,
                    amount: 0,
                    from: "",
                    to: "",
                    fee: 0,
                    status: status,
                    memo: memo
                ))
            }
        }

        return transactions
    }

    // MARK: - Transaction Details Fetching

    private struct TransactionDetails {
        let amount: Int64
        let from: String
        let to: String
        let fee: UInt64
        let status: SolanaTransaction.TransactionStatus
        let memo: String?
    }

    private func fetchTransactionDetails(signature: String, walletAddress: String) async throws -> TransactionDetails {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [
                signature,
                ["encoding": "jsonParsed", "maxSupportedTransactionVersion": 0]
            ]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let result = response["result"] as? [String: Any] else {
            throw SolanaError.rpcError("Transaction not found")
        }

        // Parse transaction metadata
        let meta = result["meta"] as? [String: Any]
        let fee = meta?["fee"] as? UInt64 ?? 0

        // Check for error in meta
        let metaErr = meta?["err"]
        let status: SolanaTransaction.TransactionStatus
        if metaErr == nil || (metaErr as? NSNull) != nil {
            status = .confirmed
        } else {
            status = .failed
        }

        // Parse transaction to find SOL transfer amounts
        var amount: Int64 = 0
        var from = ""
        var to = ""
        var memo: String? = nil

        // Get pre and post balances to calculate actual transfer
        if let preBalances = meta?["preBalances"] as? [UInt64],
           let postBalances = meta?["postBalances"] as? [UInt64],
           let transaction = result["transaction"] as? [String: Any],
           let message = transaction["message"] as? [String: Any],
           let accountKeys = message["accountKeys"] as? [[String: Any]] {

            // Find the wallet's index in accountKeys
            var walletIndex: Int? = nil
            for (index, account) in accountKeys.enumerated() {
                if let pubkey = account["pubkey"] as? String, pubkey == walletAddress {
                    walletIndex = index
                    break
                }
            }

            if let idx = walletIndex, idx < preBalances.count, idx < postBalances.count {
                // Calculate balance change for wallet
                let preBalance = Int64(preBalances[idx])
                let postBalance = Int64(postBalances[idx])
                amount = postBalance - preBalance

                // If amount is negative, wallet sent SOL (add back fee for display)
                // If amount is positive, wallet received SOL
            }

            // Parse instructions to find from/to addresses
            if let instructions = message["instructions"] as? [[String: Any]] {
                for instruction in instructions {
                    // Check for system program transfer
                    if let programId = instruction["programId"] as? String,
                       programId == "11111111111111111111111111111111" {
                        // System program - check for transfer
                        if let parsed = instruction["parsed"] as? [String: Any],
                           let type = parsed["type"] as? String,
                           type == "transfer",
                           let info = parsed["info"] as? [String: Any] {
                            from = info["source"] as? String ?? ""
                            to = info["destination"] as? String ?? ""
                        }
                    }

                    // Check for memo
                    if let programId = instruction["programId"] as? String,
                       programId == "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" ||
                       programId == "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo" {
                        if let parsed = instruction["parsed"] as? String {
                            memo = parsed
                        }
                    }
                }
            }
        }

        return TransactionDetails(
            amount: amount,
            from: from,
            to: to,
            fee: fee,
            status: status,
            memo: memo
        )
    }
    
    @MainActor
    private func createAndSendTransaction(from: String, to: String, lamports: UInt64, memo: String?) async throws -> String {
        let transactionBuilder = SolanaTransactionBuilder()

        // 1. Get recent blockhash
        let blockhash = try await transactionBuilder.fetchRecentBlockhash()

        // 2. Build the transaction
        let transaction = try transactionBuilder.buildTransfer(
            from: from,
            to: to,
            lamports: lamports,
            recentBlockhash: blockhash
        )

        // 3. Serialize for signing
        let serialized = try transaction.serialize()

        // 4. Sign and send using the unified API (routes to server or embedded)
        let privyAuth = PrivyAuthService.shared

        // Check if we have any wallet available (server or embedded)
        if privyAuth.useServerWallets || privyAuth.embeddedSolanaWallet != nil {
            // Use unified API to sign and send (routes to server or embedded)
            let signature = try await privyAuth.unifiedSignAndSendTransaction(serialized)

            // 5. Confirm transaction
            let confirmed = try await transactionBuilder.confirmTransaction(signature: signature)

            if !confirmed {
                throw SolanaError.rpcError("Transaction confirmation timeout")
            }

            return signature
        } else {
            // Fallback for devnet testing without any wallet (unsigned - will fail on mainnet)
            print("[SolanaWalletService] Warning: Sending unsigned transaction (devnet only)")

            // 5. Send to network
            let signature = try await transactionBuilder.sendSignedTransaction(signedTransaction: serialized)

            // 6. Confirm transaction
            let confirmed = try await transactionBuilder.confirmTransaction(signature: signature)

            if !confirmed {
                throw SolanaError.rpcError("Transaction confirmation timeout")
            }

            return signature
        }
    }
    
    private func requestAirdropRPC(to publicKey: String, lamports: UInt64) async throws -> String {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "requestAirdrop",
            "params": [publicKey, lamports]
        ]
        
        let response = try await makeRPCRequest(body: body)
        
        guard let signature = response["result"] as? String else {
            throw SolanaError.rpcError("Failed to request airdrop")
        }
        
        return signature
    }
    
    private func makeRPCRequest(body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: rpcURL) else {
            throw SolanaError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SolanaError.rpcError("HTTP request failed")
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw SolanaError.rpcError("Invalid JSON response")
        }
        
        if let error = json["error"] as? [String: Any],
           let message = error["message"] as? String {
            throw SolanaError.rpcError(message)
        }
        
        return json
    }
    
    private func isValidSolanaAddress(_ address: String) -> Bool {
        // Solana addresses are base58-encoded and 32-44 characters
        let base58Chars = CharacterSet(charactersIn: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
        return address.count >= 32 && address.count <= 44 &&
               address.unicodeScalars.allSatisfy { base58Chars.contains($0) }
    }

    private func fetchTokenAccountsByMint(owner: String, mint: String) async throws -> [SPLTokenBalance] {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                owner,
                ["mint": mint],
                ["encoding": "jsonParsed"]
            ]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let result = response["result"] as? [String: Any],
              let accounts = result["value"] as? [[String: Any]] else {
            return []
        }

        return parseTokenAccounts(accounts, defaultMint: mint)
    }

    private func fetchAllTokenAccounts(owner: String) async throws -> [SPLTokenBalance] {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                owner,
                ["programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
                ["encoding": "jsonParsed"]
            ]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let result = response["result"] as? [String: Any],
              let accounts = result["value"] as? [[String: Any]] else {
            return []
        }

        return parseTokenAccounts(accounts)
    }

    private func parseTokenAccounts(_ accounts: [[String: Any]], defaultMint: String? = nil) -> [SPLTokenBalance] {
        var balances: [SPLTokenBalance] = []

        for account in accounts {
            guard let accountData = account["account"] as? [String: Any],
                  let data = accountData["data"] as? [String: Any],
                  let parsed = data["parsed"] as? [String: Any],
                  let info = parsed["info"] as? [String: Any],
                  let tokenAmount = info["tokenAmount"] as? [String: Any] else {
                continue
            }

            let mint = info["mint"] as? String ?? defaultMint ?? ""
            let uiAmountString = tokenAmount["uiAmountString"] as? String ?? "0"
            let uiAmount = tokenAmount["uiAmount"] as? Double ?? 0
            let decimals = tokenAmount["decimals"] as? Int ?? 9

            let symbol = WellKnownToken.symbol(for: mint)

            balances.append(SPLTokenBalance(
                mintAddress: mint,
                symbol: symbol,
                balance: uiAmount,
                decimals: decimals,
                uiAmount: uiAmountString
            ))
        }

        return balances
    }
}

// MARK: - Solana Errors

enum SolanaError: Error, LocalizedError {
    case notConnected
    case invalidAddress
    case insufficientFunds
    case rpcError(String)
    case invalidURL
    case airdropNotAvailable
    case notImplemented(String)
    case keyStoreError(String)
    
    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "Wallet is not connected"
        case .invalidAddress:
            return "Invalid Solana address"
        case .insufficientFunds:
            return "Insufficient funds for transaction"
        case .rpcError(let message):
            return "RPC Error: \(message)"
        case .invalidURL:
            return "Invalid RPC URL"
        case .airdropNotAvailable:
            return "Airdrop is only available on devnet/testnet"
        case .notImplemented(let feature):
            return "Not implemented: \(feature)"
        case .keyStoreError(let message):
            return "KeyStore error: \(message)"
        }
    }
}

// MARK: - Key Store

final class SolanaKeyStore {
    private let keychainKey = "com.sapp.solana.keypair"
    
    func loadOrCreateKeypair() async throws -> String {
        // Try to load existing keypair
        if let existingKey = loadPublicKey() {
            return existingKey
        }
        
        // Generate new keypair
        let publicKey = try generateNewKeypair()
        return publicKey
    }
    
    func loadPublicKey() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainKey,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let publicKey = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return publicKey
    }
    
    func savePublicKey(_ publicKey: String) throws {
        guard let data = publicKey.data(using: .utf8) else {
            throw SolanaError.keyStoreError("Failed to encode public key")
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainKey,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)  // Remove existing if any
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw SolanaError.keyStoreError("Failed to save public key to keychain")
        }
    }
    
    func clearKeypair() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainKey
        ]
        
        SecItemDelete(query as CFDictionary)
    }
    
    private func generateNewKeypair() throws -> String {
        // Generate Ed25519 keypair using CryptoKit
        // Note: Privy handles actual wallet creation - this is for local key derivation
        var randomBytes = [UInt8](repeating: 0, count: 32)
        let status = SecRandomCopyBytes(kSecRandomDefault, 32, &randomBytes)
        guard status == errSecSuccess else {
            throw SolanaError.keyStoreError("Failed to generate secure random bytes")
        }

        let publicKey = base58Encode(Data(randomBytes))

        try savePublicKey(publicKey)
        return publicKey
    }
    
    private func base58Encode(_ data: Data) -> String {
        let alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        var bytes = [UInt8](data)
        var result = ""
        
        while !bytes.isEmpty {
            var carry = 0
            var newBytes: [UInt8] = []
            
            for byte in bytes {
                carry = carry * 256 + Int(byte)
                if carry >= 58 {
                    newBytes.append(UInt8(carry / 58))
                    carry = carry % 58
                } else if !newBytes.isEmpty {
                    newBytes.append(0)
                }
            }
            
            result = String(alphabet[alphabet.index(alphabet.startIndex, offsetBy: carry)]) + result
            bytes = newBytes
        }
        
        // Add leading '1's for leading zero bytes
        for byte in data {
            if byte == 0 {
                result = "1" + result
            } else {
                break
            }
        }
        
        return result
    }
}
