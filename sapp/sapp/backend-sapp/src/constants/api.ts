/**
 * API Constants
 * External API URLs and configuration
 */

// ShadowWire
export const SHADOWWIRE_API_URL = 'https://api.shadowwire.io';

// SilentSwap
export const SILENTSWAP_API_URLS = {
  MAINNET: 'https://api.silentswap.com',
  STAGING: 'https://api-staging.silentswap.com',
} as const;

// Lulo
export const LULO_API_URL = 'https://api.lulo.fi/v1';
export const LULO_DEFAULT_REFERRER = '6pZiqTT81nKLxMvQay7P6TrRx9NdWG5zbakaZdQoWoUb';

// StarPay
export const STARPAY_API_URL = 'https://www.starpay.cards';

// Validation limits
export const STARPAY_LIMITS = {
  MIN_AMOUNT: 5,
  MAX_AMOUNT: 10000,
} as const;

// Rate limiting defaults
export const RATE_LIMITS = {
  API_REQUESTS_PER_15_MIN: 100,
  AUTH_REQUESTS_PER_HOUR: 5,
  REGISTRATION_REQUESTS_PER_2_MIN: 15,
  SEARCH_REQUESTS_PER_MIN: 30,
  HANDLE_CHECK_REQUESTS_PER_MIN: 20,
} as const;
