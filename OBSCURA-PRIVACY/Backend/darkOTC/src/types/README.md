# Types Directory

This directory contains all TypeScript interfaces, types, and validation schemas for the Obscura Dark OTC RFQ MVP.

## Overview

All types are designed to work with **real infrastructure** (no mocks or simulations). Each type file includes:
- TypeScript interfaces for data models
- Zod validation schemas for runtime validation
- Type inference from Zod schemas
- JSDoc comments with requirement references

## Files

### `common.types.ts`
Common types and enums used across the application:
- **Enums**: `TradeDirection`, `QuoteRequestStatus`, `QuoteStatus`, `Network`, `Token`
- **Type Aliases**: `AssetPair`, `SolanaPublicKey`, `EthereumAddress`, `PedersenCommitment`, `StealthAddress`, `Nullifier`, `WOTSSignature`, etc.
- **Validation Schemas**: Zod schemas for all common types

### `quote-request.types.ts`
Types for quote request operations:
- **Interfaces**: `QuoteRequest`, `CreateQuoteRequestRequest`, `CreateQuoteRequestResponse`, `CancelQuoteRequestRequest`, `CancelQuoteRequestResponse`
- **Validation Schemas**: `CreateQuoteRequestSchema`, `CancelQuoteRequestSchema`
- **Requirements**: 1.1-1.7, 10.1-10.8

### `quote.types.ts`
Types for quote submission and acceptance:
- **Interfaces**: `Quote`, `SubmitQuoteRequest`, `SubmitQuoteResponse`, `AcceptQuoteRequest`, `AcceptQuoteResponse`, `QuoteSummary`
- **Validation Schemas**: `SubmitQuoteSchema`, `AcceptQuoteSchema`
- **Requirements**: 2.1-2.8, 3.1-3.9

### `message.types.ts`
Types for private messaging:
- **Interfaces**: `Message`, `SendMessageRequest`, `SendMessageResponse`, `MessageSummary`, `DecryptedMessage`
- **Validation Schemas**: `SendMessageSchema`, `GetMessagesQuerySchema`
- **Requirements**: 26.1-26.7

### `whitelist.types.ts`
Types for market maker authorization:
- **Interfaces**: `WhitelistEntry`, `AddToWhitelistRequest`, `RemoveFromWhitelistRequest`, `CheckWhitelistRequest`, `WhitelistAuditLog`
- **Validation Schemas**: `AddToWhitelistSchema`, `RemoveFromWhitelistSchema`, `CheckWhitelistSchema`
- **Requirements**: 33.1-33.6

### `privacy.types.ts`
Types for privacy-preserving operations:
- **Interfaces**: `StealthAddressPair`, `PedersenCommitmentData`, `NullifierData`, `EncryptedMessageData`, `DecryptedMessageData`
- **Validation Schemas**: `CommitmentVerificationSchema`, `EncryptionParametersSchema`, `DecryptionParametersSchema`
- **Requirements**: 1.2, 1.3, 2.4, 3.4, 26.3, 26.6

### `obscura-llms.types.ts`
Types for Obscura-LLMS backend integration:
- **Interfaces**: `DepositNote`, `DepositRequest`, `WithdrawRequest`, `PrivacyStatus`, `RelayerStats`, `BalanceVerificationRequest`
- **Validation Schemas**: `DepositRequestSchema`, `WithdrawRequestSchema`, `BalanceVerificationRequestSchema`
- **Requirements**: 34.1-34.7, 36.1-36.5

### `api.types.ts`
Common API types and error handling:
- **Interfaces**: `ApiSuccessResponse`, `ApiErrorResponse`, `PaginationParams`, `HealthCheckResponse`
- **Enums**: `ErrorCode`, `HttpStatus`
- **Helper Functions**: `buildErrorResponse()`, `buildSuccessResponse()`, `getHttpStatusForErrorCode()`
- **Requirements**: 37.1-37.7

### `validation.ts`
Validation utilities and helper functions:
- **Functions**: `validate()`, `validateAsync()`, `safeParse()`, `isValid()`, `validateRequiredFields()`
- **Format Validators**: `isValidAssetPair()`, `isValidSolanaPublicKey()`, `isValidEthereumAddress()`, `isValidAmount()`, `isValidTimestamp()`, `isValidHex()`

## Usage Examples

### Validating Request Data

```typescript
import { validate, CreateQuoteRequestSchema } from './types';

// Validate request body
const result = validate(CreateQuoteRequestSchema, req.body);

if (!result.success) {
  return res.status(400).json(result.error);
}

// Use validated data (type-safe)
const { assetPair, direction, amount, timeout, signature, publicKey } = result.data;
```

### Creating Type-Safe Responses

```typescript
import { buildSuccessResponse, buildErrorResponse, ErrorCode } from './types';

// Success response
const response = buildSuccessResponse({
  quoteRequestId: 'uuid',
  stealthAddress: 'address',
  commitment: 'commitment',
  expiresAt: Date.now() + 3600000,
});

// Error response
const error = buildErrorResponse(
  ErrorCode.VALIDATION_ERROR,
  'Invalid asset pair format',
  { assetPair: req.body.assetPair }
);
```

### Using Type Guards

```typescript
import { isValidAssetPair, isValidAmount, isValidTimestamp } from './types';

// Validate asset pair
if (!isValidAssetPair('SOL/USDC')) {
  throw new Error('Invalid asset pair');
}

// Validate amount
if (!isValidAmount('1.5', 0.0003)) {
  throw new Error('Amount too small');
}

// Validate timestamp
if (!isValidTimestamp(Date.now() + 3600000, true)) {
  throw new Error('Invalid future timestamp');
}
```

### Working with Privacy Types

```typescript
import { 
  StealthAddressPair, 
  PedersenCommitmentData, 
  NullifierData 
} from './types';

// Generate stealth address
const stealthAddress: StealthAddressPair = {
  address: 'stealth_address',
  privateKey: 'private_key',
  ephemeralPublicKey: 'ephemeral_key',
};

// Create commitment
const commitment: PedersenCommitmentData = {
  commitment: '0x...',
  value: BigInt(1000000),
  blinding: BigInt(12345),
};

// Generate nullifier
const nullifier: NullifierData = {
  nullifier: '0x...',
  nullifierHash: '0x...',
};
```

## Validation Rules

### Asset Pair
- Format: `TOKEN1/TOKEN2` (e.g., "SOL/USDC")
- Tokens: 2-10 uppercase letters
- Example: `SOL/USDC`, `ETH/USDT`

### Amount
- Type: String (to avoid precision issues)
- Minimum: 0.0003
- Must be positive
- Example: `"1.5"`, `"0.001"`

### Timestamp
- Type: Number (milliseconds since epoch)
- Must be positive integer
- Future timestamps: Must be > Date.now()
- Maximum timeout: 24 hours from creation

### Blockchain Addresses
- **Solana**: Base58 encoded, 32-44 characters
- **Ethereum**: 0x prefixed hex, 42 characters total
- Example Solana: `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`
- Example Ethereum: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Signatures
- **WOTS+**: Post-quantum signature (minimum 100 characters)
- Must not be reused (tracked in database)

### Commitments
- **Pedersen**: Hex encoded (0x prefixed)
- Hides actual values (amounts, prices)

### Nullifiers
- **Format**: 32 bytes hex encoded (64 hex chars + 0x prefix)
- **Hash**: SHA256 of nullifier
- Used for double-spend protection

## Error Handling

All validation errors follow a consistent format:

```typescript
{
  success: false,
  code: "VALIDATION_ERROR",
  error: "Validation failed",
  details: { ... },
  fieldErrors: {
    "assetPair": ["Asset pair must be in format TOKEN1/TOKEN2"],
    "amount": ["Amount must be a positive number >= 0.0003"]
  },
  meta: {
    timestamp: 1234567890
  }
}
```

## Type Safety

All types are fully type-safe with TypeScript:
- Interfaces define data structures
- Zod schemas provide runtime validation
- Type inference ensures consistency
- No `any` types (except in generic utilities)

## Testing

Types should be tested for:
1. **Validation**: Zod schemas correctly validate/reject data
2. **Serialization**: Round-trip JSON serialization works
3. **Type Guards**: Helper functions correctly identify valid data
4. **Error Handling**: Validation errors are properly formatted

## Requirements Traceability

Each type file includes JSDoc comments referencing specific requirements:
- `@validates` - Which requirements this type validates
- `@requirement` - Specific requirement numbers

Example:
```typescript
/**
 * Create Quote Request Request
 * 
 * @validates Requirements 1.1, 1.7, 37.1, 37.2
 * @requirement 1.1 - Taker submits quote request with asset pair, direction, amount, timeout
 */
```

## Best Practices

1. **Always validate user input** using Zod schemas
2. **Use type guards** for additional validation
3. **Build consistent responses** using helper functions
4. **Map error codes to HTTP status** using `getHttpStatusForErrorCode()`
5. **Never expose internal errors** to users
6. **Log validation errors** for debugging
7. **Use TypeScript strict mode** for maximum type safety

## Future Enhancements

Potential improvements for future versions:
- Custom Zod refinements for complex validation
- Additional type guards for edge cases
- Performance optimizations for validation
- More detailed error messages
- Internationalization support for error messages
