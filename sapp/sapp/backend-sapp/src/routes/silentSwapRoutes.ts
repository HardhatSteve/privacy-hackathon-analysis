import { Router, type Request, type Response } from 'express';
import { silentSwapService, type SilentSwapQuoteRequest, type SilentSwapExecuteRequest } from '../services/silentSwapService.js';
import { createSignInMessage } from '@silentswap/sdk';

const router = Router();

// MARK: - Authentication Endpoints

/**
 * POST /api/sapp/silentswap/auth/nonce
 * Get nonce for SIWE authentication
 * Body: { evmAddress }
 * Response: { nonce }
 */
router.post('/auth/nonce', async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.body;

    if (!evmAddress) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required field: evmAddress',
      });
      return;
    }

    const result = await silentSwapService.getNonce(evmAddress);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Get nonce failed:', error);
    res.status(500).json({
      error: 'NONCE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get nonce',
    });
  }
});

/**
 * POST /api/sapp/silentswap/auth/create-siwe-message
 * Create SIWE message for signing
 * Body: { evmAddress, nonce }
 * Response: { message }
 */
router.post('/auth/create-siwe-message', async (req: Request, res: Response) => {
  try {
    const { evmAddress, nonce } = req.body;

    if (!evmAddress || !nonce) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: evmAddress, nonce',
      });
      return;
    }

    // Create SIWE message
    const signInMessage = createSignInMessage(
      evmAddress as `0x${string}`,
      nonce,
      'silentswap.local'
    );

    res.json({
      success: true,
      message: signInMessage.message,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Create SIWE message failed:', error);
    res.status(500).json({
      error: 'SIWE_MESSAGE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to create SIWE message',
    });
  }
});

/**
 * POST /api/sapp/silentswap/auth/authenticate
 * Authenticate with signed SIWE message
 * Body: { message, signature }
 * Response: { secretToken }
 */
router.post('/auth/authenticate', async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: message, signature',
      });
      return;
    }

    const result = await silentSwapService.authenticate(message, signature);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Authenticate failed:', error);
    res.status(500).json({
      error: 'AUTH_FAILED',
      message: error instanceof Error ? error.message : 'Failed to authenticate',
    });
  }
});

/**
 * POST /api/sapp/silentswap/auth/wallet-generation-eip712
 * Get EIP-712 document for wallet generation (entropy derivation)
 * Body: { secretToken }
 * Response: { eip712Doc }
 */
router.post('/auth/wallet-generation-eip712', async (req: Request, res: Response) => {
  try {
    const { secretToken } = req.body;

    if (!secretToken) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required field: secretToken',
      });
      return;
    }

    const eip712Doc = silentSwapService.getWalletGenerationEip712(secretToken);

    // Debug logging to understand the structure
    console.log('[SilentSwap Routes] EIP-712 document structure:');
    console.log('  - domain:', JSON.stringify(eip712Doc?.domain));
    console.log('  - domain fields:', Object.keys(eip712Doc?.domain || {}));
    console.log('  - primaryType:', eip712Doc?.primaryType);
    console.log('  - types keys:', Object.keys(eip712Doc?.types || {}));
    console.log('  - message:', JSON.stringify(eip712Doc?.message));
    console.log('  - message fields:', Object.keys(eip712Doc?.message || {}));

    // Check for field count mismatch
    const primaryType = eip712Doc?.primaryType;
    const primaryTypeFields = eip712Doc?.types?.[primaryType];
    const messageFields = Object.keys(eip712Doc?.message || {});
    if (Array.isArray(primaryTypeFields)) {
      console.log(`  - ${primaryType} type has ${primaryTypeFields.length} fields, message has ${messageFields.length} fields`);
      if (primaryTypeFields.length !== messageFields.length) {
        console.warn(`  - WARNING: Field count mismatch! Type fields: ${primaryTypeFields.map((f: any) => f.name).join(', ')}. Message fields: ${messageFields.join(', ')}`);
      }
    }

    // Validate the document structure
    if (!eip712Doc || typeof eip712Doc !== 'object') {
      throw new Error('EIP-712 document is not an object');
    }

    if (!eip712Doc.types || typeof eip712Doc.types !== 'object') {
      console.error('[SilentSwap Routes] Warning: EIP-712 types is missing or invalid');
    }

    // Check if EIP712Domain type exists
    if (!eip712Doc.types?.EIP712Domain) {
      console.log('[SilentSwap Routes] Warning: EIP712Domain type is missing, adding it');

      // Build EIP712Domain type based on domain fields
      const domainTypes: Array<{ name: string; type: string }> = [];
      if (eip712Doc.domain?.name !== undefined) domainTypes.push({ name: 'name', type: 'string' });
      if (eip712Doc.domain?.version !== undefined) domainTypes.push({ name: 'version', type: 'string' });
      if (eip712Doc.domain?.chainId !== undefined) domainTypes.push({ name: 'chainId', type: 'uint256' });
      if (eip712Doc.domain?.verifyingContract !== undefined) domainTypes.push({ name: 'verifyingContract', type: 'address' });
      if (eip712Doc.domain?.salt !== undefined) domainTypes.push({ name: 'salt', type: 'bytes32' });

      // Add EIP712Domain to types
      eip712Doc.types = {
        EIP712Domain: domainTypes,
        ...eip712Doc.types,
      };
    }

    // Log the final types with full details
    for (const [typeName, typeFields] of Object.entries(eip712Doc.types || {})) {
      console.log(`  - types.${typeName}: ${Array.isArray(typeFields) ? typeFields.length : 'NOT ARRAY'} fields`);
      if (Array.isArray(typeFields)) {
        typeFields.forEach((field: any, idx: number) => {
          console.log(`      [${idx}] name: "${field?.name}", type: "${field?.type}"`);
        });
      }
    }

    // CRITICAL FIX: Ensure all type fields have corresponding message values
    // The Privy SDK will fail if a type field is defined but the message value is undefined
    if (eip712Doc.types && eip712Doc.message && eip712Doc.primaryType) {
      const primaryTypeFields = eip712Doc.types[eip712Doc.primaryType];
      if (Array.isArray(primaryTypeFields)) {
        for (const field of primaryTypeFields) {
          const fieldName = field.name;
          if (eip712Doc.message[fieldName] === undefined) {
            console.warn(`[SilentSwap Routes] WARNING: Message field '${fieldName}' is undefined`);

            // Special case: if the field is 'token', use the secretToken
            if (fieldName === 'token') {
              console.log(`[SilentSwap Routes] Setting 'token' field to secretToken value`);
              eip712Doc.message[fieldName] = secretToken;
            } else if (field.type === 'string') {
              eip712Doc.message[fieldName] = '';
            } else if (field.type.startsWith('uint') || field.type.startsWith('int')) {
              eip712Doc.message[fieldName] = '0';
            } else if (field.type === 'bool') {
              eip712Doc.message[fieldName] = false;
            } else if (field.type === 'address') {
              eip712Doc.message[fieldName] = '0x0000000000000000000000000000000000000000';
            } else if (field.type.startsWith('bytes')) {
              eip712Doc.message[fieldName] = '0x';
            } else {
              eip712Doc.message[fieldName] = '';
            }
          }
        }
      }
    }

    // Log the full document as JSON for debugging
    console.log('[SilentSwap Routes] Full EIP-712 JSON:', JSON.stringify(eip712Doc, null, 2));

    res.json({
      success: true,
      eip712Doc,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Get wallet generation EIP-712 failed:', error);
    res.status(500).json({
      error: 'EIP712_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get EIP-712 document',
    });
  }
});

// MARK: - Quote & Order Endpoints

/**
 * POST /api/sapp/silentswap/quote
 * Get a quote for a SilentSwap
 * Body: {
 *   evmAddress, entropy, fromToken, toToken, amount,
 *   fromChain, toChain, recipientAddress, senderAddress
 * }
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const {
      evmAddress,
      entropy,
      fromToken,
      toToken,
      amount,
      fromChain,
      toChain,
      recipientAddress,
      senderAddress,
    } = req.body;

    // Validate required fields
    if (!evmAddress || !entropy || !fromToken || !toToken || !amount || !fromChain || !toChain || !recipientAddress || !senderAddress) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: evmAddress, entropy, fromToken, toToken, amount, fromChain, toChain, recipientAddress, senderAddress',
      });
      return;
    }

    // Validate chains
    const validChains = ['solana', 'ethereum', 'avalanche'];
    if (!validChains.includes(fromChain) || !validChains.includes(toChain)) {
      res.status(400).json({
        error: 'INVALID_CHAIN',
        message: 'Invalid chain. Supported: solana, ethereum, avalanche',
      });
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number',
      });
      return;
    }

    const quoteRequest: SilentSwapQuoteRequest = {
      evmAddress,
      entropy,
      fromToken,
      toToken,
      amount: amount.toString(),
      fromChain,
      toChain,
      recipientAddress,
      senderAddress,
    };

    const quote = await silentSwapService.getQuote(quoteRequest);

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Quote failed:', error);
    res.status(500).json({
      error: 'QUOTE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get quote',
    });
  }
});

/**
 * POST /api/sapp/silentswap/order-eip712
 * Get EIP-712 document for order signing
 * Body: { quoteResponse }
 * Response: { eip712Doc }
 */
router.post('/order-eip712', async (req: Request, res: Response) => {
  try {
    const { quoteResponse } = req.body;

    if (!quoteResponse) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required field: quoteResponse',
      });
      return;
    }

    const eip712Doc = silentSwapService.getOrderEip712(quoteResponse);

    res.json({
      success: true,
      eip712Doc,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Get order EIP-712 failed:', error);
    res.status(500).json({
      error: 'EIP712_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get EIP-712 document',
    });
  }
});

/**
 * POST /api/sapp/silentswap/execute
 * Execute a SilentSwap order
 * Body: {
 *   quoteId, evmAddress, entropy,
 *   signedAuthorizations, orderSignature, eip712Domain, rawQuote
 * }
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const {
      quoteId,
      evmAddress,
      entropy,
      signedAuthorizations,
      orderSignature,
      eip712Domain,
      rawQuote,
    } = req.body;

    if (!quoteId || !evmAddress || !entropy || !signedAuthorizations || !orderSignature || !eip712Domain || !rawQuote) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: quoteId, evmAddress, entropy, signedAuthorizations, orderSignature, eip712Domain, rawQuote',
      });
      return;
    }

    const executeRequest: SilentSwapExecuteRequest = {
      quoteId,
      evmAddress,
      entropy,
      signedAuthorizations,
      orderSignature,
      eip712Domain,
      rawQuote,
    };

    const result = await silentSwapService.executeSwap(executeRequest);

    res.json({
      success: true,
      swap: result,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Execute failed:', error);
    res.status(500).json({
      error: 'EXECUTE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to execute swap',
    });
  }
});

// MARK: - Status & Tokens Endpoints

/**
 * GET /api/sapp/silentswap/status/:orderId
 * Get the status of a SilentSwap order
 */
router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const orderIdParam = req.params.orderId;
    const orderId = typeof orderIdParam === 'string' ? orderIdParam : orderIdParam[0];

    if (!orderId) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required parameter: orderId',
      });
      return;
    }

    const status = await silentSwapService.getSwapStatus(orderId);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Status check failed:', error);
    res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: error instanceof Error ? error.message : 'Failed to check swap status',
    });
  }
});

/**
 * GET /api/sapp/silentswap/supported-tokens
 * Get list of supported tokens for SilentSwap
 */
router.get('/supported-tokens', async (_req: Request, res: Response) => {
  try {
    const tokens = await silentSwapService.getSupportedTokens();

    res.json({
      success: true,
      chains: ['solana', 'ethereum', 'avalanche'],
      tokens,
    });
  } catch (error) {
    console.error('[SilentSwap Routes] Get supported tokens failed:', error);
    res.status(500).json({
      error: 'TOKENS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get supported tokens',
    });
  }
});

export default router;
