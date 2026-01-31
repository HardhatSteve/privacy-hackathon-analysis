'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileUploadZone } from '@/components/analyzer/file-upload-zone';
import { AnalysisProgress } from '@/components/analyzer/analysis-progress';
import {
  Upload,
  Search,
  Github,
  Zap,
  Shield,
  AlertTriangle,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type AnalysisDepth = 'quick' | 'standard' | 'deep';

interface AnalysisConfig {
  depth: AnalysisDepth;
  minSeverity: string;
  includeRecommendations: boolean;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('address');
  const [programAddress, setProgramAddress] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [config, setConfig] = useState<AnalysisConfig>({
    depth: 'standard',
    minSeverity: 'low',
    includeRecommendations: true,
  });

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    toast.success(`File uploaded: ${file.name}`);
  }, []);

  const handleAnalyze = async () => {
    if (activeTab === 'address' && !programAddress) {
      toast.error('Please enter a program address');
      return;
    }
    if (activeTab === 'upload' && !uploadedFile) {
      toast.error('Please upload a program file');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate analysis progress
      const steps = [
        { progress: 10, step: 'Fetching program bytecode...' },
        { progress: 30, step: 'Parsing bytecode structure...' },
        { progress: 50, step: 'Running vulnerability detectors...' },
        { progress: 70, step: 'Analyzing privacy patterns...' },
        { progress: 85, step: 'Calculating privacy score...' },
        { progress: 95, step: 'Generating recommendations...' },
        { progress: 100, step: 'Analysis complete!' },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProgress(step.progress);
        setProgressStep(step.step);
      }

      // For demo, redirect to a sample report
      toast.success('Analysis complete!');
      router.push('/reports/demo-analysis');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const depthDescriptions = {
    quick: 'Fast scan for critical issues only (~10 seconds)',
    standard: 'Balanced analysis with all detectors (~30 seconds)',
    deep: 'Comprehensive analysis with pattern matching (~2 minutes)',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">Analyze Your Program</h1>
            <p className="text-muted-foreground">
              Submit a Solana program for privacy analysis. Get a detailed report with
              vulnerability findings and recommendations.
            </p>
          </div>

          {isAnalyzing ? (
            <AnalysisProgress progress={progress} step={progressStep} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Program Source</CardTitle>
                <CardDescription>
                  Choose how to provide your program for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="address" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Program Address
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Bytecode
                    </TabsTrigger>
                    <TabsTrigger value="github" className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="address" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Solana Program Address
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter program address (e.g., TokenSwap...)"
                            value={programAddress}
                            onChange={(e) => setProgramAddress(e.target.value)}
                            className="font-mono"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          The program bytecode will be fetched from the Solana mainnet
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/50 p-4">
                        <h4 className="mb-2 text-sm font-medium">Popular Programs</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Token Program', 'Serum DEX', 'Marinade', 'Jupiter'].map(
                            (name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                              >
                                {name}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6">
                    <FileUploadZone
                      onFileUpload={handleFileUpload}
                      uploadedFile={uploadedFile}
                      onRemove={() => setUploadedFile(null)}
                    />
                  </TabsContent>

                  <TabsContent value="github" className="mt-6">
                    <div className="space-y-4">
                      <div className="rounded-lg border-2 border-dashed p-8 text-center">
                        <Github className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 font-medium">Connect GitHub Repository</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Link your GitHub repository for continuous privacy monitoring
                        </p>
                        <Button className="mt-4" variant="outline">
                          <Github className="mr-2 h-4 w-4" />
                          Connect GitHub
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Analysis Configuration */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="mb-4 font-medium">Analysis Configuration</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Analysis Depth
                      </label>
                      <Select
                        value={config.depth}
                        onValueChange={(v: AnalysisDepth) =>
                          setConfig({ ...config, depth: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Quick Scan
                            </div>
                          </SelectItem>
                          <SelectItem value="standard">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Standard
                            </div>
                          </SelectItem>
                          <SelectItem value="deep">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4" />
                              Deep Analysis
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {depthDescriptions[config.depth]}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Minimum Severity
                      </label>
                      <Select
                        value={config.minSeverity}
                        onValueChange={(v) =>
                          setConfig({ ...config, minSeverity: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical Only</SelectItem>
                          <SelectItem value="high">High and Above</SelectItem>
                          <SelectItem value="medium">Medium and Above</SelectItem>
                          <SelectItem value="low">All Severities</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={
                      (activeTab === 'address' && !programAddress) ||
                      (activeTab === 'upload' && !uploadedFile)
                    }
                  >
                    Start Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Section */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <Shield className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-medium">8+ Detector Types</h3>
              <p className="text-sm text-muted-foreground">
                PII exposure, timing attacks, cryptographic issues, and more
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <AlertTriangle className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-medium">Actionable Results</h3>
              <p className="text-sm text-muted-foreground">
                Clear recommendations with code examples for each finding
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Zap className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-medium">Fast & Private</h3>
              <p className="text-sm text-muted-foreground">
                Analysis runs locally in your browser using WASM
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
