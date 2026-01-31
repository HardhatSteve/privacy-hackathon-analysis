import type { TimeOfDayAnalysis } from '../types/exposure';

interface ActivityHeatmapProps {
  timeAnalysis?: TimeOfDayAnalysis;
}

export function ActivityHeatmap({ timeAnalysis }: ActivityHeatmapProps) {
  if (!timeAnalysis || !timeAnalysis.hourDistribution) {
    return (
      <div className="activity-heatmap">
        <h3 className="panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          Activity Timing
        </h3>
        <div className="heatmap-empty">Insufficient transaction data</div>
      </div>
    );
  }

  const maxCount = Math.max(...timeAnalysis.hourDistribution, 1);

  // Get intensity class based on count
  const getIntensity = (count: number): string => {
    if (count === 0) return 'none';
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'high';
    if (ratio > 0.4) return 'medium';
    if (ratio > 0.1) return 'low';
    return 'minimal';
  };

  // Format hour for display
  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="activity-heatmap">
      <h3 className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
        Activity Timing (UTC)
      </h3>

      {/* Hour Distribution Grid */}
      <div className="heatmap-grid">
        {timeAnalysis.hourDistribution.map((count, hour) => (
          <div
            key={hour}
            className={`heatmap-cell intensity-${getIntensity(count)}`}
            title={`${formatHour(hour)}: ${count} transactions`}
          >
            <span className="hour-label">{hour}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-label">Less</span>
        <div className="legend-cells">
          <div className="legend-cell intensity-none"></div>
          <div className="legend-cell intensity-minimal"></div>
          <div className="legend-cell intensity-low"></div>
          <div className="legend-cell intensity-medium"></div>
          <div className="legend-cell intensity-high"></div>
        </div>
        <span className="legend-label">More</span>
      </div>

      {/* Summary Info */}
      <div className="heatmap-summary">
        {timeAnalysis.activeHourRange && timeAnalysis.activeHourRange !== 'Insufficient data' && (
          <div className="summary-row">
            <span className="summary-key">Peak Hours:</span>
            <span className="summary-val">{timeAnalysis.activeHourRange}</span>
          </div>
        )}
        {timeAnalysis.inferredTimezone && (
          <div className="summary-row">
            <span className="summary-key">Likely Timezone:</span>
            <span className="summary-val">{timeAnalysis.inferredTimezone}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-key">Pattern:</span>
          <span className={`summary-val concentration-${timeAnalysis.activityConcentration}`}>
            {timeAnalysis.activityConcentration === 'high' && 'Highly Concentrated'}
            {timeAnalysis.activityConcentration === 'medium' && 'Moderately Varied'}
            {timeAnalysis.activityConcentration === 'low' && 'Well Distributed'}
          </span>
        </div>
      </div>
    </div>
  );
}
