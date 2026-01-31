import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ReportHeader } from '@/components/reports/report-header';
import { ScoreSummary } from '@/components/reports/score-summary';
import { VulnerabilityList } from '@/components/reports/vulnerability-list';
import { RecommendationsList } from '@/components/reports/recommendations-list';
import { ReportActions } from '@/components/reports/report-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Demo analysis data
const demoAnalysis = {
  id: 'demo-analysis',
  programAddress: 'TokenSwap1111111111111111111111111111111111',
  programName: 'Token Swap Program',
  analyzedAt: new Date().toISOString(),
  bytecodeHash: 'abc123def456...',
  score: {
    overall: 78,
    encryption: 85,
    accessControl: 72,
    dataPrivacy: 80,
    sideChannel: 75,
    piiHandling: 90,
    confidence: 0.92,
    percentile: 68,
  },
  vulnerabilities: [
    {
      id: 'TIMING_0001',
      title: 'Potential Non-Constant-Time Comparison',
      description: 'A comparison operation followed by a conditional branch was detected in what appears to be a loop.',
      severity: 'HIGH',
      category: 'TIMING_ATTACK',
      impact: 'An attacker could measure timing differences to infer secret values being compared.',
      recommendation: 'Use constant-time comparison functions that always compare all bytes regardless of intermediate results.',
      cweId: 'CWE-208',
      confidence: 0.75,
    },
    {
      id: 'TIMING_0002',
      title: 'Time-Dependent Access Control',
      description: 'A time-related function appears to be used near access control logic.',
      severity: 'MEDIUM',
      category: 'TIMING_ATTACK',
      impact: 'Access control decisions based on time can be manipulated or predicted by attackers.',
      recommendation: 'Avoid using time for security-critical decisions. If time must be used, add buffer periods.',
      cweId: 'CWE-367',
      confidence: 0.6,
    },
    {
      id: 'ACCESS_0001',
      title: 'Potential Missing Owner Verification',
      description: 'The program reads account data but may not verify account ownership.',
      severity: 'HIGH',
      category: 'ACCESS_CONTROL',
      impact: 'Without owner verification, an attacker could pass in accounts they control.',
      recommendation: 'Always verify that accounts passed to the program are owned by the expected program.',
      cweId: 'CWE-284',
      confidence: 0.65,
    },
    {
      id: 'STATE_0001',
      title: 'Cross-Program Data Exposure',
      description: 'The program performs cross-program invocations and appears to pass data.',
      severity: 'LOW',
      category: 'STATE_LEAKAGE',
      impact: 'Sensitive data passed to other programs during CPI could be logged or mishandled.',
      recommendation: 'Only pass the minimum necessary data in CPIs.',
      cweId: 'CWE-201',
      confidence: 0.45,
    },
    {
      id: 'CRYPTO_0001',
      title: 'Potential Nonce/IV Reuse',
      description: 'The program appears to perform encryption but shows no evidence of nonce generation.',
      severity: 'MEDIUM',
      category: 'CRYPTOGRAPHIC',
      impact: 'Nonce reuse allows attackers to recover plaintext or forge ciphertexts.',
      recommendation: 'Always generate a fresh, random nonce for each encryption operation.',
      cweId: 'CWE-323',
      confidence: 0.55,
    },
  ],
  recommendations: [
    {
      id: 'REC_0001',
      title: 'Use Constant-Time Operations',
      description: 'Replace timing-sensitive operations with constant-time implementations.',
      category: 'TIMING_PROTECTION',
      priority: 'HIGH',
      effort: 'MEDIUM',
      impact: 'HIGH',
    },
    {
      id: 'REC_0002',
      title: 'Strengthen Access Control',
      description: 'Implement comprehensive access control checks including owner verification.',
      category: 'ACCESS_CONTROL',
      priority: 'HIGH',
      effort: 'EASY',
      impact: 'HIGH',
    },
    {
      id: 'REC_0003',
      title: 'Improve Cryptographic Implementation',
      description: 'Ensure proper nonce generation for all encryption operations.',
      category: 'KEY_MANAGEMENT',
      priority: 'MEDIUM',
      effort: 'MEDIUM',
      impact: 'HIGH',
    },
  ],
  stats: {
    bytecodeSize: 245760,
    instructionsAnalyzed: 15423,
    durationMs: 2847,
    detectorsRun: 6,
  },
};

interface ReportPageProps {
  params: { id: string };
}

export default function ReportPage({ params }: ReportPageProps) {
  // In production, fetch the analysis from the database
  const analysis = params.id === 'demo-analysis' ? demoAnalysis : null;

  if (!analysis) {
    notFound();
  }

  const vulnerabilityStats = {
    critical: analysis.vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
    high: analysis.vulnerabilities.filter((v) => v.severity === 'HIGH').length,
    medium: analysis.vulnerabilities.filter((v) => v.severity === 'MEDIUM').length,
    low: analysis.vulnerabilities.filter((v) => v.severity === 'LOW').length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <ReportHeader
            programName={analysis.programName}
            programAddress={analysis.programAddress}
            analyzedAt={analysis.analyzedAt}
            score={analysis.score.overall}
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="vulnerabilities" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="vulnerabilities">
                    Vulnerabilities ({analysis.vulnerabilities.length})
                  </TabsTrigger>
                  <TabsTrigger value="recommendations">
                    Recommendations ({analysis.recommendations.length})
                  </TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="vulnerabilities" className="space-y-4">
                  <VulnerabilityList
                    vulnerabilities={analysis.vulnerabilities}
                    stats={vulnerabilityStats}
                  />
                </TabsContent>

                <TabsContent value="recommendations">
                  <RecommendationsList recommendations={analysis.recommendations} />
                </TabsContent>

                <TabsContent value="details">
                  <div className="rounded-lg border p-6">
                    <h3 className="mb-4 font-semibold">Analysis Details</h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm text-muted-foreground">Bytecode Hash</dt>
                        <dd className="font-mono text-sm">{analysis.bytecodeHash}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Bytecode Size</dt>
                        <dd>{(analysis.stats.bytecodeSize / 1024).toFixed(1)} KB</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Instructions Analyzed</dt>
                        <dd>{analysis.stats.instructionsAnalyzed.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Analysis Duration</dt>
                        <dd>{(analysis.stats.durationMs / 1000).toFixed(2)}s</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Detectors Run</dt>
                        <dd>{analysis.stats.detectorsRun}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Confidence Level</dt>
                        <dd>{(analysis.score.confidence * 100).toFixed(0)}%</dd>
                      </div>
                    </dl>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ScoreSummary score={analysis.score} />
              <ReportActions analysisId={analysis.id} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
