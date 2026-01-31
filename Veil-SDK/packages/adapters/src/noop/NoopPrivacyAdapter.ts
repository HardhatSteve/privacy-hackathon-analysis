import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  BasePrivacyAdapter,
  PrivacyTransactionInput,
  AdapterContext,
  PrivacyTransactionResult,
  SimulationResult,
  InspectionReport,
  AdapterMetadata,
  PrivacyLevel,
  AdapterError,
} from '@veil-labs/core-sdk';

/**
 * A minimal, honest implementation of a PrivacyAdapter.
 * It strictly performs vanilla Solana transactions with zero privacy.
 * Used for testing the SDK pipeline, wallet integration, and error handling.
 */
export class NoopPrivacyAdapter extends BasePrivacyAdapter {
  metadata: AdapterMetadata = {
    name: 'NoopPrivacyAdapter',
    supportedFeatures: {
      hideSender: false,
      hideRecipient: false,
      hideAmount: false,
      hideToken: false,
    },
    supportedNetworks: ['mainnet-beta', 'devnet', 'localnet'],
  };

  async send(
    input: PrivacyTransactionInput,
    context: AdapterContext
  ): Promise<PrivacyTransactionResult> {
    const connection = this.getConnection(context);
    const wallet = this.getWallet(context);

    const transaction = await this.buildTransaction(connection, wallet.publicKey, input);
    const signedTransaction = await wallet.signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();
    
    // We confirm immediately to ensure the "Noop" is atomic and reliable for testing.
    // In production privacy protocols, this flow is often asynchronous.
    const txId = await connection.sendRawTransaction(rawTransaction);
    
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txId,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    return {
      txId,
      privacyLevel: PrivacyLevel.Public,
      timestamp: Date.now(),
    };
  }

  async simulate(
    input: PrivacyTransactionInput,
    context: AdapterContext
  ): Promise<SimulationResult> {
    const connection = this.getConnection(context);
    const wallet = this.getWallet(context);

    const transaction = await this.buildTransaction(connection, wallet.publicKey, input);
    const signedTransaction = await wallet.signTransaction(transaction);

    const { value } = await connection.simulateTransaction(signedTransaction);

    return {
      success: !value.err,
      estimatedFee: BigInt(0), // Placeholder: Fee estimation is not critical for Noop
      logs: value.logs || [],
      unitsConsumed: value.unitsConsumed || 0,
    };
  }

  async inspect(
    input: PrivacyTransactionInput,
    context: AdapterContext
  ): Promise<InspectionReport> {
    return {
      privacyScore: 0,
      publiclyVisibleData: [
        'Sender Address',
        'Recipient Address',
        'Amount',
        'Token Mint',
        'Memo',
      ],
      warnings: [
        'NoopPrivacyAdapter provides NO privacy.',
        'All transaction details will be visible on-chain.',
      ],
    };
  }

  private getConnection(context: AdapterContext): Connection {
    if (!context.config.rpcUrl) {
      throw new AdapterError('RPC URL is required for NoopPrivacyAdapter');
    }
    return new Connection(context.config.rpcUrl);
  }

  private getWallet(context: AdapterContext) {
    if (!context.wallet || !context.wallet.publicKey) {
      throw new AdapterError('Wallet with public key is required for NoopPrivacyAdapter');
    }
    return context.wallet as { publicKey: { toBase58(): string; } } & typeof context.wallet;
  }

  private async buildTransaction(
    connection: Connection,
    payer: { toBase58(): string },
    input: PrivacyTransactionInput
  ): Promise<Transaction> {
    if (input.token) {
      throw new AdapterError('NoopPrivacyAdapter currently only supports SOL transfers');
    }

    const transaction = new Transaction();
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(payer.toBase58()),
        toPubkey: new PublicKey(input.to),
        lamports: input.amount,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(payer.toBase58());

    return transaction;
  }
}
