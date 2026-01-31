/**
 * ShadowID Integration
 * Zero-knowledge identity layer for the Solana privacy stack
 * https://www.radrlabs.io/docs/shadowid
 */

import type { ShadowIDProfile, ShadowIDVerification } from "@/types";

// ShadowID API configuration
const SHADOWID_API_URL =
  process.env.NEXT_PUBLIC_SHADOWID_API_URL || "https://api.shadowid.io";
const SHADOWID_API_KEY = process.env.NEXT_PUBLIC_SHADOWID_API_KEY || "";

// Request headers
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${SHADOWID_API_KEY}`,
  "X-API-Version": "v1",
});

// ==================== Profile Management ====================

export interface CreateProfileParams {
  wallet: string;
  signature: string;
  email?: string;
  phone?: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: ShadowIDProfile;
  error?: string;
}

/**
 * Create a new ShadowID profile
 */
export async function createProfile(
  params: CreateProfileParams
): Promise<ProfileResponse> {
  try {
    const response = await fetch(`${SHADOWID_API_URL}/v1/profiles`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        wallet: params.wallet,
        signature: params.signature,
        email: params.email,
        phone: params.phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create profile" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        wallet: data.wallet,
        kycLevel: data.kyc_level,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        complianceProof: data.compliance_proof,
      },
    };
  } catch (error) {
    console.error("Create profile failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get ShadowID profile by wallet
 */
export async function getProfile(wallet: string): Promise<ProfileResponse> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/profiles/wallet/${wallet}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Profile not found" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        wallet: data.wallet,
        kycLevel: data.kyc_level,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        complianceProof: data.compliance_proof,
      },
    };
  } catch (error) {
    console.error("Get profile failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Update ShadowID profile
 */
export async function updateProfile(
  profileId: string,
  updates: {
    email?: string;
    phone?: string;
  },
  signature: string
): Promise<ProfileResponse> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/profiles/${profileId}`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          ...updates,
          signature,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to update profile" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        wallet: data.wallet,
        kycLevel: data.kyc_level,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        complianceProof: data.compliance_proof,
      },
    };
  } catch (error) {
    console.error("Update profile failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== KYC Verification ====================

export interface StartVerificationParams {
  wallet: string;
  level: 1 | 2 | 3;
  signature: string;
  redirectUrl?: string;
}

export interface VerificationResponse {
  success: boolean;
  data?: {
    verificationId: string;
    verificationUrl: string;
    status: ShadowIDVerification["status"];
  };
  error?: string;
}

/**
 * Start KYC verification process
 */
export async function startVerification(
  params: StartVerificationParams
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${SHADOWID_API_URL}/v1/verification/start`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        wallet: params.wallet,
        level: params.level,
        signature: params.signature,
        redirect_url: params.redirectUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to start verification" };
    }

    return {
      success: true,
      data: {
        verificationId: data.verification_id,
        verificationUrl: data.verification_url,
        status: data.status,
      },
    };
  } catch (error) {
    console.error("Start verification failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Check verification status
 */
export async function checkVerificationStatus(
  verificationId: string
): Promise<{ success: boolean; data?: ShadowIDVerification; error?: string }> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/verification/${verificationId}/status`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Verification not found" };
    }

    return {
      success: true,
      data: {
        status: data.status,
        level: data.level,
        reason: data.reason,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error("Check verification status failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get verification requirements for a level
 */
export async function getVerificationRequirements(
  level: 1 | 2 | 3
): Promise<{
  success: boolean;
  data?: {
    level: number;
    requirements: string[];
    estimatedTime: string;
    limits: {
      dailyLimit: number;
      monthlyLimit: number;
      singleTransactionLimit: number;
    };
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/verification/requirements/${level}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to get requirements" };
    }

    return {
      success: true,
      data: {
        level: data.level,
        requirements: data.requirements,
        estimatedTime: data.estimated_time,
        limits: {
          dailyLimit: data.limits.daily_limit,
          monthlyLimit: data.limits.monthly_limit,
          singleTransactionLimit: data.limits.single_transaction_limit,
        },
      },
    };
  } catch (error) {
    console.error("Get verification requirements failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Compliance Proofs ====================

export interface ComplianceProofParams {
  wallet: string;
  proofType: "kyc" | "aml" | "sanctions" | "pep";
  signature: string;
}

/**
 * Generate a ZK compliance proof
 * Proves KYC/AML status without revealing personal information
 */
export async function generateComplianceProof(
  params: ComplianceProofParams
): Promise<{
  success: boolean;
  data?: {
    proof: string;
    commitment: string;
    nullifier: string;
    expiresAt: number;
    proofType: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/compliance/proof/generate`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          wallet: params.wallet,
          proof_type: params.proofType,
          signature: params.signature,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to generate proof" };
    }

    return {
      success: true,
      data: {
        proof: data.proof,
        commitment: data.commitment,
        nullifier: data.nullifier,
        expiresAt: data.expires_at,
        proofType: data.proof_type,
      },
    };
  } catch (error) {
    console.error("Generate compliance proof failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Verify a compliance proof
 */
export async function verifyComplianceProof(
  proof: string,
  commitment: string,
  proofType: string
): Promise<{
  success: boolean;
  data?: {
    valid: boolean;
    proofType: string;
    kycLevel: number;
    expiresAt: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${SHADOWID_API_URL}/v1/compliance/proof/verify`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          proof,
          commitment,
          proof_type: proofType,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to verify proof" };
    }

    return {
      success: true,
      data: {
        valid: data.valid,
        proofType: data.proof_type,
        kycLevel: data.kyc_level,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error("Verify compliance proof failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Address Screening ====================

/**
 * Screen an address against sanctions and compliance lists
 * Returns risk assessment without revealing the screened address
 */
export async function screenAddress(
  address: string
): Promise<{
  success: boolean;
  data?: {
    riskLevel: "low" | "medium" | "high";
    sanctioned: boolean;
    flags: string[];
    allowed: boolean;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${SHADOWID_API_URL}/v1/compliance/screen`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Screening failed" };
    }

    return {
      success: true,
      data: {
        riskLevel: data.risk_level,
        sanctioned: data.sanctioned,
        flags: data.flags || [],
        allowed: data.allowed,
      },
    };
  } catch (error) {
    console.error("Screen address failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== View Keys ====================

/**
 * Generate view key for selective disclosure
 * Allows third parties to view specific transaction data
 */
export async function generateViewKey(
  wallet: string,
  permissions: string[],
  signature: string,
  expiresIn?: number
): Promise<{
  success: boolean;
  data?: {
    viewKey: string;
    permissions: string[];
    expiresAt: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${SHADOWID_API_URL}/v1/view-keys/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        wallet,
        permissions,
        signature,
        expires_in: expiresIn || 86400 * 30, // 30 days default
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to generate view key" };
    }

    return {
      success: true,
      data: {
        viewKey: data.view_key,
        permissions: data.permissions,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error("Generate view key failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Revoke a view key
 */
export async function revokeViewKey(
  viewKey: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SHADOWID_API_URL}/v1/view-keys/revoke`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        view_key: viewKey,
        signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to revoke view key" };
    }

    return { success: true };
  } catch (error) {
    console.error("Revoke view key failed:", error);
    return { success: false, error: "Network error" };
  }
}
