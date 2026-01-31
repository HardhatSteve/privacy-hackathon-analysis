# Middleware

This directory contains Express middleware functions for the Obscura Dark OTC RFQ system.

## Signature Verification Middleware

The signature verification middleware provides WOTS+ (Winternitz One-Time Signature Plus) signature verification for all RFQ operations, ensuring post-quantum security and preventing signature reuse attacks.

### Features

- **Post-Quantum Security**: Uses WOTS+ signatures via `mochimo-wots-v2` library
- **Signature Reuse Detection**: Tracks used signatures in Supabase database
- **Operation-Specific Verification**: Specialized middleware for each RFQ operation type
- **Descriptive Error Messages**: Returns clear error responses for invalid or reused signatures
- **Flexible Configuration**: Supports custom message builders and optional reuse checking

### Requirements Validated

- **35.1**: Require WOTS+ signature for all RFQ operations
- **35.2**: Validate signatures against claimed sender's public key
- **35.3**: Reject operations with invalid signatures
- **35.4**: Reject operations with reused signatures
- **35.5**: Maintain record of used signature hashes

### Usage

#### Basic Usage

```typescript
import { verifyQuoteRequestSignature } from './middleware';

// Apply to route
router.post('/api/v1/rfq/quote-request',
  verifyQuoteRequestSignature,
  createQuoteRequestHandler
);
```

#### Specialized Middleware

The middleware provides pre-configured functions for each operation type:

```typescript
import {
  verifyQuoteRequestSignature,
  verifyQuoteSignature,
  verifyQuoteAcceptanceSignature,
  verifyCancellationSignature,
  verifyMessageSignature,
  verifyWhitelistSignature,
} from './middleware';

// Quote request creation
router.post('/api/v1/rfq/quote-request',
  verifyQuoteRequestSignature,
  handler
);

// Quote submission
router.post('/api/v1/rfq/quote',
  verifyQuoteSignature,
  handler
);

// Quote acceptance
router.post('/api/v1/rfq/quote/:id/accept',
  verifyQuoteAcceptanceSignature,
  handler
);

// Quote request cancellation
router.post('/api/v1/rfq/quote-request/:id/cancel',
  verifyCancellationSignature,
  handler
);

// Private messaging
router.post('/api/v1/rfq/message',
  verifyMessageSignature,
  handler
);

// Whitelist management
router.post('/api/v1/admin/whitelist/add',
  verifyWhitelistSignature('add'),
  handler
);

router.post('/api/v1/admin/whitelist/remove',
  verifyWhitelistSignature('remove'),
  handler
);
```

#### Custom Middleware

For custom operations, use the middleware factory:

```typescript
import { verifySignature } from './middleware';

const customMiddleware = verifySignature({
  operationType: 'custom_operation',
  checkReuse: true,
  markAsUsed: true,
  messageBuilder: (req) => {
    // Build custom message from request
    const { field1, field2 } = req.body;
    return JSON.stringify({ field1, field2 });
  },
});

router.post('/api/v1/custom',
  customMiddleware,
  handler
);
```

#### Standalone Verification

For non-HTTP contexts (e.g., testing, background jobs):

```typescript
import { verifySignatureStandalone, buildSignatureMessage } from './middleware';

// Build message
const message = buildSignatureMessage('quote_request', {
  assetPair: 'SOL/USDC',
  direction: 'buy',
  amount: '100',
  timeout: Date.now() + 3600000,
});

// Verify signature
const result = await verifySignatureStandalone({
  message,
  signature: wotsSignature,
  publicKey: wotsPublicKey,
  operationType: 'quote_request',
  checkReuse: true,
  markAsUsed: true,
});

if (result.success) {
  console.log('Signature verified:', result.signatureHash);
} else {
  console.error('Verification failed:', result.error);
}
```

### Message Format

Each operation type has a specific message format that must be signed:

#### Quote Request
```json
{
  "assetPair": "SOL/USDC",
  "direction": "buy",
  "amount": "100",
  "timeout": 1234567890
}
```

#### Quote
```json
{
  "quoteRequestId": "uuid",
  "price": "100.5",
  "expirationTime": 1234567890
}
```

#### Quote Acceptance
```json
{
  "quoteId": "uuid",
  "quoteRequestId": "uuid"
}
```

#### Cancellation
```json
{
  "quoteRequestId": "uuid"
}
```

#### Message
```json
{
  "quoteRequestId": "uuid",
  "recipientStealthAddress": "0x...",
  "encryptedContent": "base64..."
}
```

#### Whitelist Operations
```json
{
  "address": "0x...",
  "operation": "add" | "remove"
}
```

### Request Extension

After successful verification, the middleware attaches the following to the request object:

```typescript
interface SignatureVerifiedRequest extends Request {
  signatureHash?: string;      // Hash of the verified signature
  verifiedPublicKey?: string;  // Public key that signed the request
  operationType?: string;       // Type of operation
}
```

### Error Responses

The middleware returns consistent error responses:

```typescript
{
  success: false,
  code: "SIGNATURE_VERIFICATION_FAILED" | "SIGNATURE_REUSED" | "MISSING_FIELD",
  error: "Human-readable error message",
  details?: {
    // Additional error details
  },
  meta: {
    timestamp: 1234567890
  }
}
```

### Error Codes

- `MISSING_FIELD`: Signature or public key missing from request
- `SIGNATURE_VERIFICATION_FAILED`: Signature verification failed (invalid signature or wrong public key)
- `SIGNATURE_REUSED`: Signature has already been used (WOTS+ signatures are one-time use only)
- `INTERNAL_ERROR`: Internal error during verification

### Testing

The middleware includes comprehensive tests:

- **Unit Tests** (`signature-verification.middleware.test.ts`): Tests middleware logic with mocked services
- **Integration Tests** (`signature-verification.integration.test.ts`): Tests message building and database integration

Run tests:
```bash
npm test -- src/middleware/__tests__/
```

### Security Considerations

1. **One-Time Signatures**: WOTS+ signatures can only be used once. Reusing a signature compromises security.
2. **Signature Tracking**: All used signatures are stored in the database to prevent reuse.
3. **Post-Quantum Security**: WOTS+ is resistant to quantum computer attacks.
4. **Message Integrity**: Any tampering with the signed message will cause verification to fail.

### Performance

- Signature verification is CPU-intensive (WOTS+ operations)
- Average verification time: ~200ms per signature
- Database queries for reuse detection add ~10-20ms
- Consider rate limiting for signature-heavy endpoints

### Dependencies

- `mochimo-wots-v2`: WOTS+ signature library
- `@supabase/supabase-js`: Database for signature tracking
- `express`: Web framework

### Related Files

- `src/services/signature.service.ts`: Core signature verification logic
- `src/types/api.types.ts`: Error codes and response types
- `src/types/common.types.ts`: WOTS signature and public key types
