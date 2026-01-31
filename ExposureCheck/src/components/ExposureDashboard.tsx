import type { ExposureResult } from '../types/exposure';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface ExposureDashboardProps {
  result: ExposureResult;
  onReset: () => void;
}

export function ExposureDashboard({ result, onReset }: ExposureDashboardProps) {
  return <AnalyticsDashboard result={result} onReset={onReset} />;
}
