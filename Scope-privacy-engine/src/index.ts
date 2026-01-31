/**
 * Privacy Engine - Main Entry Point
 * Re-exports the main analysis function and types
 */

// Main engine
export { analyzeWallet, formatReportForConsole } from "./engine";
export type { PrivacyReport, Warning, Recommendation } from "./engine";

// Constants
export {
  KNOWN_CEX,
  RiskLevel,
  SCORE_THRESHOLDS,
  POINT_DEDUCTIONS,
  RECOMMENDED_TOOLS,
  WARNING_MESSAGES,
  ACTION_RECOMMENDATIONS,
  ANALYSIS_CONFIG,
} from "./utils/constants";
export type { RecommendedTool } from "./utils/constants";

// Services
export { HeliusService, heliusService } from "./services/helius";
export type {
  ParsedTransaction,
  TokenTransfer,
  NativeTransfer,
} from "./services/helius";

export { checkRisk, batchCheckRisk, quickCheck } from "./services/range";
export type { RangeCheckResult, RiskStatus } from "./services/range";

// Detectors
export {
  detectCEXTransactions,
  isKnownCEX,
  getCEXName,
} from "./detectors/cex";
export type { CEXDetectionResult, CEXTransaction } from "./detectors/cex";

export { detectClustering, detectWashTrading } from "./detectors/clustering";
export type {
  ClusteringResult,
  AddressFrequency,
  ClusterPattern,
} from "./detectors/clustering";

export { detectIdentityAssets } from "./detectors/assets";
export type { AssetsDetectionResult, NFTAsset } from "./detectors/assets";
