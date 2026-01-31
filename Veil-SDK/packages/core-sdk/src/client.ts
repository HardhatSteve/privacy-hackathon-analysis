import {
  VeilConfig,
  PrivacyTransactionInput,
  PrivacyTransactionResult,
  SimulationResult,
  InspectionReport,
  AdapterContext
} from './types';
import { NotImplementedError, ConfigurationError } from './errors';
import { AdapterRegistry } from './registry';
import { PrivacyAdapter } from './adapter-contract';

export class VeilClient {
  private config: VeilConfig;
  private registry: AdapterRegistry;

  constructor(config: VeilConfig) {
    if (!config.rpcUrl) {
      throw new ConfigurationError('rpcUrl is required');
    }
    this.config = config;
    this.registry = new AdapterRegistry();
  }

  registerAdapter(adapter: PrivacyAdapter): void {
    this.registry.register(adapter);

    // Auto-selection:
    // 1. Explicit default in config takes precedence.
    // 2. If no default is set and this is the first adapter, use it for convenience.
    if (this.config.defaultAdapter && adapter.metadata.name === this.config.defaultAdapter) {
      this.registry.select(adapter.metadata.name);
    }
    
    if (!this.config.defaultAdapter && this.registry.getAvailableAdapters().length === 1) {
        this.registry.select(adapter.metadata.name);
    }
  }

  selectAdapter(name: string): void {
    this.registry.select(name);
  }

  private getContext(): AdapterContext {
    // Wallet is lazily checked here rather than at construction
    // because some read-only operations might not need it.
    if (!this.config.wallet) {
      throw new ConfigurationError('Wallet is required for this operation.');
    }
    return {
      wallet: this.config.wallet,
      config: this.config
    };
  }

  async send(input: PrivacyTransactionInput): Promise<PrivacyTransactionResult> {
    const adapter = this.registry.getActive();
    return adapter.send(input, this.getContext());
  }

  async simulate(input: PrivacyTransactionInput): Promise<SimulationResult> {
    const adapter = this.registry.getActive();
    return adapter.simulate(input, this.getContext());
  }

  async inspect(input: PrivacyTransactionInput): Promise<InspectionReport> {
    const adapter = this.registry.getActive();
    return adapter.inspect(input, this.getContext());
  }
}

export function createVeilClient(config: VeilConfig): VeilClient {
  return new VeilClient(config);
}
