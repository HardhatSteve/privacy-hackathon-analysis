/**
 * Assets Detector - Detects identity-revealing assets
 * Checks for NFTs (POAPs, event badges) and .sol domains
 */

import type { ParsedTransaction } from "../services/helius";
import { POINT_DEDUCTIONS } from "../utils/constants";

export interface AssetsDetectionResult {
  detected: boolean;
  nftsDetected: NFTAsset[];
  solDomainsDetected: string[];
  poapsDetected: NFTAsset[];
  identityExposureLevel: "none" | "low" | "medium" | "high";
  riskContribution: number;
}

export interface NFTAsset {
  mint: string;
  type: "nft" | "poap" | "badge" | "domain";
  name?: string | undefined;
  collection?: string | undefined;
  receivedTimestamp?: number | undefined;
}

// Known POAP and event NFT collections/programs
const POAP_INDICATORS = [
  "poap",
  "proof of attendance",
  "event",
  "badge",
  "attendance",
  "participated",
  "hackathon",
  "conference",
  "meetup",
];

// Solana name service program
const SNS_PROGRAM_ID = "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX";
const BONFIDA_PROGRAM_ID = "jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR";

/**
 * Detect identity-revealing assets in wallet
 * @param transactions - Parsed transaction history
 * @param walletAddress - The wallet being analyzed
 * @returns AssetsDetectionResult with all found identity-revealing assets
 */
export function detectIdentityAssets(
  transactions: ParsedTransaction[],
  walletAddress: string
): AssetsDetectionResult {
  const nftsDetected: NFTAsset[] = [];
  const solDomainsDetected: string[] = [];
  const poapsDetected: NFTAsset[] = [];

  try {
    for (const tx of transactions) {
      // Check for NFT events
      if (tx.events?.nft) {
        const nftEvent = tx.events.nft;
        
        // Check if wallet received an NFT
        if (nftEvent.buyer === walletAddress || 
            tx.description?.toLowerCase().includes("received")) {
          
          for (const nft of nftEvent.nfts || []) {
            const isPOAP = isPOAPorBadge(tx.description || "");
            
            if (isPOAP) {
              poapsDetected.push({
                mint: nft.mint,
                type: "poap",
                name: extractNFTName(tx.description),
                receivedTimestamp: tx.timestamp,
              });
            } else {
              nftsDetected.push({
                mint: nft.mint,
                type: "nft",
                name: extractNFTName(tx.description),
                receivedTimestamp: tx.timestamp,
              });
            }
          }
        }
      }

      // Check for .sol domain registrations
      if (isSOLDomainTransaction(tx)) {
        const domainName = extractDomainName(tx);
        if (domainName && !solDomainsDetected.includes(domainName)) {
          solDomainsDetected.push(domainName);
        }
      }

      // Check token transfers for NFT mints (tokenAmount = 1 often means NFT)
      for (const transfer of tx.tokenTransfers || []) {
        if (transfer.toUserAccount === walletAddress && 
            transfer.tokenAmount === 1 &&
            transfer.tokenStandard === "NonFungible") {
          
          const isPOAP = isPOAPorBadge(tx.description || "");
          
          if (isPOAP) {
            const existing = poapsDetected.find(p => p.mint === transfer.mint);
            if (!existing) {
              poapsDetected.push({
                mint: transfer.mint,
                type: "poap",
                receivedTimestamp: tx.timestamp,
              });
            }
          } else {
            const existing = nftsDetected.find(n => n.mint === transfer.mint);
            if (!existing) {
              nftsDetected.push({
                mint: transfer.mint,
                type: "nft",
                receivedTimestamp: tx.timestamp,
              });
            }
          }
        }
      }
    }

    // Calculate identity exposure level
    const identityExposureLevel = calculateExposureLevel(
      nftsDetected.length,
      poapsDetected.length,
      solDomainsDetected.length
    );

    // Calculate risk contribution
    let riskContribution = 0;
    
    // POAPs are identity-revealing
    riskContribution += poapsDetected.length * POINT_DEDUCTIONS.NFT_POAP_EXPOSED;
    
    // .sol domains are highly identity-revealing
    riskContribution += solDomainsDetected.length * POINT_DEDUCTIONS.SOL_DOMAIN_EXPOSED;
    
    // Cap the contribution
    riskContribution = Math.min(riskContribution, 30);

    const detected = 
      nftsDetected.length > 0 || 
      poapsDetected.length > 0 || 
      solDomainsDetected.length > 0;

    const result: AssetsDetectionResult = {
      detected,
      nftsDetected,
      solDomainsDetected,
      poapsDetected,
      identityExposureLevel,
      riskContribution,
    };

    if (detected) {
      console.log(`⚠️  Identity-revealing assets detected:`);
      if (poapsDetected.length > 0) {
        console.log(`   - POAPs/Badges: ${poapsDetected.length}`);
      }
      if (solDomainsDetected.length > 0) {
        console.log(`   - .sol domains: ${solDomainsDetected.join(", ")}`);
      }
      if (nftsDetected.length > 0) {
        console.log(`   - NFTs: ${nftsDetected.length}`);
      }
    } else {
      console.log(`✅ No identity-revealing assets detected`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error in assets detection:", error);
    return {
      detected: false,
      nftsDetected: [],
      solDomainsDetected: [],
      poapsDetected: [],
      identityExposureLevel: "none",
      riskContribution: 0,
    };
  }
}

/**
 * Check if transaction description indicates a POAP or badge
 */
function isPOAPorBadge(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return POAP_INDICATORS.some(indicator => lowerDesc.includes(indicator));
}

/**
 * Check if transaction is related to .sol domain
 */
function isSOLDomainTransaction(tx: ParsedTransaction): boolean {
  // Check if transaction involves Solana Name Service
  const description = (tx.description || "").toLowerCase();
  
  if (description.includes(".sol") || 
      description.includes("domain") ||
      description.includes("name service")) {
    return true;
  }

  // Check if any account is the SNS program
  for (const account of tx.accountData || []) {
    if (account.account === SNS_PROGRAM_ID || 
        account.account === BONFIDA_PROGRAM_ID) {
      return true;
    }
  }

  return false;
}

/**
 * Extract domain name from transaction
 */
function extractDomainName(tx: ParsedTransaction): string | null {
  const description = tx.description || "";
  
  // Try to find .sol domain in description
  const solMatch = description.match(/([a-zA-Z0-9_-]+\.sol)/);
  if (solMatch && solMatch[1]) {
    return solMatch[1];
  }

  return null;
}

/**
 * Extract NFT name from transaction description
 */
function extractNFTName(description: string | undefined): string | undefined {
  if (!description) return undefined;
  
  // Common patterns: "received [NFT Name]", "minted [NFT Name]"
  const patterns = [
    /received\s+(.+?)(?:\s+from|\s*$)/i,
    /minted\s+(.+?)(?:\s+from|\s*$)/i,
    /bought\s+(.+?)(?:\s+for|\s*$)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Calculate overall identity exposure level
 */
function calculateExposureLevel(
  nftCount: number,
  poapCount: number,
  domainCount: number
): "none" | "low" | "medium" | "high" {
  const totalScore = nftCount + (poapCount * 2) + (domainCount * 3);

  if (totalScore === 0) return "none";
  if (totalScore <= 2) return "low";
  if (totalScore <= 5) return "medium";
  return "high";
}

/**
 * Generate warnings for identity-revealing assets
 */
export function generateAssetWarnings(result: AssetsDetectionResult): string[] {
  const warnings: string[] = [];

  if (result.poapsDetected.length > 0) {
    warnings.push(
      `${result.poapsDetected.length} POAPs/event badges detected. ` +
        `These can reveal your real-world identity and event attendance.`
    );
  }

  for (const domain of result.solDomainsDetected) {
    warnings.push(
      `.sol domain "${domain}" linked to this wallet. ` +
        `Domains are public and can deanonymize your wallet.`
    );
  }

  if (result.nftsDetected.length >= 5) {
    warnings.push(
      `${result.nftsDetected.length} NFTs detected. ` +
        `NFT ownership patterns can be used for fingerprinting.`
    );
  }

  return warnings;
}

/**
 * Generate recommendations for asset-related privacy issues
 */
export function generateAssetActions(result: AssetsDetectionResult): string[] {
  const actions: string[] = [];

  if (result.poapsDetected.length > 0) {
    actions.push(
      "Transfer POAPs and event badges to a separate public-facing wallet."
    );
  }

  if (result.solDomainsDetected.length > 0) {
    actions.push(
      "Use a dedicated public wallet for .sol domains, separate from your DeFi wallet."
    );
  }

  if (result.identityExposureLevel === "high") {
    actions.push(
      "Consider creating a new anonymous wallet for privacy-sensitive activities."
    );
  }

  return actions;
}
