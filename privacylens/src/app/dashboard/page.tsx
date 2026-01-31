import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ProgramsTable } from '@/components/dashboard/programs-table';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ScoreTrendChart } from '@/components/dashboard/score-trend-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Demo data for the dashboard
const demoStats = {
  totalPrograms: 12,
  averageScore: 74,
  totalVulnerabilities: 47,
  criticalIssues: 3,
  scoreChange: +5,
  analyzedThisMonth: 8,
};

const demoPrograms = [
  {
    id: '1',
    name: 'Token Swap Program',
    address: 'TokenSwap1111111111111111111111111111111111',
    score: 78,
    lastAnalyzed: new Date(Date.now() - 3600000).toISOString(),
    vulnerabilities: { critical: 0, high: 2, medium: 2, low: 1 },
    trend: 'up' as const,
  },
  {
    id: '2',
    name: 'Staking Protocol',
    address: 'Stake1111111111111111111111111111111111111',
    score: 85,
    lastAnalyzed: new Date(Date.now() - 86400000).toISOString(),
    vulnerabilities: { critical: 0, high: 1, medium: 1, low: 2 },
    trend: 'up' as const,
  },
  {
    id: '3',
    name: 'Lending Pool',
    address: 'Lend11111111111111111111111111111111111111',
    score: 62,
    lastAnalyzed: new Date(Date.now() - 172800000).toISOString(),
    vulnerabilities: { critical: 1, high: 3, medium: 2, low: 1 },
    trend: 'down' as const,
  },
  {
    id: '4',
    name: 'NFT Marketplace',
    address: 'NFTMkt111111111111111111111111111111111111',
    score: 91,
    lastAnalyzed: new Date(Date.now() - 259200000).toISOString(),
    vulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
    trend: 'stable' as const,
  },
];

const demoActivity = [
  {
    id: '1',
    type: 'analysis' as const,
    programName: 'Token Swap Program',
    description: 'Analysis completed with score 78',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'vulnerability' as const,
    programName: 'Lending Pool',
    description: 'New critical vulnerability detected',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'improvement' as const,
    programName: 'Staking Protocol',
    description: 'Score improved by 8 points',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    type: 'analysis' as const,
    programName: 'NFT Marketplace',
    description: 'Analysis completed with score 91',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

const demoTrendData = [
  { date: '2024-01-01', score: 68 },
  { date: '2024-01-08', score: 71 },
  { date: '2024-01-15', score: 69 },
  { date: '2024-01-22', score: 73 },
  { date: '2024-01-29', score: 75 },
  { date: '2024-02-05', score: 74 },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <DashboardHeader />

          <div className="mt-8">
            <StatsCards stats={demoStats} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* Score Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreTrendChart data={demoTrendData} />
                </CardContent>
              </Card>

              {/* Programs Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgramsTable programs={demoPrograms} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed activities={demoActivity} />
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a
                    href="/analyze"
                    className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    Analyze New Program
                  </a>
                  <a
                    href="/settings/api-keys"
                    className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    Manage API Keys
                  </a>
                  <a
                    href="/settings/integrations"
                    className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    Set Up Integrations
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
