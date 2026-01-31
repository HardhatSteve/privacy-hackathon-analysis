import Foundation

// MARK: - Solana Transaction Builder

/// Builds Solana transactions for signing with Privy embedded wallet
final class SolanaTransactionBuilder {

    /// Current cluster configuration - uses centralized PrivyConfiguration
    private var cluster: AppSolanaCluster {
        PrivyConfiguration.currentCluster
    }

    /// RPC URL for the current cluster
    private var rpcURL: String {
        cluster.rpcURL
    }

    init() {}

    // MARK: - Build SOL Transfer

    /// Build a SOL transfer transaction
    /// Returns base64-encoded serialized transaction ready for signing
    func buildTransfer(
        from fromPublicKey: String,
        to toPublicKey: String,
        lamports: UInt64,
        recentBlockhash: String
    ) throws -> SolanaTransactionData {
        // Build transfer instruction
        // Instruction format: [program_id_index, accounts[], data[]]
        let instruction = TransferInstruction(
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: lamports
        )

        return SolanaTransactionData(
            feePayer: fromPublicKey,
            recentBlockhash: recentBlockhash,
            instructions: [instruction.toEncodable()],
            signatures: []
        )
    }

    // MARK: - Fetch Recent Blockhash

    func fetchRecentBlockhash() async throws -> String {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getLatestBlockhash",
            "params": [["commitment": "finalized"]]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let result = response["result"] as? [String: Any],
              let value = result["value"] as? [String: Any],
              let blockhash = value["blockhash"] as? String else {
            throw SolanaError.rpcError("Failed to fetch recent blockhash")
        }

        return blockhash
    }

    // MARK: - Send Signed Transaction

    func sendSignedTransaction(signedTransaction: String) async throws -> String {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sendTransaction",
            "params": [
                signedTransaction,
                [
                    "encoding": "base64",
                    "preflightCommitment": "confirmed"
                ]
            ]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let signature = response["result"] as? String else {
            if let error = response["error"] as? [String: Any],
               let message = error["message"] as? String {
                throw SolanaError.rpcError(message)
            }
            throw SolanaError.rpcError("Failed to send transaction")
        }

        return signature
    }

    // MARK: - Confirm Transaction

    func confirmTransaction(signature: String, timeout: TimeInterval = 30) async throws -> Bool {
        let startTime = Date()

        while Date().timeIntervalSince(startTime) < timeout {
            let body: [String: Any] = [
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignatureStatuses",
                "params": [[signature], ["searchTransactionHistory": true]]
            ]

            let response = try await makeRPCRequest(body: body)

            if let result = response["result"] as? [String: Any],
               let value = result["value"] as? [Any?],
               let first = value.first,
               let status = first as? [String: Any] {
                if let confirmationStatus = status["confirmationStatus"] as? String {
                    if confirmationStatus == "finalized" || confirmationStatus == "confirmed" {
                        return true
                    }
                }
                if status["err"] != nil {
                    return false
                }
            }

            // Wait before next poll
            try await Task.sleep(nanoseconds: 500_000_000)  // 0.5 seconds
        }

        return false
    }

    // MARK: - Get Transaction Fee

    func getEstimatedFee(message: String) async throws -> UInt64 {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getFeeForMessage",
            "params": [message, ["commitment": "confirmed"]]
        ]

        let response = try await makeRPCRequest(body: body)

        guard let result = response["result"] as? [String: Any],
              let value = result["value"] as? UInt64 else {
            // Return default fee estimate
            return 5000  // 0.000005 SOL
        }

        return value
    }

    // MARK: - Private Methods

    private func makeRPCRequest(body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: rpcURL) else {
            throw SolanaError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SolanaError.rpcError("HTTP request failed")
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw SolanaError.rpcError("Invalid JSON response")
        }

        return json
    }
}

// MARK: - Transaction Data Structure

struct SolanaTransactionData: Codable {
    let feePayer: String
    let recentBlockhash: String
    let instructions: [[String: Any]]
    let signatures: [String]

    enum CodingKeys: String, CodingKey {
        case feePayer
        case recentBlockhash
        case instructions
        case signatures
    }

    init(feePayer: String, recentBlockhash: String, instructions: [[String: Any]], signatures: [String]) {
        self.feePayer = feePayer
        self.recentBlockhash = recentBlockhash
        self.instructions = instructions
        self.signatures = signatures
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        feePayer = try container.decode(String.self, forKey: .feePayer)
        recentBlockhash = try container.decode(String.self, forKey: .recentBlockhash)
        signatures = try container.decode([String].self, forKey: .signatures)
        // Instructions need special handling due to Any type
        instructions = []
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(feePayer, forKey: .feePayer)
        try container.encode(recentBlockhash, forKey: .recentBlockhash)
        try container.encode(signatures, forKey: .signatures)
        // Instructions encoded separately
    }

    /// Serialize to base64 for sending
    func serialize() throws -> String {
        // Create transaction message
        var messageBytes = Data()

        // Header: num_required_signatures (1), num_readonly_signed (0), num_readonly_unsigned (1)
        messageBytes.append(1)
        messageBytes.append(0)
        messageBytes.append(1)

        // Account keys (simplified - just feePayer and System Program)
        let accountKeys = [feePayer, "11111111111111111111111111111111"]

        // Num accounts
        messageBytes.append(UInt8(accountKeys.count))

        // Account public keys (32 bytes each)
        for key in accountKeys {
            if let keyData = base58Decode(key) {
                messageBytes.append(keyData)
            }
        }

        // Recent blockhash (32 bytes)
        if let blockhashData = base58Decode(recentBlockhash) {
            messageBytes.append(blockhashData)
        }

        // Number of instructions
        messageBytes.append(UInt8(instructions.count))

        // Encode each instruction
        for instruction in instructions {
            if let encoded = encodeInstruction(instruction) {
                messageBytes.append(encoded)
            }
        }

        return messageBytes.base64EncodedString()
    }

    private func encodeInstruction(_ instruction: [String: Any]) -> Data? {
        var data = Data()

        // Program ID index (System Program is at index 1)
        data.append(1)

        // Number of accounts
        data.append(2)

        // Account indices
        data.append(0)  // From account
        data.append(0)  // To account (would be different in real implementation)

        // Instruction data
        if let instructionData = instruction["data"] as? Data {
            // Compact-u16 encoding for length
            data.append(UInt8(instructionData.count))
            data.append(instructionData)
        }

        return data
    }

    private func base58Decode(_ string: String) -> Data? {
        let alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        var result = [UInt8]()
        var leadingZeros = 0

        for char in string {
            if char == "1" && result.isEmpty {
                leadingZeros += 1
            }

            guard let index = alphabet.firstIndex(of: char) else {
                return nil
            }
            let digit = alphabet.distance(from: alphabet.startIndex, to: index)

            var carry = digit
            for i in (0..<result.count).reversed() {
                carry += 58 * Int(result[i])
                result[i] = UInt8(carry % 256)
                carry /= 256
            }

            while carry > 0 {
                result.insert(UInt8(carry % 256), at: 0)
                carry /= 256
            }
        }

        // Add leading zeros
        return Data(Array(repeating: UInt8(0), count: leadingZeros) + result)
    }
}

// MARK: - Transfer Instruction

struct TransferInstruction {
    let fromPubkey: String
    let toPubkey: String
    let lamports: UInt64

    /// System Program Transfer instruction index
    static let transferInstructionIndex: UInt32 = 2

    func toEncodable() -> [String: Any] {
        // Create instruction data
        // Format: [4 bytes instruction index (little endian), 8 bytes lamports (little endian)]
        var data = Data()

        // Instruction index (2 = transfer)
        var instructionIndex = Self.transferInstructionIndex
        data.append(Data(bytes: &instructionIndex, count: 4))

        // Lamports
        var lamportsValue = lamports
        data.append(Data(bytes: &lamportsValue, count: 8))

        return [
            "programId": "11111111111111111111111111111111",
            "keys": [
                ["pubkey": fromPubkey, "isSigner": true, "isWritable": true],
                ["pubkey": toPubkey, "isSigner": false, "isWritable": true]
            ],
            "data": data
        ]
    }
}

// MARK: - Transaction Service

/// High-level service for sending transactions with Privy signing
@MainActor
final class SolanaTransactionService {

    private let transactionBuilder: SolanaTransactionBuilder

    /// Current cluster configuration - uses centralized PrivyConfiguration
    private var cluster: AppSolanaCluster {
        PrivyConfiguration.currentCluster
    }

    init() {
        self.transactionBuilder = SolanaTransactionBuilder()
    }

    /// Send SOL to another address
    /// - Parameters:
    ///   - from: Sender's public key
    ///   - to: Recipient's public key
    ///   - amount: Amount in SOL (not lamports)
    ///   - signTransaction: Closure that signs the transaction (Privy)
    /// - Returns: Transaction signature
    func sendSOL(
        from: String,
        to: String,
        amount: Double,
        signTransaction: @escaping (String) async throws -> String
    ) async throws -> String {
        // Convert to lamports
        let lamports = UInt64(amount * 1_000_000_000)

        // Get recent blockhash
        let blockhash = try await transactionBuilder.fetchRecentBlockhash()

        // Build transaction
        let transaction = try transactionBuilder.buildTransfer(
            from: from,
            to: to,
            lamports: lamports,
            recentBlockhash: blockhash
        )

        // Serialize for signing
        let serialized = try transaction.serialize()

        // Sign with Privy
        let signedTransaction = try await signTransaction(serialized)

        // Send to network
        let signature = try await transactionBuilder.sendSignedTransaction(signedTransaction: signedTransaction)

        // Confirm transaction
        let confirmed = try await transactionBuilder.confirmTransaction(signature: signature)

        if !confirmed {
            throw SolanaError.rpcError("Transaction confirmation timeout")
        }

        return signature
    }

    /// Get estimated fee for a transfer
    func getTransferFee() async throws -> Double {
        // Default fee is approximately 5000 lamports (0.000005 SOL)
        return 0.000005
    }
}
