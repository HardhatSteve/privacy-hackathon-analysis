import { Connection, PublicKey } from "@solana/web3.js";
import type { Config } from "./config.js";
import { loadFromEnv } from "./config.js";
import type { PrivateTransferProvider, ZKVerifier, PrivacyBackend } from "./interfaces.js";
import { MockBackend } from "./backends/mock.js";
import { ShadowWireBackend } from "./backends/shadowwire.js";

export type PrivacyBackendInstance = PrivateTransferProvider & ZKVerifier;

function createBackend(name: PrivacyBackend, config: Config): PrivacyBackendInstance {
  switch (name) {
    case "mock":
      return new MockBackend();
    case "shadowwire": {
      const wallet = config.shadowwireWallet;
      if (!wallet) {
        throw new Error(
          "ShadowWire backend requires config.shadowwireWallet (or SHADOWWIRE_WALLET). Run privacy init and set wallet, or set SHADOWWIRE_WALLET."
        );
      }
      return new ShadowWireBackend({
        wallet,
        apiKey: config.shadowwireApiKey,
        apiBaseUrl: undefined,
      });
    }
    case "arcium":
      throw new Error(`Backend "${name}" is not implemented yet. Use "mock" or "shadowwire".`);
    default:
      throw new Error(`Unknown backend: ${name}`);
  }
}

let defaultClient: PrivacyClient | null = null;

/**
 * Privacy client for Solana (uses @solana/web3.js Connection).
 * Has a backend (PrivateTransferProvider & ZKVerifier); defaults to MockBackend.
 * When config has shadowwireApiKey, setBackend('shadowwire') is used automatically.
 */
export class PrivacyClient {
  readonly connection: Connection;
  backend: PrivacyBackendInstance;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl);
    this.backend =
      config.shadowwireApiKey && config.shadowwireWallet
        ? createBackend("shadowwire", config)
        : new MockBackend();
  }

  /**
   * Set the privacy backend by name (uses stored config for shadowwire).
   */
  setBackend(backend: PrivacyBackend): void {
    this.backend = createBackend(backend, this.config);
  }

  /**
   * Get balance in lamports for a public key.
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    return this.connection.getBalance(publicKey);
  }
}

/**
 * Return the default client (singleton, lazy-initialized with loadFromEnv).
 * Used by transfers.ts and proofs.ts so standalone functions use the client's backend.
 */
export function getDefaultClient(): PrivacyClient {
  if (defaultClient == null) {
    defaultClient = new PrivacyClient(loadFromEnv());
  }
  return defaultClient;
}

/**
 * Set the default client (e.g. for testing or after custom config).
 */
export function setDefaultClient(client: PrivacyClient | null): void {
  defaultClient = client;
}
