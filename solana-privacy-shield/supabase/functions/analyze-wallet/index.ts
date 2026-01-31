import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window
const RATE_LIMIT_WINDOW_MINUTES = 60; // Window duration in minutes

// Base58 alphabet for Solana addresses
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Decode base58 string to bytes for cryptographic validation
function decodeBase58(str: string): Uint8Array {
  const result: number[] = [];
  for (const char of str) {
    let carry = BASE58_ALPHABET.indexOf(char);
    if (carry === -1) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    for (let i = 0; i < result.length; i++) {
      carry += result[i] * 58;
      result[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      result.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Handle leading '1's (zeros in base58)
  for (const char of str) {
    if (char === '1') {
      result.push(0);
    } else {
      break;
    }
  }
  return new Uint8Array(result.reverse());
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  // Check various headers for the real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return "unknown";
}

// Check rate limit using Supabase function
async function checkRateLimit(supabase: any, ip: string, endpoint: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      // Allow request on error to avoid blocking legitimate users
      return true;
    }
    
    return data === true;
  } catch (err) {
    console.error("Rate limit exception:", err);
    return true; // Allow on error
  }
}

interface TransactionMeta {
  feePayer: string;
  signers: string[];
  programs: string[];
  accounts: string[];
  hasMemo: boolean;
  memoContent: string | null;
  timestamp: number;
}

interface PrivacyMetrics {
  feePayerReuseRatio: number;
  signerConcentration: number;
  programEntropy: number;
  counterpartyConcentration: number;
  memoDetected: boolean;
  temporalEntropy: number;
  transactionCount: number;
  uniqueFeePayers: number;
  uniqueSigners: number;
  uniquePrograms: number;
  topPrograms: { name: string; count: number }[];
}

// Fetch transaction signatures from Helius
async function getSignatures(wallet: string, limit: number, apiKey: string): Promise<string[]> {
  const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${apiKey}&limit=${limit}`;
  
  console.log(`Fetching signatures for wallet: ${wallet}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Helius API error:", response.status, errorText);
    throw new Error(`Helius API error: ${response.status}`);
  }
  
  const transactions = await response.json();
  console.log(`Retrieved ${transactions.length} transactions`);
  
  return transactions.map((tx: any) => tx.signature);
}

// Fetch parsed transactions from Helius (max 100 per request)
async function getParsedTransactions(wallet: string, limit: number, apiKey: string): Promise<any[]> {
  // Helius API has a max limit of 100 transactions per request
  const effectiveLimit = Math.min(limit, 100);
  const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${apiKey}&limit=${effectiveLimit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Helius API error details:", response.status, errorText);
    throw new Error(`Helius API error: ${response.status}`);
  }
  
  return await response.json();
}

// Extract metadata from transactions
function extractTransactionMeta(transactions: any[], wallet: string): TransactionMeta[] {
  return transactions.map((tx: any) => {
    const feePayer = tx.feePayer || "";
    const signers = tx.signers || [];
    
    // Extract program IDs from instructions
    const programs: string[] = [];
    if (tx.instructions) {
      tx.instructions.forEach((ix: any) => {
        if (ix.programId && !programs.includes(ix.programId)) {
          programs.push(ix.programId);
        }
      });
    }
    
    // Extract accounts interacted with
    const accounts: string[] = [];
    if (tx.accountData) {
      tx.accountData.forEach((acc: any) => {
        if (acc.account && acc.account !== wallet && !accounts.includes(acc.account)) {
          accounts.push(acc.account);
        }
      });
    }
    
    // Check for memo
    const hasMemo = tx.instructions?.some((ix: any) => 
      ix.programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" ||
      ix.programId === "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
    ) || false;
    
    let memoContent: string | null = null;
    if (hasMemo) {
      const memoIx = tx.instructions?.find((ix: any) => 
        ix.programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" ||
        ix.programId === "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
      );
      if (memoIx?.data) {
        memoContent = memoIx.data;
      }
    }
    
    return {
      feePayer,
      signers,
      programs,
      accounts,
      hasMemo,
      memoContent,
      timestamp: tx.timestamp || 0,
    };
  });
}

// Calculate Shannon entropy
function calculateEntropy(frequencies: number[]): number {
  const total = frequencies.reduce((sum, f) => sum + f, 0);
  if (total === 0) return 0;
  
  let entropy = 0;
  for (const f of frequencies) {
    if (f > 0) {
      const p = f / total;
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalize to 0-1
  const maxEntropy = Math.log2(frequencies.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

// Known program labels
const KNOWN_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token",
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpool",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum DEX",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": "Metaplex",
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw": "Governance",
};

// Compute privacy metrics
function computeMetrics(metas: TransactionMeta[]): PrivacyMetrics {
  const txCount = metas.length;
  if (txCount === 0) {
    return {
      feePayerReuseRatio: 0,
      signerConcentration: 0,
      programEntropy: 1,
      counterpartyConcentration: 0,
      memoDetected: false,
      temporalEntropy: 1,
      transactionCount: 0,
      uniqueFeePayers: 0,
      uniqueSigners: 0,
      uniquePrograms: 0,
      topPrograms: [],
    };
  }
  
  // Fee payer analysis
  const feePayerCounts: Record<string, number> = {};
  metas.forEach(m => {
    feePayerCounts[m.feePayer] = (feePayerCounts[m.feePayer] || 0) + 1;
  });
  const uniqueFeePayers = Object.keys(feePayerCounts).length;
  const topFeePayerCount = Math.max(...Object.values(feePayerCounts));
  const feePayerReuseRatio = topFeePayerCount / txCount;
  
  // Signer analysis
  const signerCounts: Record<string, number> = {};
  metas.forEach(m => {
    m.signers.forEach(s => {
      signerCounts[s] = (signerCounts[s] || 0) + 1;
    });
  });
  const uniqueSigners = Object.keys(signerCounts).length;
  const topSignerCount = uniqueSigners > 0 ? Math.max(...Object.values(signerCounts)) : 0;
  const totalSignerEvents = Object.values(signerCounts).reduce((a, b) => a + b, 0);
  const signerConcentration = totalSignerEvents > 0 ? topSignerCount / totalSignerEvents : 0;
  
  // Program fingerprint analysis
  const programCounts: Record<string, number> = {};
  metas.forEach(m => {
    m.programs.forEach(p => {
      programCounts[p] = (programCounts[p] || 0) + 1;
    });
  });
  const uniquePrograms = Object.keys(programCounts).length;
  const programFrequencies = Object.values(programCounts);
  const programEntropy = calculateEntropy(programFrequencies);
  
  // Top programs
  const topPrograms = Object.entries(programCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      name: KNOWN_PROGRAMS[id] || `${id.slice(0, 8)}...`,
      count,
    }));
  
  // Counterparty analysis
  const counterpartyCounts: Record<string, number> = {};
  metas.forEach(m => {
    m.accounts.forEach(a => {
      counterpartyCounts[a] = (counterpartyCounts[a] || 0) + 1;
    });
  });
  const counterpartyFrequencies = Object.values(counterpartyCounts);
  const topCounterpartyCount = counterpartyFrequencies.length > 0 
    ? Math.max(...counterpartyFrequencies) 
    : 0;
  const totalCounterpartyEvents = counterpartyFrequencies.reduce((a, b) => a + b, 0);
  const counterpartyConcentration = totalCounterpartyEvents > 0 
    ? topCounterpartyCount / totalCounterpartyEvents 
    : 0;
  
  // Memo detection
  const memoDetected = metas.some(m => m.hasMemo);
  
  // Temporal entropy (by hour of day)
  const hourCounts = new Array(24).fill(0);
  metas.forEach(m => {
    if (m.timestamp > 0) {
      const date = new Date(m.timestamp * 1000);
      hourCounts[date.getUTCHours()]++;
    }
  });
  const temporalEntropy = calculateEntropy(hourCounts);
  
  return {
    feePayerReuseRatio,
    signerConcentration,
    programEntropy,
    counterpartyConcentration,
    memoDetected,
    temporalEntropy,
    transactionCount: txCount,
    uniqueFeePayers,
    uniqueSigners,
    uniquePrograms,
    topPrograms,
  };
}

// Calculate privacy score
function calculateScore(metrics: PrivacyMetrics): number {
  // Penalties (0-20 each)
  const feePayerPenalty = metrics.feePayerReuseRatio * 20;
  const signerPenalty = metrics.signerConcentration * 15;
  const programPenalty = (1 - metrics.programEntropy) * 15;
  const counterpartyPenalty = metrics.counterpartyConcentration * 15;
  const memoPenalty = metrics.memoDetected ? 15 : 0;
  const temporalPenalty = (1 - metrics.temporalEntropy) * 10;
  
  const totalPenalty = feePayerPenalty + signerPenalty + programPenalty + 
                       counterpartyPenalty + memoPenalty + temporalPenalty;
  
  return Math.max(10, Math.min(95, Math.round(100 - totalPenalty)));
}

// Generate AI report
async function generateReport(
  wallet: string, 
  metrics: PrivacyMetrics, 
  score: number
): Promise<{ summary: string; leaks: string[]; mitigations: string[]; checklist: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("No LOVABLE_API_KEY, using fallback report");
    return generateFallbackReport(metrics, score);
  }
  
  const prompt = `You are a Solana blockchain privacy analyst. Analyze the following wallet privacy metrics and generate a concise privacy assessment report.

Wallet: ${wallet.slice(0, 8)}...${wallet.slice(-4)}
Privacy Score: ${score}/100 (${score >= 80 ? "Strong" : score >= 60 ? "Moderate" : score >= 40 ? "Elevated Risk" : "Critical Risk"})

METRICS:
- Fee Payer Reuse: ${(metrics.feePayerReuseRatio * 100).toFixed(1)}% (${metrics.uniqueFeePayers} unique fee payers)
- Signer Concentration: ${(metrics.signerConcentration * 100).toFixed(1)}% (${metrics.uniqueSigners} unique signers)
- Program Entropy: ${metrics.programEntropy.toFixed(2)} (${metrics.uniquePrograms} unique programs)
- Counterparty Concentration: ${(metrics.counterpartyConcentration * 100).toFixed(1)}%
- Memo Leakage: ${metrics.memoDetected ? "DETECTED" : "None"}
- Temporal Entropy: ${metrics.temporalEntropy.toFixed(2)}
- Total Transactions Analyzed: ${metrics.transactionCount}
- Top Programs: ${metrics.topPrograms.map(p => `${p.name} (${p.count})`).join(", ")}

Generate a JSON response with:
1. "summary": A 2-3 sentence executive summary of the privacy posture
2. "leaks": Array of 4-5 specific privacy leaks detected
3. "mitigations": Array of 5-6 actionable mitigation strategies
4. "checklist": Array of 5-6 operational checklist items

Be specific to the actual metrics. Focus on Solana-specific privacy concerns.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a blockchain privacy analyst. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return generateFallbackReport(metrics, score);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || generateFallbackReport(metrics, score).summary,
        leaks: parsed.leaks || generateFallbackReport(metrics, score).leaks,
        mitigations: parsed.mitigations || generateFallbackReport(metrics, score).mitigations,
        checklist: parsed.checklist || generateFallbackReport(metrics, score).checklist,
      };
    }
    
    return generateFallbackReport(metrics, score);
  } catch (error) {
    console.error("AI report generation error:", error);
    return generateFallbackReport(metrics, score);
  }
}

// Fallback report generation
function generateFallbackReport(metrics: PrivacyMetrics, score: number): { summary: string; leaks: string[]; mitigations: string[]; checklist: string[] } {
  const riskLevel = score >= 80 ? "moderate" : score >= 60 ? "elevated" : "significant";
  
  return {
    summary: `This wallet exhibits ${riskLevel} privacy risks based on analysis of ${metrics.transactionCount} recent transactions. Primary concerns include ${metrics.feePayerReuseRatio > 0.5 ? "high fee payer reuse" : "program fingerprinting"} and ${metrics.memoDetected ? "memo field data leakage" : "temporal activity patterns"}. Operational adjustments are recommended to reduce deanonymization risk.`,
    leaks: [
      `Fee payer concentration at ${(metrics.feePayerReuseRatio * 100).toFixed(0)}% creates wallet clustering signals`,
      `Program interaction fingerprint is ${metrics.programEntropy < 0.5 ? "highly distinctive" : "moderately unique"} (entropy: ${metrics.programEntropy.toFixed(2)})`,
      `Transaction timing shows ${metrics.temporalEntropy < 0.5 ? "predictable business-hour patterns" : "some timing regularity"}`,
      ...(metrics.memoDetected ? ["Memo fields detected - may contain identifying information"] : []),
      `Counterparty concentration at ${(metrics.counterpartyConcentration * 100).toFixed(0)}% reveals interaction patterns`,
      `Signer concentration at ${(metrics.signerConcentration * 100).toFixed(0)}% exposes organizational structure`,
    ].slice(0, 5),
    mitigations: [
      "Rotate fee payer wallets using a pool of at least 5 addresses",
      "Introduce random delays between transactions (30-300 second range)",
      "Use privacy-preserving DEX aggregators to obscure trading patterns",
      "Batch operations through program composition to reduce fingerprinting",
      "Implement memo field policies - never include identifiable data",
      "Consider using multiple operational wallets for different functions",
    ],
    checklist: [
      "Audit all current fee payer addresses and create rotation schedule",
      "Review memo usage across all transactions - remove sensitive data",
      "Implement transaction timing randomization in operational scripts",
      "Set up counterparty diversification strategy",
      "Document and train team on privacy-preserving transaction practices",
      "Schedule quarterly privacy posture reviews",
    ],
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client with service role for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get client IP and check rate limit
    const clientIP = getClientIP(req);
    console.log(`Request from IP: ${clientIP}`);
    
    const isAllowed = await checkRateLimit(supabase, clientIP, "analyze-wallet");
    
    if (!isAllowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW_MINUTES * 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60)
          } 
        }
      );
    }
    
    const { wallet } = await req.json();
    
    if (!wallet || typeof wallet !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate Solana address format with regex first (fast check)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(wallet)) {
      return new Response(
        JSON.stringify({ error: "Invalid Solana wallet address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Cryptographic validation using base58 decoding
    // A valid Solana public key is exactly 32 bytes when decoded
    try {
      const decoded = decodeBase58(wallet);
      if (decoded.length !== 32) {
        throw new Error("Invalid public key length");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid Solana wallet address - not a valid public key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Starting analysis for wallet: ${wallet}`);
    
    const HELIUS_API_KEY = Deno.env.get("HELIUS_API_KEY");
    if (!HELIUS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Helius API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch transactions (Helius max is 100 per request)
    const transactions = await getParsedTransactions(wallet, 100, HELIUS_API_KEY);
    console.log(`Fetched ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No transactions found for this wallet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract metadata
    const metas = extractTransactionMeta(transactions, wallet);
    console.log(`Extracted metadata from ${metas.length} transactions`);
    
    // Compute metrics
    const metrics = computeMetrics(metas);
    console.log(`Computed metrics: score components ready`);
    
    // Calculate score
    const score = calculateScore(metrics);
    console.log(`Privacy score: ${score}`);
    
    // Generate AI report
    const report = await generateReport(wallet, metrics, score);
    console.log(`Generated report`);
    
    return new Response(
      JSON.stringify({
        wallet,
        score,
        metrics: {
          feePayerReuseRatio: metrics.feePayerReuseRatio,
          signerConcentration: metrics.signerConcentration,
          programEntropy: metrics.programEntropy,
          counterpartyConcentration: metrics.counterpartyConcentration,
          memoDetected: metrics.memoDetected,
          temporalEntropy: metrics.temporalEntropy,
        },
        report,
        meta: {
          transactionCount: metrics.transactionCount,
          uniqueFeePayers: metrics.uniqueFeePayers,
          uniqueSigners: metrics.uniqueSigners,
          uniquePrograms: metrics.uniquePrograms,
          topPrograms: metrics.topPrograms,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
