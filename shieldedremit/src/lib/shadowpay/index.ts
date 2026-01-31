/**
 * ShadowPay API Integration
 * Encrypted P2P payments, virtual cards, subscriptions, escrow, and ZK payments
 * https://registry.scalar.com/@radr/apis/shadowpay-api
 */

import type {
  Currency,
  VirtualCard,
  CardTransaction,
  PaymentIntent,
  Subscription,
  EscrowContract,
} from "@/types";

// ShadowPay API configuration
const SHADOWPAY_API_URL =
  process.env.NEXT_PUBLIC_SHADOWPAY_API_URL || "https://api.shadowpay.io";
const SHADOWPAY_API_KEY = process.env.NEXT_PUBLIC_SHADOWPAY_API_KEY || "";

// Request headers
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${SHADOWPAY_API_KEY}`,
  "X-API-Version": "v1",
});

// ==================== Payment Intents ====================

export interface CreatePaymentIntentParams {
  amount: number;
  currency: Currency;
  recipient: string;
  description?: string;
  metadata?: Record<string, string>;
  expiresIn?: number; // seconds
}

export interface PaymentIntentResponse {
  success: boolean;
  data?: PaymentIntent;
  error?: string;
}

/**
 * Create a new payment intent
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/payment-intents`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
        description: params.description,
        metadata: params.metadata,
        expires_in: params.expiresIn || 3600,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create payment intent" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        recipient: data.recipient,
        status: data.status,
        expiresAt: data.expires_at,
        paymentUrl: data.payment_url,
      },
    };
  } catch (error) {
    console.error("Create payment intent failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(
  intentId: string
): Promise<PaymentIntentResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/payment-intents/${intentId}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Payment intent not found" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        recipient: data.recipient,
        status: data.status,
        expiresAt: data.expires_at,
        paymentUrl: data.payment_url,
      },
    };
  } catch (error) {
    console.error("Get payment intent failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  intentId: string,
  signature: string
): Promise<PaymentIntentResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/payment-intents/${intentId}/confirm`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ signature }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to confirm payment" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        recipient: data.recipient,
        status: data.status,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error("Confirm payment intent failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Virtual Cards ====================

export interface CreateVirtualCardParams {
  amount: number;
  currency: Currency;
  wallet: string;
  signature: string;
}

export interface VirtualCardResponse {
  success: boolean;
  data?: VirtualCard;
  error?: string;
}

/**
 * Create a new virtual card (off-ramp)
 */
export async function createVirtualCard(
  params: CreateVirtualCardParams
): Promise<VirtualCardResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/cards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        wallet: params.wallet,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create virtual card" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        cardNumber: data.card_number,
        expiryDate: data.expiry_date,
        cvv: data.cvv,
        balance: data.balance,
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Create virtual card failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get virtual card details
 */
export async function getVirtualCard(
  cardId: string
): Promise<VirtualCardResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/cards/${cardId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Card not found" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        cardNumber: data.card_number,
        expiryDate: data.expiry_date,
        cvv: data.cvv,
        balance: data.balance,
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at,
        lastUsed: data.last_used,
      },
    };
  } catch (error) {
    console.error("Get virtual card failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Top up virtual card
 */
export async function topUpVirtualCard(
  cardId: string,
  amount: number,
  currency: Currency,
  signature: string
): Promise<VirtualCardResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/cards/${cardId}/topup`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ amount, currency, signature }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to top up card" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        cardNumber: data.card_number,
        expiryDate: data.expiry_date,
        cvv: data.cvv,
        balance: data.balance,
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Top up virtual card failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Freeze/unfreeze virtual card
 */
export async function toggleCardFreeze(
  cardId: string,
  freeze: boolean
): Promise<VirtualCardResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/cards/${cardId}/${freeze ? "freeze" : "unfreeze"}`,
      {
        method: "POST",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to update card" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        cardNumber: data.card_number,
        expiryDate: data.expiry_date,
        cvv: data.cvv,
        balance: data.balance,
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Toggle card freeze failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get card transactions
 */
export async function getCardTransactions(
  cardId: string,
  limit: number = 50
): Promise<{ success: boolean; data?: CardTransaction[]; error?: string }> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/cards/${cardId}/transactions?limit=${limit}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch transactions" };
    }

    return {
      success: true,
      data: data.transactions.map((tx: Record<string, unknown>) => ({
        id: tx.id,
        cardId: tx.card_id,
        amount: tx.amount,
        currency: tx.currency,
        merchant: tx.merchant,
        status: tx.status,
        timestamp: tx.timestamp,
      })),
    };
  } catch (error) {
    console.error("Get card transactions failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Subscriptions ====================

export interface CreateSubscriptionParams {
  merchantId: string;
  amount: number;
  currency: Currency;
  interval: "daily" | "weekly" | "monthly" | "yearly";
  wallet: string;
  signature: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data?: Subscription;
  error?: string;
}

/**
 * Create a subscription
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/subscriptions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        merchant_id: params.merchantId,
        amount: params.amount,
        currency: params.currency,
        interval: params.interval,
        wallet: params.wallet,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create subscription" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        merchantId: data.merchant_id,
        amount: data.amount,
        currency: data.currency,
        interval: data.interval,
        status: data.status,
        nextPayment: data.next_payment,
      },
    };
  } catch (error) {
    console.error("Create subscription failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to cancel subscription" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        merchantId: data.merchant_id,
        amount: data.amount,
        currency: data.currency,
        interval: data.interval,
        status: "cancelled",
        nextPayment: data.next_payment,
      },
    };
  } catch (error) {
    console.error("Cancel subscription failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Escrow ====================

export interface CreateEscrowParams {
  buyer: string;
  seller: string;
  amount: number;
  currency: Currency;
  conditions: string[];
  signature: string;
}

export interface EscrowResponse {
  success: boolean;
  data?: EscrowContract;
  error?: string;
}

/**
 * Create an escrow contract
 */
export async function createEscrow(
  params: CreateEscrowParams
): Promise<EscrowResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/escrow`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        buyer: params.buyer,
        seller: params.seller,
        amount: params.amount,
        currency: params.currency,
        conditions: params.conditions,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create escrow" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        buyer: data.buyer,
        seller: data.seller,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        conditions: data.conditions,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Create escrow failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Release escrow funds
 */
export async function releaseEscrow(
  escrowId: string,
  signature: string
): Promise<EscrowResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/escrow/${escrowId}/release`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ signature }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to release escrow" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        buyer: data.buyer,
        seller: data.seller,
        amount: data.amount,
        currency: data.currency,
        status: "released",
        conditions: data.conditions,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Release escrow failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Dispute escrow
 */
export async function disputeEscrow(
  escrowId: string,
  reason: string,
  signature: string
): Promise<EscrowResponse> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/escrow/${escrowId}/dispute`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reason, signature }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to dispute escrow" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        buyer: data.buyer,
        seller: data.seller,
        amount: data.amount,
        currency: data.currency,
        status: "disputed",
        conditions: data.conditions,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error("Dispute escrow failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== ZK Payments ====================

export interface ZKPaymentParams {
  amount: number;
  currency: Currency;
  recipient: string;
  proof: string;
  commitment: string;
  nullifier: string;
  wallet: string;
  signature: string;
}

export interface ZKPaymentResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    signature?: string;
    proofVerified: boolean;
  };
  error?: string;
}

/**
 * Execute a ZK payment with privacy proof
 */
export async function executeZKPayment(
  params: ZKPaymentParams
): Promise<ZKPaymentResponse> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/zk-payments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        recipient: params.recipient,
        proof: params.proof,
        commitment: params.commitment,
        nullifier: params.nullifier,
        wallet: params.wallet,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to execute ZK payment" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
        signature: data.tx_signature,
        proofVerified: data.proof_verified,
      },
    };
  } catch (error) {
    console.error("Execute ZK payment failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Verify a ZK proof
 */
export async function verifyZKProof(
  proof: string,
  commitment: string,
  nullifier: string
): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/zk-payments/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ proof, commitment, nullifier }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to verify proof" };
    }

    return {
      success: true,
      valid: data.valid,
    };
  } catch (error) {
    console.error("Verify ZK proof failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== Merchant Tools ====================

export interface MerchantConfig {
  id: string;
  name: string;
  wallet: string;
  webhookUrl?: string;
  callbackUrl?: string;
  acceptedCurrencies: Currency[];
  feePercentage: number;
}

export interface CreateMerchantParams {
  name: string;
  wallet: string;
  webhookUrl?: string;
  callbackUrl?: string;
  acceptedCurrencies: Currency[];
  signature: string;
}

/**
 * Register as a merchant
 */
export async function registerMerchant(
  params: CreateMerchantParams
): Promise<{ success: boolean; data?: MerchantConfig; error?: string }> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/merchants`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: params.name,
        wallet: params.wallet,
        webhook_url: params.webhookUrl,
        callback_url: params.callbackUrl,
        accepted_currencies: params.acceptedCurrencies,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to register merchant" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        wallet: data.wallet,
        webhookUrl: data.webhook_url,
        callbackUrl: data.callback_url,
        acceptedCurrencies: data.accepted_currencies,
        feePercentage: data.fee_percentage,
      },
    };
  } catch (error) {
    console.error("Register merchant failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get merchant dashboard data
 */
export async function getMerchantDashboard(
  merchantId: string
): Promise<{
  success: boolean;
  data?: {
    totalRevenue: number;
    transactionCount: number;
    pendingPayments: number;
    recentTransactions: Record<string, unknown>[];
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${SHADOWPAY_API_URL}/v1/merchants/${merchantId}/dashboard`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch dashboard" };
    }

    return {
      success: true,
      data: {
        totalRevenue: data.total_revenue,
        transactionCount: data.transaction_count,
        pendingPayments: data.pending_payments,
        recentTransactions: data.recent_transactions,
      },
    };
  } catch (error) {
    console.error("Get merchant dashboard failed:", error);
    return { success: false, error: "Network error" };
  }
}

// ==================== P2P Encrypted Payments ====================

export interface P2PPaymentParams {
  sender: string;
  recipient: string;
  amount: number;
  currency: Currency;
  message?: string; // Encrypted message
  signature: string;
}

/**
 * Send encrypted P2P payment
 */
export async function sendP2PPayment(
  params: P2PPaymentParams
): Promise<{ success: boolean; data?: { id: string; status: string }; error?: string }> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/p2p/send`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        sender: params.sender,
        recipient: params.recipient,
        amount: params.amount,
        currency: params.currency,
        message: params.message,
        signature: params.signature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to send payment" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
      },
    };
  } catch (error) {
    console.error("Send P2P payment failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Request P2P payment
 */
export async function requestP2PPayment(params: {
  requester: string;
  payer: string;
  amount: number;
  currency: Currency;
  message?: string;
  expiresIn?: number;
}): Promise<{ success: boolean; data?: { id: string; paymentUrl: string }; error?: string }> {
  try {
    const response = await fetch(`${SHADOWPAY_API_URL}/v1/p2p/request`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        requester: params.requester,
        payer: params.payer,
        amount: params.amount,
        currency: params.currency,
        message: params.message,
        expires_in: params.expiresIn || 86400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to create payment request" };
    }

    return {
      success: true,
      data: {
        id: data.id,
        paymentUrl: data.payment_url,
      },
    };
  } catch (error) {
    console.error("Request P2P payment failed:", error);
    return { success: false, error: "Network error" };
  }
}
