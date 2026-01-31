import {
  createSilentSwapClient,
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createHdFacilitatorGroupFromEntropy,
  queryDepositCount,
  hexToBytes,
  quoteResponseToEip712Document,
  solveOptimalUsdcAmount,
  caip19FungibleEvmToken,
  caip19SplToken,
  DeliveryMethod,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
  N_RELAY_CHAIN_ID_SOLANA,
  SB58_ADDR_SOL_PROGRAM_SYSTEM,
  SB58_CHAIN_ID_SOLANA_MAINNET,
  createPhonyDepositCalldata,
  X_MAX_IMPACT_PERCENT,
  type SilentSwapClient,
  type SolveUsdcResult,
} from '@silentswap/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import BigNumber from 'bignumber.js';

// Import types from dedicated type files
import type {
  SilentSwapQuoteRequest,
  SilentSwapQuoteResponse,
  SilentSwapExecuteRequest,
  SilentSwapExecuteResponse,
  SilentSwapStatusResponse,
  NonceResponse,
  AuthResponse,
} from '../types/silentSwap.types.js';

// Re-export types for consumers
export type {
  SilentSwapQuoteRequest,
  SilentSwapQuoteResponse,
  SilentSwapExecuteRequest,
  SilentSwapExecuteResponse,
  SilentSwapStatusResponse,
  NonceResponse,
  AuthResponse,
};

// MARK: - Service Class

class SilentSwapService {
  private silentswap: SilentSwapClient;
  private solanaConnection: Connection;

  // Cache for facilitator groups (keyed by `${evmAddress}-${depositCount}`)
  private facilitatorGroupCache: Map<string, Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>> = new Map();

  constructor() {
    // Initialize SilentSwap client
    // ENVIRONMENT enum only has MAINNET and STAGING
    // For testnet, use STAGING with testnet baseUrl override
    const envConfig = process.env.SILENTSWAP_ENVIRONMENT?.toUpperCase() || 'STAGING';
    const environment = envConfig === 'MAINNET' ? ENVIRONMENT.MAINNET : ENVIRONMENT.STAGING;
    // Staging API URL
    const baseUrl = process.env.SILENTSWAP_API_URL || 'https://api-staging.silentswap.com';

    console.log(`[SilentSwapService] Initializing with environment: ${environment}`);

    this.silentswap = createSilentSwapClient({
      environment,
      baseUrl,
    });

    // Initialize Solana connection
    const solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');

    console.log('[SilentSwapService] Initialized (stateless mode)');
  }

  // MARK: - Authentication (Stateless)

  /**
   * Get nonce for SIWE authentication
   * iOS will use this to create a SIWE message and sign with Privy EVM wallet
   */
  async getNonce(evmAddress: string): Promise<NonceResponse> {
    const [nonceError, nonceResponse] = await this.silentswap.nonce(evmAddress as `0x${string}`);

    if (!nonceResponse || nonceError) {
      throw new Error(`Failed to get nonce: ${nonceError?.type}: ${nonceError?.error}`);
    }

    return { nonce: nonceResponse.nonce };
  }

  /**
   * Authenticate with signed SIWE message
   * iOS provides the message and signature (signed with Privy EVM wallet)
   * Returns secret token that iOS will sign to derive entropy
   */
  async authenticate(message: string, signature: string): Promise<AuthResponse> {
    const [authError, authResponse] = await this.silentswap.authenticate({
      siwe: {
        message,
        signature: signature as `0x${string}`,
      },
    });

    if (!authResponse || authError) {
      throw new Error(`Failed to authenticate: ${authError?.type}: ${authError?.error}`);
    }

    return { secretToken: authResponse.secretToken };
  }

  /**
   * Get EIP-712 document for wallet generation
   * iOS will sign this to derive entropy
   */
  getWalletGenerationEip712(secretToken: string): any {
    return createEip712DocForWalletGeneration('silentswap', secretToken);
  }

  // MARK: - Facilitator Group Management

  private async getFacilitatorGroup(
    evmAddress: string,
    entropy: string
  ): Promise<Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>> {
    let depositCount = 0;

    // queryDepositCount calls Avalanche mainnet contracts
    // For STAGING environment, contracts may not exist, so we skip and use 0
    const envConfig = process.env.SILENTSWAP_ENVIRONMENT?.toUpperCase() || 'STAGING';

    if (envConfig === 'MAINNET') {
      try {
        // Query deposit count from the gateway contract
        const depositCountBigInt = await queryDepositCount(
          evmAddress as `0x${string}`,
          this.silentswap.s0xGatewayAddress
        );
        depositCount = Number(depositCountBigInt);
        console.log(`[SilentSwapService] Deposit count for ${evmAddress}: ${depositCount}`);
      } catch (error) {
        console.error('[SilentSwapService] Failed to query deposit count:', error);
        throw error;
      }
    } else {
      // For STAGING/testing, skip the on-chain query since contracts may not exist
      // Use deposit count of 0 (new user assumption)
      console.log(`[SilentSwapService] STAGING mode: using deposit count 0 for ${evmAddress}`);
      depositCount = 0;
    }

    const cacheKey = `${evmAddress}-${depositCount}`;

    if (this.facilitatorGroupCache.has(cacheKey)) {
      console.log(`[SilentSwapService] Using cached facilitator group for ${cacheKey}`);
      return this.facilitatorGroupCache.get(cacheKey)!;
    }

    const group = await createHdFacilitatorGroupFromEntropy(
      hexToBytes(entropy as `0x${string}`),
      depositCount
    );

    this.facilitatorGroupCache.set(cacheKey, group);
    console.log(`[SilentSwapService] Created new facilitator group for ${cacheKey}`);
    return group;
  }

  // MARK: - Quote

  async getQuote(request: SilentSwapQuoteRequest): Promise<SilentSwapQuoteResponse> {
    try {
      const group = await this.getFacilitatorGroup(request.evmAddress, request.entropy);

      // Derive viewer account
      const viewer = await group.viewer();
      const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
        '*',
        FacilitatorKeyType.SECP256K1
      );

      // Export public keys for facilitator group
      const groupPublicKeys = await group.exportPublicKeys(1, [
        ...PublicKeyArgGroups.GENERIC,
      ]);

      // Determine if this is a Solana source swap
      const isSolanaSource = request.fromChain === 'solana';
      let usdcAmount: string;
      let bridgeProvider: 'relay' | 'debridge' = 'relay';

      if (isSolanaSource) {
        // Calculate bridge USDC amount for Solana swaps
        const solanaChainId = SB58_CHAIN_ID_SOLANA_MAINNET;

        // Convert amount to lamports
        const amountBN = BigNumber(request.amount);
        const amountInLamports = amountBN.shiftedBy(9).toFixed(0);

        const depositorAddress = this.silentswap.s0xDepositorAddress;
        const phonyDepositCalldata = createPhonyDepositCalldata(request.evmAddress as `0x${string}`);

        const bridgeResult: SolveUsdcResult = await solveOptimalUsdcAmount(
          N_RELAY_CHAIN_ID_SOLANA,
          SB58_ADDR_SOL_PROGRAM_SYSTEM,
          amountInLamports,
          request.senderAddress, // Solana address
          phonyDepositCalldata,
          X_MAX_IMPACT_PERCENT,
          depositorAddress,
          request.evmAddress as `0x${string}`,
        );

        usdcAmount = bridgeResult.usdcAmountOut.toString();
        bridgeProvider = bridgeResult.provider;
      } else {
        // Direct USDC amount for EVM swaps
        const amountBN = BigNumber(request.amount);
        usdcAmount = amountBN.shiftedBy(6).toFixed(0); // USDC has 6 decimals
      }

      // Create destination CAIP-19
      const destinationCaip19 = request.toChain === 'solana'
        ? caip19SplToken(
            SB58_CHAIN_ID_SOLANA_MAINNET,
            request.toToken // SPL token mint address
          )
        : caip19FungibleEvmToken(
            this.getChainId(request.toChain),
            request.toToken as `0x${string}`
          );

      // Log the quote request details for debugging
      console.log('[SilentSwapService] Quote request details:');
      console.log('  - signer (EVM address):', request.evmAddress);
      console.log('  - viewer public key length:', pk65_viewer.length);
      console.log('  - recipient:', request.recipientAddress);
      console.log('  - asset (CAIP-19):', destinationCaip19);
      console.log('  - value (USDC amount):', usdcAmount);
      console.log('  - facilitatorPublicKeys count:', groupPublicKeys[0]?.length || 0);
      console.log('  - environment:', process.env.SILENTSWAP_ENVIRONMENT || 'STAGING');

      // Request quote
      const quoteRequest = {
        signer: request.evmAddress as `0x${string}`,
        viewer: pk65_viewer,
        outputs: [
          {
            method: DeliveryMethod.SNIP,
            recipient: request.recipientAddress,
            asset: destinationCaip19,
            value: usdcAmount as `${bigint}`,
            facilitatorPublicKeys: groupPublicKeys[0],
          },
        ],
      };

      console.log('[SilentSwapService] Full quote request:', JSON.stringify({
        ...quoteRequest,
        viewer: `<${pk65_viewer.length} bytes>`,
        outputs: quoteRequest.outputs.map(o => ({
          ...o,
          facilitatorPublicKeys: `<${o.facilitatorPublicKeys?.length || 0} keys>`,
        })),
      }, null, 2));

      const [quoteError, quoteResponse] = await this.silentswap.quote(quoteRequest);

      if (quoteError || !quoteResponse) {
        console.error('[SilentSwapService] Quote error details:', JSON.stringify(quoteError, null, 2));
        throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
      }

      return {
        quoteId: quoteResponse.quoteId,
        estimatedOutput: BigNumber(usdcAmount).shiftedBy(-6).toFixed(),
        estimatedFee: '0.5', // TODO: Calculate actual fee from quote
        bridgeProvider,
        route: {
          sourceChain: request.fromChain,
          destinationChain: request.toChain,
          bridgeViaUsdc: isSolanaSource,
        },
        rawQuote: quoteResponse, // Return full quote for iOS to process
      };
    } catch (error) {
      console.error('[SilentSwapService] Quote failed:', error);
      throw error;
    }
  }

  /**
   * Get EIP-712 document for order signing
   * iOS will use this to sign the order with Privy EVM wallet
   */
  getOrderEip712(quoteResponse: any): any {
    return quoteResponseToEip712Document(quoteResponse);
  }

  // MARK: - Execute Swap

  async executeSwap(request: SilentSwapExecuteRequest): Promise<SilentSwapExecuteResponse> {
    try {
      // Recreate facilitator group from entropy
      const group = await this.getFacilitatorGroup(request.evmAddress, request.entropy);

      // Approve proxy authorizations using facilitator keys (not user keys)
      // This is the only operation that uses facilitator-derived keys
      const facilitatorReplies = await group.approveProxyAuthorizations(
        request.rawQuote?.facilitators || [],
        {
          proxyPublicKey: this.silentswap.proxyPublicKey,
        }
      );

      // Place the order with user's signatures
      const [orderError, orderResponse] = await this.silentswap.order({
        quote: request.rawQuote?.quote,
        quoteId: request.quoteId,
        authorizations: request.signedAuthorizations as any,
        eip712Domain: request.eip712Domain,
        signature: request.orderSignature as `0x${string}`,
        facilitators: facilitatorReplies,
      });

      if (orderError || !orderResponse) {
        throw new Error(`Failed to place order: ${orderError?.type}: ${orderError?.error}`);
      }

      return {
        orderId: orderResponse.response.orderId,
        status: 'pending',
        transaction: orderResponse.transaction, // iOS will send this transaction
        estimatedCompletionTime: 300, // 5 minutes estimate
      };
    } catch (error) {
      console.error('[SilentSwapService] Execute swap failed:', error);
      throw error;
    }
  }

  // MARK: - Status

  async getSwapStatus(orderId: string): Promise<SilentSwapStatusResponse> {
    try {
      // TODO: Implement status tracking via SilentSwap API
      // For now, return a basic response
      return {
        orderId,
        status: 'pending',
      };
    } catch (error) {
      console.error('[SilentSwapService] Get swap status failed:', error);
      throw error;
    }
  }

  // MARK: - Supported Tokens

  /**
   * Get supported tokens for all chains
   * This is a static list for now, could be fetched from SilentSwap API in the future
   */
  async getSupportedTokens(): Promise<Record<string, any[]>> {
    return {
      solana: [
        {
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          mint: null, // Native token
          address: 'native',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
      ethereum: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          address: 'native',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
      ],
      avalanche: [
        {
          symbol: 'AVAX',
          name: 'Avalanche',
          decimals: 18,
          address: 'native',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        },
      ],
    };
  }

  // MARK: - Helpers

  private getChainId(chain: string): number {
    switch (chain) {
      case 'ethereum':
        return 1;
      case 'avalanche':
        return 43114;
      default:
        throw new Error(`Unsupported EVM chain: ${chain}`);
    }
  }

  // MARK: - Solana Helper (for monitoring completion)

  async watchForSolanaCompletion(
    tokenMint: string,
    recipientAddress: string,
    timeoutSeconds: number = 300
  ): Promise<boolean> {
    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const mintPubkey = new PublicKey(tokenMint);
      const ata = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

      const startTime = Date.now();
      const timeoutMs = timeoutSeconds * 1000;

      while (Date.now() - startTime < timeoutMs) {
        try {
          const account = await getAccount(this.solanaConnection, ata);
          if (account.amount > 0n) {
            console.log(`[SilentSwapService] Tokens received: ${account.amount.toString()}`);
            return true;
          }
        } catch (err) {
          // Account doesn't exist yet, continue polling
        }

        // Poll every 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return false; // Timeout
    } catch (error) {
      console.error('[SilentSwapService] Watch for completion failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const silentSwapService = new SilentSwapService();
