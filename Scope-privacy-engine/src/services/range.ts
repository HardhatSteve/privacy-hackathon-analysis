/**
 * Range Protocol Service - Compliance Check Mock
 * Simulates compliance screening for wallet addresses
 */

// Risk status returned by Range Protocol
export type RiskStatus = "Clean" | "Sanctioned" | "Flagged" | "Unknown";

export interface RangeCheckResult {
  address: string;
  status: RiskStatus;
  riskScore: number; // 0-100, where 100 is highest risk
  checkedAt: Date;
  details: {
    sanctionLists: string[];
    flags: string[];
    linkedToMixer: boolean;
    linkedToExploit: boolean;
  };
}

// Mock sanctioned addresses for testing
const MOCK_SANCTIONED_ADDRESSES: string[] = [
  "7eEqn3zGpQqq8fYjzqhfvwRRRVrBe3D3P4YfZ12GsAC1", // Mock Tornado-like
  "CnK9VjRNgSJcq1UR89J8RmMNPSYKe2qkM4eRLmWMKPxn", // Mock exploit address
  "Hp9SQbMoEhN9GwK1fY8xEyJBpDHZtCxXhpKA5KZjKekW", // Mock OFAC listed
];

// Mock flagged addresses (suspicious but not confirmed sanctioned)
const MOCK_FLAGGED_ADDRESSES: string[] = [
  "E6tYH8TcVpzWS7YfcM9cKH8NbxRcPQjKJqvUTWKD9FqN",
  "3JQRMn5sFjE7M3YPdCkL8KZKvN2qnhXTxmRYJWPsZKaB",
];

/**
 * Check the risk status of a wallet address
 * This is a mock implementation for the hackathon
 * In production, this would call Range Protocol's API
 * 
 * @param address - Solana wallet address to check
 * @returns RangeCheckResult with risk assessment
 */
export async function checkRisk(address: string): Promise<RangeCheckResult> {
  try {
    // Validate address format
    if (!address || address.length < 32 || address.length > 44) {
      return {
        address,
        status: "Unknown",
        riskScore: 0,
        checkedAt: new Date(),
        details: {
          sanctionLists: [],
          flags: ["Invalid address format"],
          linkedToMixer: false,
          linkedToExploit: false,
        },
      };
    }

    // Simulate API latency
    await simulateDelay(100);

    // Check against mock sanctioned addresses
    if (MOCK_SANCTIONED_ADDRESSES.includes(address)) {
      console.log(`🚨 SANCTIONED address detected: ${address}`);
      return {
        address,
        status: "Sanctioned",
        riskScore: 100,
        checkedAt: new Date(),
        details: {
          sanctionLists: ["OFAC SDN", "EU Sanctions List"],
          flags: ["Linked to illicit activities", "On government watchlist"],
          linkedToMixer: true,
          linkedToExploit: false,
        },
      };
    }

    // Check against mock flagged addresses
    if (MOCK_FLAGGED_ADDRESSES.includes(address)) {
      console.log(`⚠️  FLAGGED address detected: ${address}`);
      return {
        address,
        status: "Flagged",
        riskScore: 65,
        checkedAt: new Date(),
        details: {
          sanctionLists: [],
          flags: ["Suspicious activity patterns", "Under investigation"],
          linkedToMixer: false,
          linkedToExploit: false,
        },
      };
    }

    // Generate pseudo-random but deterministic risk score based on address
    const deterministicSeed = hashAddress(address);
    const baseRiskScore = deterministicSeed % 30; // 0-29 for clean addresses

    console.log(`✅ Address ${shortenAddress(address)} is Clean (risk: ${baseRiskScore})`);

    return {
      address,
      status: "Clean",
      riskScore: baseRiskScore,
      checkedAt: new Date(),
      details: {
        sanctionLists: [],
        flags: [],
        linkedToMixer: false,
        linkedToExploit: false,
      },
    };
  } catch (error) {
    console.error("❌ Error checking address risk:", error);
    return {
      address,
      status: "Unknown",
      riskScore: 50, // Assume moderate risk on error
      checkedAt: new Date(),
      details: {
        sanctionLists: [],
        flags: ["Error during risk check"],
        linkedToMixer: false,
        linkedToExploit: false,
      },
    };
  }
}

/**
 * Batch check multiple addresses for risk
 * @param addresses - Array of addresses to check
 * @returns Array of RangeCheckResults
 */
export async function batchCheckRisk(
  addresses: string[]
): Promise<RangeCheckResult[]> {
  const results: RangeCheckResult[] = [];

  for (const address of addresses) {
    const result = await checkRisk(address);
    results.push(result);
  }

  return results;
}

/**
 * Quick check - returns just the status string
 * @param address - Wallet address
 * @returns RiskStatus string
 */
export async function quickCheck(address: string): Promise<RiskStatus> {
  const result = await checkRisk(address);
  return result.status;
}

/**
 * Check if any interacting addresses are risky
 * @param addresses - Map of addresses to check
 * @returns Object with risky addresses found
 */
export async function checkInteractingAddresses(
  addresses: Map<string, number>
): Promise<{
  sanctionedAddresses: string[];
  flaggedAddresses: string[];
  totalChecked: number;
}> {
  const sanctionedAddresses: string[] = [];
  const flaggedAddresses: string[] = [];

  for (const [address] of addresses) {
    const result = await checkRisk(address);
    
    if (result.status === "Sanctioned") {
      sanctionedAddresses.push(address);
    } else if (result.status === "Flagged") {
      flaggedAddresses.push(address);
    }
  }

  return {
    sanctionedAddresses,
    flaggedAddresses,
    totalChecked: addresses.size,
  };
}

// Helper functions

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
