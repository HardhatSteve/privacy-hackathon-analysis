import { NextRequest, NextResponse } from 'next/server';
import { analyzeWallet } from '@/engine';

/**
 * POST /api/privacy-scan
 * Analyzes a Solana wallet for privacy risks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate address format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Run the privacy analysis
    const report = await analyzeWallet(address);

    // Convert Date to ISO string for JSON serialization
    const serializedReport = {
      ...report,
      analyzedAt: report.analyzedAt.toISOString(),
      detectorResults: {
        ...report.detectorResults,
        compliance: {
          ...report.detectorResults.compliance,
          checkedAt: report.detectorResults.compliance.checkedAt.toISOString(),
        },
      },
    };

    return NextResponse.json(serializedReport);
  } catch (error) {
    console.error('Privacy scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
