import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { LeaderboardFilters } from '@/components/leaderboard/leaderboard-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Award, Star } from 'lucide-react';

// Demo leaderboard data
const demoPrograms = [
  {
    rank: 1,
    rankChange: 0,
    name: 'Marinade Finance',
    address: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
    category: 'DEFI',
    score: 96,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    rank: 2,
    rankChange: 2,
    name: 'Jupiter Aggregator',
    address: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
    category: 'DEFI',
    score: 94,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    rank: 3,
    rankChange: -1,
    name: 'Orca Whirlpool',
    address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    category: 'DEFI',
    score: 93,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    rank: 4,
    rankChange: 1,
    name: 'Metaplex Token Metadata',
    address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    category: 'NFT',
    score: 91,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    rank: 5,
    rankChange: 0,
    name: 'Raydium AMM',
    address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    category: 'DEFI',
    score: 89,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    rank: 6,
    rankChange: 3,
    name: 'Solend Protocol',
    address: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
    category: 'DEFI',
    score: 87,
    isVerified: false,
    lastAnalyzed: new Date(Date.now() - 518400000).toISOString(),
  },
  {
    rank: 7,
    rankChange: -2,
    name: 'Magic Eden',
    address: 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8',
    category: 'NFT',
    score: 85,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    rank: 8,
    rankChange: 0,
    name: 'Realms Governance',
    address: 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw',
    category: 'DAO',
    score: 84,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 691200000).toISOString(),
  },
  {
    rank: 9,
    rankChange: 1,
    name: 'Phantom Wallet',
    address: 'PhantomxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxVt',
    category: 'WALLET',
    score: 82,
    isVerified: false,
    lastAnalyzed: new Date(Date.now() - 777600000).toISOString(),
  },
  {
    rank: 10,
    rankChange: -1,
    name: 'Drift Protocol',
    address: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
    category: 'DEFI',
    score: 80,
    isVerified: true,
    lastAnalyzed: new Date(Date.now() - 864000000).toISOString(),
  },
];

const stats = [
  {
    icon: Trophy,
    value: '10,432',
    label: 'Programs Ranked',
  },
  {
    icon: Award,
    value: '89',
    label: 'Average Score',
  },
  {
    icon: TrendingUp,
    value: '+15%',
    label: 'Score Improvement This Month',
  },
  {
    icon: Star,
    value: '247',
    label: 'Perfect Scores',
  },
];

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Privacy Leaderboard</h1>
            <p className="text-muted-foreground">
              Discover the most privacy-conscious Solana programs. Programs are ranked
              by their privacy score.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <LeaderboardFilters />

          {/* Leaderboard Table */}
          <Card className="mt-6">
            <CardContent className="p-0">
              <LeaderboardTable programs={demoPrograms} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
