import {
  createVeilClient,
  VeilClient,
  VeilConfig,
  PrivacyTransactionInput,
  PrivacyTransactionResult,
  SimulationResult,
  InspectionReport,
  AdapterWallet,
  PrivacyLevel
} from '@veil-labs/core-sdk';
import { NoopPrivacyAdapter } from '@veil-labs/adapters';

export {
  PrivacyTransactionInput,
  PrivacyTransactionResult,
  SimulationResult,
  InspectionReport,
  AdapterWallet,
  PrivacyLevel
};

export interface VeilOptions {
  wallet: AdapterWallet;
  network?: 'mainnet-beta' | 'devnet' | 'localnet';
  rpcUrl?: string;
  silent?: boolean;
}

export interface Veil {
  send(input: PrivacyTransactionInput): Promise<PrivacyTransactionResult>;
  simulate(input: PrivacyTransactionInput): Promise<SimulationResult>;
  inspect(input: PrivacyTransactionInput): Promise<InspectionReport>;
  /**
   * Access to the underlying Core SDK client.
   * Useful for manual adapter management or advanced configuration.
   */
  raw: VeilClient;
}

const DEFAULT_NETWORK = 'devnet';
const PUBLIC_RPC_URLS = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'localnet': 'http://127.0.0.1:8899'
};

export function createVeil(options: VeilOptions): Veil {
  const network = options.network || DEFAULT_NETWORK;
  const rpcUrl = options.rpcUrl || PUBLIC_RPC_URLS[network];

  const coreConfig: VeilConfig = {
    rpcUrl,
    network,
    wallet: options.wallet,
  };

  const client = createVeilClient(coreConfig);

  // Auto-register the default Noop adapter for now.
  // This ensures the SDK is usable out-of-the-box, even if just for public transactions.
  const defaultAdapter = new NoopPrivacyAdapter();
  client.registerAdapter(defaultAdapter);
  client.selectAdapter(defaultAdapter.metadata.name);

  return {
    send: (input) => client.send(input),
    simulate: (input) => client.simulate(input),
    inspect: (input) => client.inspect(input),
    get raw() {
      return client;
    }
  };
}
