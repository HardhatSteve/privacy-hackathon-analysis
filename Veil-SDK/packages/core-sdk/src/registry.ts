import { PrivacyAdapter } from './adapter-contract';
import { AdapterError } from './types';

export class AdapterRegistry {
  private adapters: Map<string, PrivacyAdapter> = new Map();
  private activeAdapterName: string | null = null;

  register(adapter: PrivacyAdapter): void {
    if (this.adapters.has(adapter.metadata.name)) {
      throw new AdapterError(`Adapter '${adapter.metadata.name}' is already registered.`);
    }
    this.adapters.set(adapter.metadata.name, adapter);
  }

  select(name: string): void {
    if (!this.adapters.has(name)) {
      throw new AdapterError(`Adapter '${name}' not found.`);
    }
    this.activeAdapterName = name;
  }

  getActive(): PrivacyAdapter {
    if (!this.activeAdapterName) {
      throw new AdapterError('No active privacy adapter selected.');
    }
    const adapter = this.adapters.get(this.activeAdapterName);
    if (!adapter) {
       throw new AdapterError(`Active adapter '${this.activeAdapterName}' is not registered.`);
    }
    return adapter;
  }

  get(name: string): PrivacyAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new AdapterError(`Adapter '${name}' not found.`);
    }
    return adapter;
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
}
