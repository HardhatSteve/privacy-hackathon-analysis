import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  programAddress: z.string().optional(),
  bytecode: z.string().optional(), // Base64 encoded
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  minSeverity: z.enum(['critical', 'high', 'medium', 'low']).default('low'),
  includeRecommendations: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programAddress, bytecode, depth, minSeverity, includeRecommendations } =
      analyzeRequestSchema.parse(body);

    // Validate that we have either address or bytecode
    if (!programAddress && !bytecode) {
      return NextResponse.json(
        { error: 'Either programAddress or bytecode is required' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Fetch bytecode from Solana if address provided
    // 2. Run WASM analyzer
    // 3. Store results in database
    // 4. Return analysis result

    // For demo, return mock analysis
    const analysisResult = {
      id: `analysis_${Date.now()}`,
      programAddress: programAddress || 'uploaded_bytecode',
      status: 'completed',
      score: {
        overall: 78,
        encryption: 85,
        accessControl: 72,
        dataPrivacy: 80,
        sideChannel: 75,
        piiHandling: 90,
        confidence: 0.92,
      },
      vulnerabilities: [
        {
          id: 'TIMING_0001',
          title: 'Potential Non-Constant-Time Comparison',
          severity: 'HIGH',
          category: 'TIMING_ATTACK',
          description: 'A comparison operation was detected that may leak timing information.',
          recommendation: 'Use constant-time comparison functions.',
        },
      ],
      recommendations: includeRecommendations
        ? [
            {
              id: 'REC_0001',
              title: 'Use Constant-Time Operations',
              priority: 'HIGH',
              effort: 'MEDIUM',
              impact: 'HIGH',
            },
          ]
        : [],
      stats: {
        bytecodeSize: 245760,
        instructionsAnalyzed: 15423,
        durationMs: 2847,
        detectorsRun: 6,
      },
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/analyze',
    method: 'POST',
    description: 'Analyze a Solana program for privacy vulnerabilities',
    parameters: {
      programAddress: 'Solana program address (optional if bytecode provided)',
      bytecode: 'Base64-encoded bytecode (optional if programAddress provided)',
      depth: 'Analysis depth: quick, standard, deep (default: standard)',
      minSeverity: 'Minimum severity to report: critical, high, medium, low (default: low)',
      includeRecommendations: 'Include recommendations in response (default: true)',
    },
  });
}
