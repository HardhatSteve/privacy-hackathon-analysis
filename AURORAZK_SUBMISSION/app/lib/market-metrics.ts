/**
 * Market Metrics for AuroraZK
 * Privacy-preserving aggregate market data
 * 
 * These metrics only reveal AGGREGATE data (counts and ratios),
 * never individual orders, prices, or sizes.
 */

// ============================================
// IMBALANCE INDICATOR
// ============================================

export interface ImbalanceMetric {
  buyCount: number;
  sellCount: number;
  ratio: number; // 0-100, where 50 = perfectly balanced
  pressure: 'strong_buying' | 'buying' | 'balanced' | 'selling' | 'strong_selling';
  confidence: 'high' | 'medium' | 'low';
}

export function calculateImbalance(buyOrderCount: number, sellOrderCount: number): ImbalanceMetric {
  const total = buyOrderCount + sellOrderCount;
  
  // Handle edge case
  if (total === 0) {
    return {
      buyCount: 0,
      sellCount: 0,
      ratio: 50,
      pressure: 'balanced',
      confidence: 'low',
    };
  }
  
  const ratio = Math.round((buyOrderCount / total) * 100);
  
  // Determine pressure level
  let pressure: ImbalanceMetric['pressure'] = 'balanced';
  if (ratio >= 70) pressure = 'strong_buying';
  else if (ratio >= 57) pressure = 'buying';
  else if (ratio <= 30) pressure = 'strong_selling';
  else if (ratio <= 43) pressure = 'selling';
  
  // Confidence based on sample size
  let confidence: ImbalanceMetric['confidence'] = 'low';
  if (total >= 20) confidence = 'high';
  else if (total >= 8) confidence = 'medium';
  
  return {
    buyCount: buyOrderCount,
    sellCount: sellOrderCount,
    ratio,
    pressure,
    confidence,
  };
}

// Helper to get display text
export function getImbalanceLabel(pressure: ImbalanceMetric['pressure']): string {
  switch (pressure) {
    case 'strong_buying': return 'Strong Buy Pressure';
    case 'buying': return 'Moderate Buy Pressure';
    case 'balanced': return 'Balanced';
    case 'selling': return 'Moderate Sell Pressure';
    case 'strong_selling': return 'Strong Sell Pressure';
  }
}

// Get color for UI
export function getImbalanceColor(pressure: ImbalanceMetric['pressure']): string {
  switch (pressure) {
    case 'strong_buying': return '#22c55e'; // green-500
    case 'buying': return '#4ade80'; // green-400
    case 'balanced': return '#a855f7'; // purple-500
    case 'selling': return '#f87171'; // red-400
    case 'strong_selling': return '#ef4444'; // red-500
  }
}

// ============================================
// ORDER FLOW MOMENTUM
// ============================================

export interface OrderActivity {
  timestamp: number;
  side: 'buy' | 'sell';
  action: 'placed' | 'cancelled' | 'filled';
}

export interface MomentumMetric {
  momentum: number; // -100 (strong distribution) to +100 (strong accumulation)
  interpretation: 'strong_accumulation' | 'accumulation' | 'neutral' | 'distribution' | 'strong_distribution';
  confidence: 'high' | 'medium' | 'low';
  recentBuyActivity: number;
  recentSellActivity: number;
  windowMinutes: number;
}

export function calculateMomentum(
  activityLog: OrderActivity[], 
  windowMinutes: number = 15
): MomentumMetric {
  const cutoff = Date.now() - (windowMinutes * 60 * 1000);
  const recentActivity = activityLog.filter(a => a.timestamp > cutoff);
  
  // Count activities by type
  const newBuys = recentActivity.filter(a => a.side === 'buy' && a.action === 'placed').length;
  const newSells = recentActivity.filter(a => a.side === 'sell' && a.action === 'placed').length;
  const cancelledBuys = recentActivity.filter(a => a.side === 'buy' && a.action === 'cancelled').length;
  const cancelledSells = recentActivity.filter(a => a.side === 'sell' && a.action === 'cancelled').length;
  const filledBuys = recentActivity.filter(a => a.side === 'buy' && a.action === 'filled').length;
  const filledSells = recentActivity.filter(a => a.side === 'sell' && a.action === 'filled').length;
  
  // Net flow calculation
  // Positive = more buy activity (accumulation)
  // Negative = more sell activity (distribution)
  const buyFlow = newBuys - cancelledBuys + filledBuys;
  const sellFlow = newSells - cancelledSells + filledSells;
  
  const totalFlow = Math.abs(buyFlow) + Math.abs(sellFlow);
  
  // Calculate momentum score (-100 to +100)
  let momentum = 0;
  if (totalFlow > 0) {
    momentum = Math.round(((buyFlow - sellFlow) / totalFlow) * 100);
  }
  
  // Clamp to range
  momentum = Math.max(-100, Math.min(100, momentum));
  
  // Determine interpretation
  let interpretation: MomentumMetric['interpretation'] = 'neutral';
  if (momentum >= 50) interpretation = 'strong_accumulation';
  else if (momentum >= 20) interpretation = 'accumulation';
  else if (momentum <= -50) interpretation = 'strong_distribution';
  else if (momentum <= -20) interpretation = 'distribution';
  
  // Confidence based on activity volume
  let confidence: MomentumMetric['confidence'] = 'low';
  if (recentActivity.length >= 15) confidence = 'high';
  else if (recentActivity.length >= 6) confidence = 'medium';
  
  return {
    momentum,
    interpretation,
    confidence,
    recentBuyActivity: buyFlow,
    recentSellActivity: sellFlow,
    windowMinutes,
  };
}

// Helper to get display text
export function getMomentumLabel(interpretation: MomentumMetric['interpretation']): string {
  switch (interpretation) {
    case 'strong_accumulation': return 'Strong Accumulation';
    case 'accumulation': return 'Accumulation';
    case 'neutral': return 'Neutral';
    case 'distribution': return 'Distribution';
    case 'strong_distribution': return 'Strong Distribution';
  }
}

// Get color for UI
export function getMomentumColor(interpretation: MomentumMetric['interpretation']): string {
  switch (interpretation) {
    case 'strong_accumulation': return '#22c55e'; // green-500
    case 'accumulation': return '#4ade80'; // green-400
    case 'neutral': return '#a855f7'; // purple-500
    case 'distribution': return '#f87171'; // red-400
    case 'strong_distribution': return '#ef4444'; // red-500
  }
}
