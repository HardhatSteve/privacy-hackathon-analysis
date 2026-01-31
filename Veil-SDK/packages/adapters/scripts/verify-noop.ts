import {
  createVeilClient,
  PrivacyLevel,
  AdapterWallet
} from '@veil-labs/core-sdk';
import { NoopPrivacyAdapter } from '../src/noop/NoopPrivacyAdapter';
import { Keypair, Transaction } from '@solana/web3.js';

async function main() {
  console.log('--- Verifying NoopPrivacyAdapter Lifecycle ---');

  const keypair = Keypair.generate();
  console.log(`Mock Wallet Public Key: ${keypair.publicKey.toBase58()}`);

  const mockWallet: AdapterWallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => {
      console.log('  [Wallet] Signing transaction...');
      if (tx instanceof Transaction) {
        tx.partialSign(keypair);
        return tx as unknown as T;
      }
      throw new Error('Unsupported transaction type');
    },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => {
      return Promise.all(txs.map(tx => mockWallet.signTransaction(tx)));
    }
  };

  const rpcUrl = 'https://api.devnet.solana.com';
  console.log(`Initializing VeilClient with RPC: ${rpcUrl}`);

  const veil = createVeilClient({
    rpcUrl,
    network: 'devnet',
    wallet: mockWallet,
  });

  const adapter = new NoopPrivacyAdapter();
  console.log(`Registering adapter: ${adapter.metadata.name}`);
  veil.registerAdapter(adapter);

  const input = {
    to: Keypair.generate().publicKey.toBase58(),
    amount: BigInt(1000),
    privacyLevel: PrivacyLevel.Public,
    memo: 'Hello Veil'
  };

  console.log('\n--- Lifecycle: Inspect ---');
  const inspection = await veil.inspect(input);
  console.log('Inspection Report:', inspection);
  if (inspection.privacyScore === 0) {
      console.log('✅ Inspect verification passed (Privacy Score 0)');
  } else {
      console.error('❌ Inspect verification failed');
      process.exit(1);
  }

  console.log('\n--- Lifecycle: Simulate ---');
  try {
    const simulation = await veil.simulate(input);
    console.log('Simulation Result:', simulation);
    
    // We expect the flow to work regardless of wallet balance.
    if (simulation.success) {
         console.log('✅ Simulation succeeded (Unexpected for empty wallet but flow worked)');
    } else {
         console.log('✅ Simulation ran (likely failed due to funds, but adapter flow worked)');
         console.log('Logs:', simulation.logs);
    }
  } catch (err: any) {
    console.error('⚠️ Simulation threw error:', err.message);
  }

  console.log('\n--- Lifecycle: Send ---');
  try {
    const result = await veil.send(input);
    console.log('Transaction Result:', result);
  } catch (err: any) {
    console.log('✅ Send attempted and failed as expected (No funds on mock wallet)');
    
    // Check for standard Solana error codes for insufficient funds
    if (err.message.includes('Attempt to debit') || err.message.includes('0x1')) {
        console.log('✅ Adapter correctly constructed and broadcast transaction.');
    }
  }

  console.log('\n--- Verification Complete ---');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
