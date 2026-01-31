import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createProgramSchema = z.object({
  address: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'DEFI',
    'NFT',
    'GAMING',
    'DAO',
    'SOCIAL',
    'INFRASTRUCTURE',
    'ORACLE',
    'BRIDGE',
    'WALLET',
    'OTHER',
  ]).default('OTHER'),
  isPublic: z.boolean().default(false),
  website: z.string().url().optional(),
  github: z.string().url().optional(),
  twitter: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  // In production, fetch from database
  const demoPrograms = [
    {
      id: '1',
      address: 'TokenSwap1111111111111111111111111111111111',
      name: 'Token Swap Program',
      category: 'DEFI',
      latestScore: 78,
      lastAnalyzed: new Date().toISOString(),
      isVerified: true,
      isPublic: true,
    },
    {
      id: '2',
      address: 'Stake1111111111111111111111111111111111111',
      name: 'Staking Protocol',
      category: 'DEFI',
      latestScore: 85,
      lastAnalyzed: new Date(Date.now() - 86400000).toISOString(),
      isVerified: false,
      isPublic: true,
    },
  ];

  return NextResponse.json({
    programs: demoPrograms,
    pagination: {
      page,
      limit,
      total: demoPrograms.length,
      totalPages: 1,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createProgramSchema.parse(body);

    // In production, create in database
    const program = {
      id: `prog_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create program error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
