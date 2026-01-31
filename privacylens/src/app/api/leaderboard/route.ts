import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const timeRange = searchParams.get('timeRange') || 'all-time';
  const limit = parseInt(searchParams.get('limit') || '100');

  // In production, fetch from database with proper ranking
  const leaderboard = [
    {
      rank: 1,
      rankChange: 0,
      programAddress: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
      programName: 'Marinade Finance',
      category: 'DEFI',
      score: 96,
      isVerified: true,
      lastAnalyzed: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      rank: 2,
      rankChange: 2,
      programAddress: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
      programName: 'Jupiter Aggregator',
      category: 'DEFI',
      score: 94,
      isVerified: true,
      lastAnalyzed: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      rank: 3,
      rankChange: -1,
      programAddress: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
      programName: 'Orca Whirlpool',
      category: 'DEFI',
      score: 93,
      isVerified: true,
      lastAnalyzed: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      rank: 4,
      rankChange: 1,
      programAddress: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      programName: 'Metaplex Token Metadata',
      category: 'NFT',
      score: 91,
      isVerified: true,
      lastAnalyzed: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      rank: 5,
      rankChange: 0,
      programAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      programName: 'Raydium AMM',
      category: 'DEFI',
      score: 89,
      isVerified: true,
      lastAnalyzed: new Date(Date.now() - 432000000).toISOString(),
    },
  ];

  // Filter by category if specified
  const filtered = category === 'all'
    ? leaderboard
    : leaderboard.filter((p) => p.category.toLowerCase() === category.toLowerCase());

  return NextResponse.json({
    programs: filtered.slice(0, limit),
    meta: {
      category,
      timeRange,
      total: filtered.length,
      averageScore: Math.round(
        filtered.reduce((sum, p) => sum + p.score, 0) / filtered.length
      ),
    },
  });
}
