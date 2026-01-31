import { useState } from "react";
import { WalletInput } from "@/components/WalletInput";
import { AnalysisView } from "@/components/AnalysisView";
import { Shield, Eye, Lock, Zap, Search, Brain, FileText, Anchor, HelpCircle } from "lucide-react";
import { analyzeWallet, RateLimitError, type AnalysisResult } from "@/lib/api";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const handleAnalyze = async (wallet: string) => {
    setIsLoading(true);
    try {
      const data = await analyzeWallet(wallet);
      setAnalysisData(data);
      toast.success("Analysis complete");
    } catch (error) {
      console.error("Analysis failed:", error);
      if (error instanceof RateLimitError) {
        const minutes = Math.ceil(error.retryAfter / 60);
        toast.error(`Rate limit exceeded. Please try again in ${minutes} minutes.`);
      } else {
        toast.error(error instanceof Error ? error.message : "Analysis failed");
      }
    } finally {
      setIsLoading(false);
    }
  };
  if (analysisData) {
    return <AnalysisView data={analysisData} onBack={() => setAnalysisData(null)} />;
  }
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-primary">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold text-lg text-foreground">Solana Privacy Copilot</span>
          </div>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 pt-16 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in-up">
              <Eye className="w-4 h-4" />
              AI-Powered Privacy Analysis
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in-up" style={{
            animationDelay: "0.1s"
          }}>
              Understand Your Wallet's{" "}
              <span className="text-gradient-primary">Privacy Risk</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{
            animationDelay: "0.2s"
          }}>Quantify linkability, detect metadata leakage, and get mitigation strategies for your Solana wallet.</p>

            <div className="animate-fade-in-up" style={{
            animationDelay: "0.3s"
          }}>
              <WalletInput onSubmit={handleAnalyze} isLoading={isLoading} />
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 animate-fade-in-up" style={{
            animationDelay: "0.4s"
          }}>
              <div className="card-cyber rounded-xl p-6 text-left">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Privacy Score</h3>
                <p className="text-sm text-muted-foreground">
                  Composite heuristic scoring across 6 privacy dimensions with clear risk bands.
                </p>
              </div>
              
              <div className="card-cyber rounded-xl p-6 text-left">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Solana Native</h3>
                <p className="text-sm text-muted-foreground">
                  Deep analysis of fee payers, signers, program interactions, and memo fields via Helius.
                </p>
              </div>
              
              <div className="card-cyber rounded-xl p-6 text-left">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Actionable remediation strategies generated by AI based on your specific risks.
                </p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="mt-32 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  How It Works
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Privacy analysis in four simple steps with optional on-chain verification
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="relative">
                  <div className="card-cyber rounded-xl p-6 text-center h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      1
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4 mt-2">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Enter Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      Paste any Solana wallet address to begin analysis
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="card-cyber rounded-xl p-6 text-center h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      2
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4 mt-2">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      AI scans transactions for privacy risks and metadata leaks
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="card-cyber rounded-xl p-6 text-center h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      3
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4 mt-2">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Get Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive detailed privacy score with actionable mitigations
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="card-cyber rounded-xl p-6 text-center h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      4
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4 mt-2">
                      <Anchor className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Anchor On-Chain</h3>
                    <p className="text-sm text-muted-foreground">
                      Optionally anchor report hash on Devnet for tamper-proof verification
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional badge */}
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-muted-foreground text-sm">
                  <Anchor className="w-4 h-4 text-primary" />
                  Step 4 is optional — connect your wallet only if you want on-chain proof
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-32 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Everything you need to know about privacy analysis and on-chain anchoring
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  <AccordionItem value="item-1" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      What is a privacy score and how is it calculated?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      The privacy score is a composite metric (0-100) calculated across 6 dimensions: 
                      address reuse patterns, fee payer linkability, counterparty concentration, 
                      program interaction diversity, temporal patterns, and memo field exposure. 
                      Higher scores indicate better privacy practices.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      Is my wallet data stored or shared?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      No. All analysis is performed on publicly available blockchain data. 
                      We don't store your wallet address, transaction history, or analysis results 
                      on our servers. The analysis runs in real-time and results exist only in your browser session.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      What is Devnet anchoring and why would I use it?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Devnet anchoring creates a tamper-proof record of your privacy report by storing 
                      a cryptographic hash (SHA-256) on Solana's Devnet. This provides verifiable proof 
                      that the report existed at a specific time and hasn't been altered. It's useful for 
                      audit trails, compliance documentation, or personal record-keeping.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      Does anchoring cost real SOL?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      No. Anchoring uses Solana Devnet, which requires Devnet SOL (not real money). 
                      You can request free Devnet SOL directly from our interface using the airdrop button. 
                      The transaction fee is approximately 0.000005 SOL.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      Which wallets are supported for anchoring?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      We currently support Phantom and Solflare wallets for signing Devnet transactions. 
                      Make sure your wallet is set to Devnet network before connecting. 
                      Note: You can analyze any wallet address without connecting — wallet connection 
                      is only needed for the optional anchoring feature.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="card-cyber rounded-xl px-6 border-none">
                    <AccordionTrigger className="text-foreground hover:no-underline">
                      How can I verify an anchored report?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      After anchoring, you'll receive a Solana Explorer link to view the transaction. 
                      The transaction contains a memo with the report hash. You can verify integrity 
                      by recomputing the SHA-256 hash of your report data and comparing it to the 
                      on-chain value. We plan to add a built-in verification tool soon.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Solana Privacy Copilot v1.0 • Built for Solana Privacy Hackathon 2026
            </p>
            <p className="text-muted-foreground text-sm">
              Powered by Helius RPC • Devnet anchoring available
            </p>
          </div>
        </footer>
      </div>
    </div>;
};
export default Index;