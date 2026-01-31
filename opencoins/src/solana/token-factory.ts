import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  ExtensionType,
  getMintLen,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from "@solana/spl-token";
import { getSolanaNetworkConfig } from "./network-config.js";
import { Logger } from "../utils/logger.js";
import {
  validateSolanaAddress,
  validateTokenName,
  validateTokenSymbol,
  validateDecimals,
  validateAndParseSupply,
} from "../utils/validation.js";

export interface SolanaDeploymentResult {
  mintAddress: string;
  transactionSignature: string;
  blockExplorer: string;
  network: string;
  authority: string;
}

export interface SolanaTokenParams {
  network: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  keypair: string; // Base58 encoded keypair
  feeCollector: string;
  metadataUri?: string;
}

export class SolanaTokenFactory {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Deploy a token on Solana using Token-2022 with transfer fee extension
   */
  async deployToken(
    params: SolanaTokenParams,
  ): Promise<SolanaDeploymentResult> {
    await this.logger.info("Starting Solana token deployment", {
      network: params.network,
      name: params.name,
      symbol: params.symbol,
    });

    // Validate inputs
    this.validateParams(params);

    // Get network configuration
    const networkConfig = getSolanaNetworkConfig(params.network);
    const connection = new Connection(networkConfig.rpcUrl, "confirmed");

    // Parse keypair from base58
    const payerKeypair = this.parseKeypair(params.keypair);
    const mintKeypair = Keypair.generate();

    await this.logger.debug("Connected to Solana network", {
      network: networkConfig.name,
      cluster: networkConfig.cluster,
      authority: payerKeypair.publicKey.toBase58(),
      mint: mintKeypair.publicKey.toBase58(),
    });

    // Parse supply
    const supplyBigInt = validateAndParseSupply(params.supply, params.decimals);
    const supply = Number(supplyBigInt);

    // Fee collector public key
    const feeCollectorPubkey = new PublicKey(params.feeCollector);

    // Calculate fee basis points (1% = 100 basis points)
    const feeBasisPoints = 100; // 1%
    const maxFee = BigInt(10 ** params.decimals); // Max fee per transaction

    await this.logger.info("Creating Token-2022 mint with transfer fee", {
      feeBasisPoints,
      maxFee: maxFee.toString(),
      feeCollector: params.feeCollector,
    });

    try {
      // Calculate mint size with extensions
      const extensions = [ExtensionType.TransferFeeConfig];
      const mintLen = getMintLen(extensions);

      // Get minimum lamports for rent exemption
      const lamports = await getMinimumBalanceForRentExemptMint(connection);

      // Create mint account
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Initialize transfer fee config
      const initializeTransferFeeConfigInstruction =
        createInitializeTransferFeeConfigInstruction(
          mintKeypair.publicKey,
          feeCollectorPubkey, // Transfer fee config authority
          feeCollectorPubkey, // Withdraw withheld authority
          feeBasisPoints,
          maxFee,
          TOKEN_2022_PROGRAM_ID,
        );

      // Initialize mint
      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        params.decimals,
        payerKeypair.publicKey,
        payerKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      );

      // Create transaction
      const transaction = new Transaction().add(
        createAccountInstruction,
        initializeTransferFeeConfigInstruction,
        initializeMintInstruction,
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payerKeypair, mintKeypair],
        { commitment: "confirmed" },
      );

      await this.logger.info("Mint created successfully", {
        signature,
        mint: mintKeypair.publicKey.toBase58(),
      });

      // Create associated token account for minting
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        payerKeypair.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      const createATAInstruction = createAssociatedTokenAccountInstruction(
        payerKeypair.publicKey,
        associatedTokenAddress,
        payerKeypair.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      );

      // Mint initial supply
      const mintToInstruction = createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAddress,
        payerKeypair.publicKey,
        supply,
        [],
        TOKEN_2022_PROGRAM_ID,
      );

      const mintTransaction = new Transaction().add(
        createATAInstruction,
        mintToInstruction,
      );

      const mintSignature = await sendAndConfirmTransaction(
        connection,
        mintTransaction,
        [payerKeypair],
        { commitment: "confirmed" },
      );

      await this.logger.logDeployment(
        "solana",
        params.network,
        mintKeypair.publicKey.toBase58(),
        params.name,
        params.symbol,
        signature,
      );

      const result: SolanaDeploymentResult = {
        mintAddress: mintKeypair.publicKey.toBase58(),
        transactionSignature: signature,
        blockExplorer: `${networkConfig.blockExplorer}/token/${mintKeypair.publicKey.toBase58()}?cluster=${networkConfig.cluster}`,
        network: networkConfig.name,
        authority: payerKeypair.publicKey.toBase58(),
      };

      await this.logger.info("Solana token deployment successful", result);

      return result;
    } catch (error) {
      await this.logger.error("Solana token deployment failed", {
        error: (error as Error).message,
        network: params.network,
      });
      throw error;
    }
  }

  /**
   * Validate deployment parameters
   */
  private validateParams(params: SolanaTokenParams): void {
    validateTokenName(params.name);
    validateTokenSymbol(params.symbol);
    validateDecimals(params.decimals, "solana");

    if (!validateSolanaAddress(params.feeCollector)) {
      throw new Error("Invalid fee collector address");
    }

    // Validate network exists
    getSolanaNetworkConfig(params.network);
  }

  /**
   * Parse keypair from base58 string or JSON
   */
  private parseKeypair(keypairString: string): Keypair {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(keypairString);
      if (Array.isArray(parsed)) {
        return Keypair.fromSecretKey(Uint8Array.from(parsed));
      }
    } catch {
      // Not JSON, try base58 decode
      // Note: You may need to add bs58 library for this
      throw new Error(
        "Keypair must be provided as JSON array of numbers (from keypair file)",
      );
    }
    throw new Error("Invalid keypair format");
  }

  /**
   * Get token information
   */
  async getTokenInfo(mintAddress: string, network: string) {
    const networkConfig = getSolanaNetworkConfig(network);
    const connection = new Connection(networkConfig.rpcUrl, "confirmed");
    const mintPublicKey = new PublicKey(mintAddress);

    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);

    if (!mintInfo.value || !("parsed" in mintInfo.value.data)) {
      throw new Error("Invalid mint address");
    }

    const data = mintInfo.value.data.parsed.info;

    return {
      mintAddress,
      decimals: data.decimals,
      supply: data.supply,
      mintAuthority: data.mintAuthority,
      freezeAuthority: data.freezeAuthority,
      network: networkConfig.name,
      blockExplorer: `${networkConfig.blockExplorer}/token/${mintAddress}?cluster=${networkConfig.cluster}`,
    };
  }
}
