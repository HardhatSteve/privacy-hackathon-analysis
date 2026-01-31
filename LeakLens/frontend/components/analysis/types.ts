// ============================================================================
// COMPREHENSIVE TYPE DEFINITIONS FOR ANALYSIS DATA
// ============================================================================

export interface ActivityPattern {
  hourly: number[]
  daily: number[]
}

export interface GeographicOrigin {
  europe: number
  americas: number
  asia_pacific: number
  other: number
}

export interface TraderClassification {
  retail: number
  institutional: number
  professional: number
}

export interface ProfileClassification {
  bot: number
  institutional: number
  whale: number
  airdrop_farmer: number
  professional: number
}

export interface TransactionComplexity {
  hour: number
  compute_units: number
  type: string
}

export interface RiskAssessment {
  level: string
  score: number
  low_risk: number
  medium_risk: number
  high_risk: number
}

export interface SurveillanceSignals {
  swap_count: number
  swap_signal: number
  memecoin_ratio: number
  memecoin_signal: number
  active_hours_entropy: number
  repeated_counterparties: number
  counterparty_signal: number
  mev_execution_detected: boolean
  stablecoin_income_detected: boolean
  portfolio_concentration: number
  concentration_signal: number
}

export interface SurveillanceExposure {
  surveillance_score: number
  risk_level: string
  top_leak_vectors: string[]
  signals: SurveillanceSignals
}

export interface MempoolProfiles {
  RETAIL: number
  URGENT_USER: number
  PRO_TRADER: number
  MEV_STYLE: number
}

export interface MempoolStatistics {
  avg_priority_fee_microlamports: number
  total_jito_tips_sol: number
  jito_tip_count: number
  jito_tip_percentage: number
}

export interface MempoolForensics {
  wallet: string
  total_transactions: number
  profiles: MempoolProfiles
  profile_percentages: MempoolProfiles
  aggregate_profile: string
  statistics: MempoolStatistics
}

export interface CriticalLeak {
  type: string
  detail: string
  deanon_impact: string
}

export interface FundingSource {
  wallet: string
  label: string
  count: number
  total_sol: number
}

export interface OpsecFailures {
  wallet: string
  total_transactions: number
  critical_leaks: CriticalLeak[]
  funding_sources: FundingSource[]
  withdrawal_targets: FundingSource[]
  memo_usage: number
  exposure_score: number
  cumulative_exposure: string
  weakest_link: string
}

export interface TokenInfo {
  symbol: string
  usdValue: number
}

export interface PortfolioSummary {
  total: number
  stablePct: number
  memePct: number
  topConcentration: number
  topTokens: TokenInfo[]
}

export interface NetWorth {
  sol_balance: number
  token_count: number
  stable_token_count: number
  meme_token_count: number
  top_tokens: TokenInfo[]
  total_usd: number
  sol_price: number
  debug: { status: string }
}

export interface TradingPnL {
  window: { transactions_used: number }
  totals: {
    distinct_pairs: number
    realized_pnl_sol: number
    realized_pnl_stable: number
    realized_pnl_usd: number
    usd_available: boolean
  }
  by_token: any[]
  top_losses: any[]
  top_wins: any[]
  debug: any
  note: string
}

export interface IncomeSources {
  sol_received: { count: number; total_sol: number }
  stable_received: { count: number; total_stable: number }
  tokens_received: { count: number; unique_mints: number }
  debug: any
}

export interface NetworkNode {
  id: string
  label: string
  type: string
  score?: number
  node_type: string
  node_label: string
  color: string
  icon: string
  risk_level: string
  description?: string
}

export interface NetworkEdge {
  source: string
  target: string
  reason: string
  strength: number
  confidence: number
  weight: number
  interactions: number
  total_sol: number
  inflows: number
  outflows: number
  has_funding: boolean
  has_cashout: boolean
  has_timing: boolean
  has_repeated: boolean
}

export interface StrongestLink {
  address: string
  label: string
  score: number
  confidence: number
  reasons: string
}

export interface RepeatedCounterparty {
  address: string
  label: string
  interactions: number
  confidence: number
}

export interface NetworkSummary {
  strongest_links: StrongestLink[]
  exchanges: any[]
  repeated_counterparties: RepeatedCounterparty[]
  risk_highlights: string[]
}

export interface EgoNetwork {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  total_links: number
  summary: NetworkSummary
  note: string
  debug: any
}

export interface SleepWindow {
  start_hour: number
  end_hour: number
  confidence: number
}

export interface ReactionSpeed {
  bot_confidence: number
  avg_reaction_time: number
  median_reaction_time: number
  fastest_reaction: number
  instant_reactions: number
  fast_reactions: number
  human_reactions: number
  total_pairs: number
}

export interface AnalysisResult {
  wallet: string
  chain: string
  total_transactions: number
  confidence: string
  most_recent_transaction: string
  activity_pattern: ActivityPattern
  geographic_origin: GeographicOrigin
  trader_classification: TraderClassification
  profile_classification: ProfileClassification
  transaction_complexity: TransactionComplexity[]
  risk_assessment: RiskAssessment
  surveillance_exposure: SurveillanceExposure
  key_insights: string[]
  mempool_forensics: MempoolForensics
  opsec_failures: OpsecFailures
  portfolio: { tokens: any[]; totalValue: number }
  portfolio_summary: PortfolioSummary
  portfolio_debug: any
  net_worth: NetWorth
  token_trading_pnl: TradingPnL
  income_sources: IncomeSources
  ego_network: EgoNetwork
  notable_transactions: { count: number; transactions: any[] }
  sleep_window: SleepWindow
  reaction_speed: ReactionSpeed
}
