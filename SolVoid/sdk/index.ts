// Export all public types
export * from './types';

// Export integrity module (server-side) - specific exports to avoid conflicts
export { 
  DataOrigin, 
  DataTrust, 
  Unit, 
  RelayRequestSchema, 
  RelayResponseSchema, 
  OnionLayerSchema, 
  enforce, 
  DataMetadata, 
  RelayResponse, 
  RelayRequest, 
  OnionLayer 
} from './integrity';

// Export privacy engine (core scanning & remediation detection)
export { PrivacyEngine } from './privacy-engine';
export { PrivacyPipeline } from './pipeline';

// Export Privacy Core (browser-safe)
export { PrivacyShield } from './privacy/shield';

// Export client (main entry point - browser safe)
export { SolVoidClient, SolVoidConfig } from './client';

// Export registry utilities
export { KNOWN_PROGRAMS, identifyProgram, isSwapProgram } from './registry/programs';

// Export event system (browser-safe)
export { EventBus, ForensicEvent } from './events/bus';

// Note: The following are server-side only and should be imported directly:
// - PrivacyRelayer from './privacy/relayer'
// - ShadowRPC from './network/shadow-rpc'
// - ConfigLoader from './utils/config'
// - OnChainIdlFetcher from './registry/idl-fetcher'
