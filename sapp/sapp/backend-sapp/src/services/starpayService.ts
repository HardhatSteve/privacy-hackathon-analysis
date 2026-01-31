/**
 * StarPay Service
 * Handles integration with StarPay API for virtual card purchases
 */

// Import types from dedicated type files
import type {
  CardOrderRequest,
  PaymentInfo,
  PricingInfo,
  CardOrderResponse,
  CardDetails,
  OrderStatusResponse,
  PriceResponse,
  OrderStatus,
  StarPayError,
} from '../types/starpay.types.js';

// Import constants
import { STARPAY_API_URL, STARPAY_LIMITS } from '../constants/api.js';

// Import utilities
import { isValidEmail } from '../utils/validation.js';

// Re-export types for consumers
export type {
  CardOrderRequest,
  PaymentInfo,
  PricingInfo,
  CardOrderResponse,
  CardDetails,
  OrderStatusResponse,
  PriceResponse,
  OrderStatus,
  StarPayError,
};

class StarPayService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.STARPAY_API_URL || STARPAY_API_URL;
    this.apiKey = process.env.STARPAY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[StarPayService] Warning: STARPAY_API_KEY not configured');
    }
  }

  /**
   * Create a new card order
   */
  async createOrder(request: CardOrderRequest): Promise<CardOrderResponse> {
    this.validateOrderRequest(request);

    const response = await this.makeRequest<CardOrderResponse>(
      '/api/v1/cards/order',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: request.amount,
          cardType: request.cardType,
          email: request.email,
        }),
      }
    );

    return response;
  }

  /**
   * Check order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('INVALID_ORDER_ID');
    }

    const response = await this.makeRequest<OrderStatusResponse>(
      `/api/v1/cards/order/status?orderId=${encodeURIComponent(orderId)}`,
      { method: 'GET' }
    );

    return response;
  }

  /**
   * Get pricing breakdown for an amount (without creating order)
   */
  async getPrice(amount: number): Promise<PriceResponse> {
    if (amount < STARPAY_LIMITS.MIN_AMOUNT || amount > STARPAY_LIMITS.MAX_AMOUNT) {
      throw new Error('INVALID_AMOUNT');
    }

    const response = await this.makeRequest<PriceResponse>(
      `/api/v1/cards/price?amount=${amount}`,
      { method: 'GET' }
    );

    return response;
  }

  /**
   * Validate card order request
   */
  private validateOrderRequest(request: CardOrderRequest): void {
    // Validate amount
    if (
      typeof request.amount !== 'number' ||
      request.amount < STARPAY_LIMITS.MIN_AMOUNT ||
      request.amount > STARPAY_LIMITS.MAX_AMOUNT
    ) {
      throw new Error('INVALID_AMOUNT');
    }

    // Validate card type
    if (!['visa', 'mastercard'].includes(request.cardType)) {
      throw new Error('INVALID_CARD_TYPE');
    }

    // Validate email using shared utility
    if (!request.email || !isValidEmail(request.email)) {
      throw new Error('INVALID_EMAIL');
    }
  }

  /**
   * Make authenticated request to StarPay API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new Error('STARPAY_NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = (await response.json()) as T & { error?: string; message?: string };

    if (!response.ok) {
      const errorCode = data.error || 'UNKNOWN_ERROR';
      const errorMessage = data.message || 'An unknown error occurred';

      console.error(`[StarPayService] API error: ${errorCode} - ${errorMessage}`);

      // Map StarPay error codes to our error codes
      switch (response.status) {
        case 401:
          throw new Error('UNAUTHORIZED');
        case 403:
          throw new Error('ACCOUNT_SUSPENDED');
        case 404:
          throw new Error('ORDER_NOT_FOUND');
        case 400:
          throw new Error(errorCode);
        default:
          throw new Error('INTERNAL_ERROR');
      }
    }

    return data as T;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const starpayService = new StarPayService();
