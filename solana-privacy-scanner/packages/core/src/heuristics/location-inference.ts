import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Timezone regions with their UTC offsets and common names
 */
const TIMEZONE_REGIONS: Record<string, { offset: number; region: string }> = {
  'UTC-12': { offset: -12, region: 'Baker Island, Howland Island' },
  'UTC-11': { offset: -11, region: 'American Samoa, Niue' },
  'UTC-10': { offset: -10, region: 'Hawaii, Tahiti' },
  'UTC-9': { offset: -9, region: 'Alaska' },
  'UTC-8': { offset: -8, region: 'US Pacific (LA, San Francisco)' },
  'UTC-7': { offset: -7, region: 'US Mountain (Denver, Phoenix)' },
  'UTC-6': { offset: -6, region: 'US Central (Chicago, Dallas)' },
  'UTC-5': { offset: -5, region: 'US Eastern (NYC, Miami)' },
  'UTC-4': { offset: -4, region: 'Atlantic (Puerto Rico, Bermuda)' },
  'UTC-3': { offset: -3, region: 'Brazil, Argentina' },
  'UTC-2': { offset: -2, region: 'Mid-Atlantic' },
  'UTC-1': { offset: -1, region: 'Azores, Cape Verde' },
  'UTC+0': { offset: 0, region: 'UK, Portugal, West Africa' },
  'UTC+1': { offset: 1, region: 'Western Europe (Paris, Berlin)' },
  'UTC+2': { offset: 2, region: 'Eastern Europe (Cairo, Athens)' },
  'UTC+3': { offset: 3, region: 'Moscow, Middle East' },
  'UTC+4': { offset: 4, region: 'UAE, Armenia' },
  'UTC+5': { offset: 5, region: 'Pakistan, West Asia' },
  'UTC+5.5': { offset: 5.5, region: 'India, Sri Lanka' },
  'UTC+6': { offset: 6, region: 'Bangladesh, Central Asia' },
  'UTC+7': { offset: 7, region: 'Thailand, Vietnam, Indonesia' },
  'UTC+8': { offset: 8, region: 'China, Singapore, Hong Kong' },
  'UTC+9': { offset: 9, region: 'Japan, Korea' },
  'UTC+10': { offset: 10, region: 'Australia East (Sydney)' },
  'UTC+11': { offset: 11, region: 'Solomon Islands, Vanuatu' },
  'UTC+12': { offset: 12, region: 'New Zealand, Fiji' },
};

/**
 * Detect location-revealing patterns from transaction timing
 * Analyzes sleep gaps, activity hours, and day-of-week patterns
 */
export function detectLocationInference(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Need at least 20 transactions spread over at least 3 days for meaningful inference
  if (!context.transactions || context.transactions.length < 20) {
    return signals;
  }

  const timestamps = context.transactions
    .map(tx => tx.blockTime)
    .filter((time): time is number => time !== undefined)
    .sort((a, b) => a - b);

  if (timestamps.length < 20) {
    return signals;
  }

  // Check if transactions span at least 3 days
  const timeSpanDays = (timestamps[timestamps.length - 1] - timestamps[0]) / 86400;
  if (timeSpanDays < 3) {
    return signals;
  }

  // Detect sleep gaps
  const sleepAnalysis = analyzeSleepGaps(timestamps);
  if (sleepAnalysis) {
    signals.push(sleepAnalysis);
  }

  // Detect day-of-week patterns
  const dayOfWeekAnalysis = analyzeDayOfWeekPatterns(timestamps);
  if (dayOfWeekAnalysis) {
    signals.push(dayOfWeekAnalysis);
  }

  // Estimate timezone from combined analysis
  const timezoneEstimate = estimateTimezone(timestamps);
  if (timezoneEstimate) {
    signals.push(timezoneEstimate);
  }

  return signals;
}

/**
 * Analyze gaps in transaction activity to detect sleep patterns
 */
function analyzeSleepGaps(timestamps: number[]): PrivacySignal | null {
  // Group transactions by day
  const dayGroups = new Map<string, number[]>();
  timestamps.forEach(ts => {
    const date = new Date(ts * 1000);
    const dayKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, []);
    }
    dayGroups.get(dayKey)!.push(ts);
  });

  // Need at least 5 days to analyze sleep patterns
  if (dayGroups.size < 5) {
    return null;
  }

  // Calculate gaps between consecutive transactions
  const gaps: { gapHours: number; startHour: number; endHour: number }[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const gapSeconds = timestamps[i] - timestamps[i - 1];
    const gapHours = gapSeconds / 3600;

    // Look for gaps between 5-12 hours (typical sleep range)
    if (gapHours >= 5 && gapHours <= 12) {
      const startDate = new Date(timestamps[i - 1] * 1000);
      const endDate = new Date(timestamps[i] * 1000);
      gaps.push({
        gapHours,
        startHour: startDate.getUTCHours(),
        endHour: endDate.getUTCHours(),
      });
    }
  }

  // Need multiple sleep-like gaps to form a pattern
  if (gaps.length < 5) {
    return null;
  }

  // Analyze when these gaps typically occur (in UTC)
  const gapStartHours = gaps.map(g => g.startHour);

  // Find the most common gap start hour (with 2-hour tolerance)
  const hourBuckets = new Map<number, number>();
  gapStartHours.forEach(hour => {
    // Round to nearest 2-hour bucket
    const bucket = Math.round(hour / 2) * 2;
    hourBuckets.set(bucket, (hourBuckets.get(bucket) || 0) + 1);
  });

  // Find peak bucket
  let peakBucket = 0;
  let peakCount = 0;
  hourBuckets.forEach((count, bucket) => {
    if (count > peakCount) {
      peakCount = count;
      peakBucket = bucket;
    }
  });

  // At least 50% of gaps should cluster around the same hours
  const gapConcentration = peakCount / gaps.length;
  if (gapConcentration < 0.5) {
    return null;
  }

  // Average gap duration
  const avgGapHours = gaps.reduce((sum, g) => sum + g.gapHours, 0) / gaps.length;

  // Infer likely sleep time in UTC
  const sleepStartUTC = peakBucket;
  const sleepEndUTC = (peakBucket + Math.round(avgGapHours)) % 24;

  // Estimate timezone: if sleep typically starts around 10-11pm local time
  // and we see sleep starting at sleepStartUTC in UTC,
  // then local time = UTC + offset, so offset = local - UTC
  // Assuming sleep starts around 23:00 local: offset = 23 - sleepStartUTC
  const estimatedOffset = ((23 - sleepStartUTC) + 12) % 24 - 12;

  const evidence: Evidence[] = [{
    description: `${gaps.length} sleep-like gaps detected (avg ${avgGapHours.toFixed(1)} hours)`,
    severity: 'MEDIUM',
    reference: undefined,
  }, {
    description: `Gaps typically start around ${sleepStartUTC}:00-${(sleepStartUTC + 2) % 24}:00 UTC`,
    severity: 'MEDIUM',
    reference: undefined,
  }];

  return {
    id: 'location-sleep-pattern',
    name: 'Sleep Pattern Detected',
    severity: 'MEDIUM',
    confidence: 0.6 + (gapConcentration * 0.2), // Higher confidence with more consistent gaps
    category: 'behavioral',
    reason: `Your transaction history shows consistent ${avgGapHours.toFixed(1)}-hour gaps that look like sleep periods. These gaps typically start around ${sleepStartUTC}:00 UTC, suggesting you may be in a timezone around UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}.`,
    impact: 'Sleep patterns are one of the strongest indicators of geographic location. Combined with other timing data, this can narrow down where you live to a specific timezone.',
    mitigation: 'Schedule some transactions during your typical sleep hours using automation. Even occasional activity during sleep hours breaks this pattern.',
    evidence,
  };
}

/**
 * Analyze day-of-week activity patterns
 */
function analyzeDayOfWeekPatterns(timestamps: number[]): PrivacySignal | null {
  // Count transactions by day of week (0 = Sunday)
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  timestamps.forEach(ts => {
    const day = new Date(ts * 1000).getUTCDay();
    dayCounts[day]++;
  });

  // Calculate weekday vs weekend activity
  const weekdayCount = dayCounts[1] + dayCounts[2] + dayCounts[3] + dayCounts[4] + dayCounts[5];
  const weekendCount = dayCounts[0] + dayCounts[6];

  // Adjust for number of days (5 weekdays vs 2 weekend days)
  const weekdayRate = weekdayCount / 5;
  const weekendRate = weekendCount / 2;

  const totalTx = timestamps.length;
  const weekdayRatio = weekdayCount / totalTx;
  const weekendRatio = weekendCount / totalTx;

  // Check for significant imbalance (more than 2x rate difference)
  const rateRatio = weekdayRate > 0 && weekendRate > 0
    ? Math.max(weekdayRate / weekendRate, weekendRate / weekdayRate)
    : 0;

  if (rateRatio < 2) {
    return null; // Activity is relatively balanced
  }

  const moreActiveOn = weekdayRate > weekendRate ? 'weekdays' : 'weekends';
  const lessActiveOn = weekdayRate > weekendRate ? 'weekends' : 'weekdays';

  const evidence: Evidence[] = [{
    description: `${Math.round(weekdayRatio * 100)}% weekday / ${Math.round(weekendRatio * 100)}% weekend activity`,
    severity: 'LOW',
    reference: undefined,
  }];

  // Add per-day breakdown
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayBreakdown = dayCounts
    .map((count, i) => `${dayNames[i]}: ${count}`)
    .join(', ');
  evidence.push({
    description: `Daily breakdown: ${dayBreakdown}`,
    severity: 'LOW',
    reference: undefined,
  });

  return {
    id: 'location-weekday-pattern',
    name: 'Weekday/Weekend Activity Pattern',
    severity: 'LOW',
    confidence: 0.65,
    category: 'behavioral',
    reason: `You are ${(rateRatio).toFixed(1)}x more active on ${moreActiveOn} than ${lessActiveOn}. This pattern is consistent with typical work schedules and can indicate your occupation type.`,
    impact: 'Different activity levels on weekdays vs weekends can reveal whether you have a traditional work schedule, shift work, or other lifestyle patterns.',
    mitigation: 'Spread transactions more evenly across the week, or use scheduled transactions to add activity on your less active days.',
    evidence,
  };
}

/**
 * Estimate timezone from transaction patterns
 */
function estimateTimezone(timestamps: number[]): PrivacySignal | null {
  // Get hour of day (UTC) for each transaction
  const hourCounts = new Array(24).fill(0);
  timestamps.forEach(ts => {
    const hour = new Date(ts * 1000).getUTCHours();
    hourCounts[hour]++;
  });

  // Find the 8-hour window with the least activity (likely sleep time)
  let minActivityWindow = { start: 0, count: Infinity };
  for (let start = 0; start < 24; start++) {
    let windowCount = 0;
    for (let i = 0; i < 8; i++) {
      windowCount += hourCounts[(start + i) % 24];
    }
    if (windowCount < minActivityWindow.count) {
      minActivityWindow = { start, count: windowCount };
    }
  }

  // The inactive window should be significantly less active than average
  const totalTx = timestamps.length;
  const avgTxPerHour = totalTx / 24;
  const inactiveWindowAvg = minActivityWindow.count / 8;

  // Inactive window should have less than 50% of average activity
  if (inactiveWindowAvg >= avgTxPerHour * 0.5) {
    return null; // Activity is too evenly distributed
  }

  // Estimate timezone: assume inactive window is roughly 00:00-08:00 local time (sleep)
  // If inactive window starts at hour X in UTC, then local midnight = UTC + offset
  // offset = 0 - X (adjusted for wrapping)
  const inactiveStartUTC = minActivityWindow.start;
  let estimatedOffset = -inactiveStartUTC;
  if (estimatedOffset < -12) estimatedOffset += 24;
  if (estimatedOffset > 12) estimatedOffset -= 24;

  // Find the matching timezone region
  const offsetKey = estimatedOffset === Math.floor(estimatedOffset)
    ? `UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}`
    : `UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}`;

  const timezoneInfo = TIMEZONE_REGIONS[offsetKey];
  const regionHint = timezoneInfo?.region || 'Unknown region';

  // Calculate confidence based on how distinct the inactive period is
  const inactiveRatio = inactiveWindowAvg / avgTxPerHour;
  const confidence = Math.min(0.85, 0.5 + (1 - inactiveRatio) * 0.4);

  // Build active hours description
  const activeStartUTC = (minActivityWindow.start + 8) % 24;
  const activeEndUTC = minActivityWindow.start;

  const evidence: Evidence[] = [{
    description: `Least active: ${minActivityWindow.start}:00-${(minActivityWindow.start + 8) % 24}:00 UTC (${minActivityWindow.count} tx)`,
    severity: 'HIGH',
    reference: undefined,
  }, {
    description: `Most active: ${activeStartUTC}:00-${activeEndUTC}:00 UTC`,
    severity: 'HIGH',
    reference: undefined,
  }, {
    description: `Estimated timezone: UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset} (${regionHint})`,
    severity: 'HIGH',
    reference: undefined,
  }];

  return {
    id: 'location-timezone-estimate',
    name: 'Geographic Location Inference',
    severity: 'HIGH',
    confidence,
    category: 'behavioral',
    reason: `Based on your transaction timing patterns, you appear to be active between ${activeStartUTC}:00-${activeEndUTC}:00 UTC and inactive between ${minActivityWindow.start}:00-${(minActivityWindow.start + 8) % 24}:00 UTC. This suggests a timezone around UTC${estimatedOffset >= 0 ? '+' : ''}${estimatedOffset}, which corresponds to regions like: ${regionHint}.`,
    impact: 'Timezone estimation is a powerful deanonymization technique. Combined with other data (language preferences, protocol usage), it can significantly narrow down your geographic location.',
    mitigation: 'Use transaction scheduling to maintain activity during your typical inactive hours. Random timing offsets make timezone inference much harder.',
    evidence,
  };
}
