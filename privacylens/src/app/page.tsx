import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Shield,
  Eye,
  Zap,
  BarChart3,
  GitBranch,
  Terminal,
  CheckCircle,
} from 'lucide-react';
import { ScoreGauge } from '@/components/charts/score-gauge';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const features = [
  {
    icon: Shield,
    title: 'Privacy Vulnerability Detection',
    description:
      'Automatically detect PII exposure, timing attacks, state leakage, and 20+ other privacy vulnerability types.',
  },
  {
    icon: BarChart3,
    title: 'Quantifiable Privacy Score',
    description:
      'Get a clear 0-100 privacy score with detailed breakdowns by category. Track improvements over time.',
  },
  {
    icon: Eye,
    title: 'Deep Analysis Engine',
    description:
      'Rust-powered analyzer compiled to WASM examines bytecode for privacy patterns and anti-patterns.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Analyze most programs in under 5 seconds. Get instant feedback during development.',
  },
  {
    icon: GitBranch,
    title: 'CI/CD Integration',
    description:
      'GitHub Actions, GitLab CI, and CLI support. Catch privacy issues before they reach production.',
  },
  {
    icon: Terminal,
    title: 'Developer-Friendly CLI',
    description:
      'Full-featured command-line tool for local analysis. Perfect for your development workflow.',
  },
];

const stats = [
  { value: '10,000+', label: 'Programs Analyzed' },
  { value: '50,000+', label: 'Vulnerabilities Found' },
  { value: '<5s', label: 'Average Analysis Time' },
  { value: '99.2%', label: 'Detection Accuracy' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container relative z-10 py-24 md:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-4">
                Now in Public Beta
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Privacy Analysis for{' '}
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Solana Programs
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Lighthouse for Privacy. Automatically detect privacy leaks, timing
                attacks, and PII exposure in your smart contracts before
                deployment.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/analyze">
                    Analyze Your Program
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/docs">View Documentation</Link>
                </Button>
              </div>
            </div>

            {/* Demo Score */}
            <div className="mx-auto mt-16 max-w-md">
              <div className="rounded-xl border bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Example Program</p>
                    <p className="font-mono text-sm">TokenSwap...3fK2</p>
                  </div>
                  <ScoreGauge score={78} size="sm" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">No PII exposure detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-yellow-500" />
                    <span className="text-sm">2 medium timing vulnerabilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                    <span className="text-sm">3 low-priority recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b py-12">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-primary md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need for Privacy Analysis
              </h2>
              <p className="text-muted-foreground">
                Comprehensive tools to identify, track, and fix privacy issues in
                your Solana programs.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Ready to Improve Your Privacy?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Start analyzing your Solana programs for free. No credit card
                required.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
