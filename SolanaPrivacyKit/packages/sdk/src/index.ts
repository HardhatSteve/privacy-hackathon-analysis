export { PrivacyClient, getDefaultClient, setDefaultClient } from "./client.js";
export {
  loadFromEnv,
  DEFAULT_RPC_URL,
  DEFAULT_NETWORK,
  type Config,
} from "./config.js";
export {
  type PrivateTransferProvider,
  type ZKVerifier,
  type PrivacyBackend,
} from "./interfaces.js";
export { MockBackend } from "./backends/mock.js";
export { ShadowWireBackend, type ShadowWireBackendConfig } from "./backends/shadowwire.js";
export {
  shieldAmount,
  createPrivateTransfer,
  unshieldAmount,
  type ShieldResult,
  type TransferResult,
  type UnshieldResult,
} from "./transfers.js";
export { verifyZKProof, validateProofFormat } from "./proofs.js";
