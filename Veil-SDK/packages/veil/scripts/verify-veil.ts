import { createVeil, PrivacyLevel } from '../src/index';
import { Keypair } from '@solana/web3.js';

async function main() {
  console.log('--- Verifying High-Level Veil API ---');

  const keypair = Keypair.generate();
  const mockWallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => {
      console.log('  [Wallet] Signing...');
      if (tx.partialSign) tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return Promise.all(txs.map(tx => mockWallet.signTransaction(tx)));
    }
  };

  console.log('Initializing Veil with minimal config...');
  const veil = createVeil({
    wallet: mockWallet,
  });

  console.log(`Veil initialized. Network: ${veil.raw['config'].network}`);
  console.log(`RPC URL: ${veil.raw['config'].rpcUrl}`);

  const recipient = Keypair.generate().publicKey.toBase58();
  const input = {
    to: recipient,
    amount: BigInt(1000),
    privacyLevel: PrivacyLevel.Public,
  };

  console.log('\n--- Testing veil.inspect() ---');
  const report = await veil.inspect(input);
  console.log('Privacy Score:', report.privacyScore);

  console.log('\n--- Testing veil.simulate() ---');
  try {
    const simulation = await veil.simulate(input);
    console.log('Simulation successful:', simulation.success);
  } catch (err: any) {
    console.log('Simulation call finished (result depends on RPC connectivity)');
  }

  console.log('\n--- Testing Escape Hatch (veil.raw) ---');
  const availableAdapters = veil.raw['registry'].getAvailableAdapters();
  console.log('Available Adapters in Core:', availableAdapters);

  if (availableAdapters.includes('NoopPrivacyAdapter')) {
    console.log('✅ Escape hatch verified: Access to internal registry works.');
  } else {
    console.error('❌ Escape hatch failed.');
    process.exit(1);
  }

  console.log('\n--- DX Verification Complete ---');
}

main().catch(console.error);
