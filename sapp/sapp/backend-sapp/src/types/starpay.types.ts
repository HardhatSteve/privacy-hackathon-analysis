/**
 * StarPay Types
 * Virtual card purchase integration
 */

// Order status
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// Supported card types
export type CardType = 'visa' | 'mastercard';

/**
 * Card order request
 */
export interface CardOrderRequest {
  amount: number;
  cardType: CardType;
  email: string;
}

/**
 * Payment information
 */
export interface PaymentInfo {
  address: string;
  amountSol: number;
  solPrice: number;
}

/**
 * Pricing breakdown
 */
export interface PricingInfo {
  cardValue: number;
  starpayFeePercent: number;
  starpayFee: number;
  resellerMarkup: number;
  total: number;
}

/**
 * Card order response
 */
export interface CardOrderResponse {
  orderId: string;
  status: OrderStatus;
  payment: PaymentInfo;
  pricing: PricingInfo;
  feeTier: string;
  expiresAt: string;
  checkStatusUrl: string;
}

/**
 * Card details (received after order completion)
 */
export interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

/**
 * Order status response
 */
export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  payment?: PaymentInfo;
  pricing?: PricingInfo;
  card?: CardDetails;
  expiresAt?: string;
  completedAt?: string;
  failureReason?: string;
}

/**
 * Price response
 */
export interface PriceResponse {
  pricing: PricingInfo;
  solPrice: number;
  amountSol: number;
}

/**
 * StarPay error
 */
export interface StarPayError {
  code: string;
  message: string;
}
