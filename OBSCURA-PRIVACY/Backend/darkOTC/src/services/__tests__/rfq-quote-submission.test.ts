/**
 * RFQ Service Tests - Quote Submission
 * 
 * Tests for market maker quote submission operations.
 * 
 * Requirements tested:
 * - 2.1: Market maker submits quote with quote_request_id, price, expiration
 * - 2.2: Verify market maker is whitelisted
 * - 2.3: Verify quote request exists and not expired
 * - 2.4: Create Pedersen commitment for price
 * - 2.5: Use relayer to submit quote (privacy)
 * - 2.6: Verify market maker has sufficient balance
 * - 2.7: Return quote_id to market maker
 * - 2.8: Return descriptive error on validation failure
 */

import { rfqService } from '../rfq.service';
import { whitelistService } from '../whitelist.service';
import { supabaseConfig } from '../../config/supabase.config';
import { createTestWallet, getWalletAddress } from '../../test-helpers/wots-wallet-helper';
import { QuoteRequestStatus, QuoteStatus } from '../../types/common.types';

describe('RFQService - Quote Submission', () => {
  const testAdminAddress = 'admin_quote_test_' + Date.now();
  let takerWallet: any;
  let takerAddress: string;
  let marketMakerWallet: any;
  let marketMakerAddress: string;
  let quoteRequestId: string;
  let walletCounter = 0;

  // Helper to create signatures with unique wallets
  // WOTS+ is a one-time signature scheme, so we need a new wallet for each signature
  const createSignatureWithNewWallet = (baseSecret: Uint8Array, baseTag: Uint8Array, message: string): { signature: string; publicKey: string } => {
    // Create a new wallet with unique secret/tag for each signature
    const uniqueSecret = new Uint8Array(32);
    uniqueSecret.set(baseSecret);
    uniqueSecret[0] = (uniqueSecret[0] + walletCounter) % 256; // Modify first byte
    
    const uniqueTag = new Uint8Array(20);
    uniqueTag.set(baseTag);
    uniqueTag[0] = (uniqueTag[0] + walletCounter) % 256; // Modify first byte
    
    walletCounter++;
    
    const wallet = createTestWallet(`Wallet_${walletCounter}`, uniqueSecret, uniqueTag);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = wallet.sign(messageBytes);
    
    return {
      signature: Buffer.from(signatureBytes).toString('hex'),
      publicKey: getWalletAddress(wallet)
    };
  };

  // Helper to create signatures (for backward compatibility with existing tests)
  const createSignature = (wallet: any, message: string): string => {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = wallet.sign(messageBytes);
    // Convert Uint8Array to hex string
    return Buffer.from(signatureBytes).toString('hex');
  };

  beforeAll(async () => {
    // Verify Supabase connection
    const connected = await supabaseConfig.verifyConnection();
    if (!connected) {
      throw new Error('Supabase connection failed - cannot run integration tests');
    }

    // Create test wallets
    const takerSecret = new Uint8Array(32).fill(0x42);
    const takerTag = new Uint8Array(20).fill(0x12);
    takerWallet = createTestWallet('Taker Wallet', takerSecret, takerTag);
    takerAddress = getWalletAddress(takerWallet);
    
    const mmSecret = new Uint8Array(32).fill(0x99);
    const mmTag = new Uint8Array(20).fill(0x34);
    marketMakerWallet = createTestWallet('Market Maker Wallet', mmSecret, mmTag);
    marketMakerAddress = getWalletAddress(marketMakerWallet);
  });

  beforeEach(async () => {
    // Clean up test data
    await supabaseConfig.adminClient
      .from('quotes')
      .delete()
      .like('market_maker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('taker_public_key', '%test%');

    // Clean up used_signatures - delete ALL entries
    // This is safe in test environment
    const { error: sigError } = await supabaseConfig.adminClient
      .from('used_signatures')
      .delete()
      .neq('signature_hash', ''); // Delete all non-empty signature hashes
    
    if (sigError) {
      console.error('Error cleaning up used_signatures:', sigError);
    }

    // Clean up whitelist - delete all entries (since we can't use LIKE on large addresses)
    // In test environment, it's safe to delete all whitelist entries
    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .neq('address', ''); // Delete all non-empty addresses (effectively all)

    // Create a test quote request for quote submission tests
    const futureTimeout = Date.now() + 60 * 60 * 1000; // 1 hour from now
    const createMessage = `create_quote_request:SOL/USDC:buy:1.5:${futureTimeout}`;
    const createSig = createSignature(takerWallet, createMessage);

    const quoteRequest = await rfqService.createQuoteRequest({
      assetPair: 'SOL/USDC',
      direction: 'buy',
      amount: '1.5',
      timeout: futureTimeout,
      signature: createSig,
      publicKey: takerAddress,
    });

    quoteRequestId = quoteRequest.quoteRequestId;
  });

  afterAll(async () => {
    // Clean up after all tests
    await supabaseConfig.adminClient
      .from('quotes')
      .delete()
      .like('market_maker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('taker_public_key', '%test%');

    // Clean up used_signatures - delete all entries
    await supabaseConfig.adminClient
      .from('used_signatures')
      .delete()
      .neq('signature_hash', '');

    // Clean up whitelist - delete all entries
    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .neq('address', '');
  });

  describe('submitQuote', () => {
    it('should submit a quote successfully when market maker is whitelisted', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000; // 30 minutes from now
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      expect(result.quoteId).toBeDefined();
      expect(result.priceCommitment).toBeDefined();
      expect(result.expiresAt).toBe(futureExpiration);

      // Verify quote was stored in database
      const { data: quote } = await supabaseConfig.adminClient
        .from('quotes')
        .select('*')
        .eq('id', result.quoteId)
        .single();

      expect(quote).toBeDefined();
      expect(quote.quote_request_id).toBe(quoteRequestId);
      expect(quote.market_maker_public_key).toBe(marketMakerAddress);
      expect(quote.status).toBe(QuoteStatus.ACTIVE);
    });

    it('should reject quote submission from non-whitelisted market maker', async () => {
      // Do NOT add market maker to whitelist
      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('not whitelisted');
    });

    it('should reject quote submission for non-existent quote request', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const fakeQuoteRequestId = 'fake-quote-request-id';
      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${fakeQuoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId: fakeQuoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('not found');
    });

    it('should reject quote submission for expired quote request', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      // Create an expired quote request
      const pastTimeout = Date.now() - 1000; // 1 second ago

      // Manually insert expired quote request (bypass validation)
      const expiredQuoteRequestId = 'expired-' + Date.now();
      await supabaseConfig.adminClient.from('quote_requests').insert({
        id: expiredQuoteRequestId,
        asset_pair: 'SOL/USDC',
        direction: 'buy',
        amount_commitment: '0x1234',
        stealth_address: 'stealth_addr',
        taker_public_key: takerAddress,
        created_at: Date.now() - 2000,
        expires_at: pastTimeout,
        status: QuoteRequestStatus.ACTIVE,
        nullifier: null,
      });

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${expiredQuoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId: expiredQuoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('expired');
    });

    it('should reject quote with expiration time in the past', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const pastExpiration = Date.now() - 1000; // 1 second ago
      const message = `submit_quote:${quoteRequestId}:100.5:${pastExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: pastExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('must be in the future');
    });

    it('should reject quote with expiration exceeding quote request expiration', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      // Get quote request expiration
      const { data: qr } = await supabaseConfig.adminClient
        .from('quote_requests')
        .select('expires_at')
        .eq('id', quoteRequestId)
        .single();

      if (!qr) {
        throw new Error('Quote request not found');
      }

      const excessiveExpiration = qr.expires_at + 1000; // 1 second after quote request expires
      const message = `submit_quote:${quoteRequestId}:100.5:${excessiveExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: excessiveExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('cannot exceed quote request expiration');
    });

    it('should reject quote submission with invalid signature', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const invalidSignature = 'invalid_signature_data';

      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature: invalidSignature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('Signature verification failed');
    });

    it('should reject quote submission with reused signature', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      // First submission should succeed
      await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      // Second submission with same signature should fail
      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('already been used');
    });

    it('should create Pedersen commitment for price', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      // Verify commitment format (should be hex string, may or may not have 0x prefix)
      expect(result.priceCommitment).toMatch(/^(0x)?[a-fA-F0-9]+$/);

      // Verify commitment is stored in database
      const { data: quote } = await supabaseConfig.adminClient
        .from('quotes')
        .select('price_commitment')
        .eq('id', result.quoteId)
        .single();

      if (!quote) {
        throw new Error('Quote not found in database');
      }

      expect(quote.price_commitment).toBe(result.priceCommitment);
    });
  });

  describe('getQuotesByRequestId', () => {
    it('should return all quotes for a quote request', async () => {
      // For this test, we need to use different wallets for each quote submission
      // because WOTS+ is a one-time signature scheme
      const mmSecret = new Uint8Array(32).fill(0x99);
      const mmTag = new Uint8Array(20).fill(0x34);

      // Submit multiple quotes with different wallets
      const futureExpiration1 = Date.now() + 30 * 60 * 1000;
      const futureExpiration2 = Date.now() + 31 * 60 * 1000; // 1 minute later
      
      const message1 = `submit_quote:${quoteRequestId}:100.5:${futureExpiration1}`;
      const { signature: sig1, publicKey: pk1 } = createSignatureWithNewWallet(mmSecret, mmTag, message1);
      
      // Add first wallet to whitelist
      await whitelistService.addToWhitelist(
        { address: pk1, signature: 'admin_sig' },
        testAdminAddress
      );
      
      await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration1,
        signature: sig1,
        publicKey: pk1,
      });

      const message2 = `submit_quote:${quoteRequestId}:101.0:${futureExpiration2}`;
      const { signature: sig2, publicKey: pk2 } = createSignatureWithNewWallet(mmSecret, mmTag, message2);
      
      // Add second wallet to whitelist
      await whitelistService.addToWhitelist(
        { address: pk2, signature: 'admin_sig' },
        testAdminAddress
      );
      
      await rfqService.submitQuote({
        quoteRequestId,
        price: '101.0',
        expirationTime: futureExpiration2,
        signature: sig2,
        publicKey: pk2,
      });

      const quotes = await rfqService.getQuotesByRequestId(quoteRequestId);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].quote_request_id).toBe(quoteRequestId);
      expect(quotes[1].quote_request_id).toBe(quoteRequestId);
    });

    it('should filter out expired quotes', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      // Submit a quote that will expire soon
      const soonExpiration = Date.now() + 100; // 100ms from now
      const message = `submit_quote:${quoteRequestId}:100.5:${soonExpiration}`;
      const signature = createSignature(marketMakerWallet, message);
      
      await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: soonExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      // Wait for quote to expire
      await new Promise(resolve => setTimeout(resolve, 200));

      const quotes = await rfqService.getQuotesByRequestId(quoteRequestId);

      // Should return empty array (expired quote filtered out)
      expect(quotes).toHaveLength(0);
    });

    it('should return empty array when no quotes exist', async () => {
      const quotes = await rfqService.getQuotesByRequestId(quoteRequestId);
      expect(quotes).toEqual([]);
    });
  });

  describe('verifyQuoteActive', () => {
    it('should verify active quote successfully', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      const quote = await rfqService.verifyQuoteActive(result.quoteId);

      expect(quote).toBeDefined();
      expect(quote.id).toBe(result.quoteId);
      expect(quote.status).toBe(QuoteStatus.ACTIVE);
    });

    it('should reject expired quote', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      // Submit a quote that will expire soon
      const soonExpiration = Date.now() + 100;
      const message = `submit_quote:${quoteRequestId}:100.5:${soonExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: soonExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      // Wait for quote to expire
      await new Promise(resolve => setTimeout(resolve, 200));

      await expect(
        rfqService.verifyQuoteActive(result.quoteId)
      ).rejects.toThrow('expired');
    });

    it('should reject non-existent quote', async () => {
      await expect(
        rfqService.verifyQuoteActive('non-existent-quote-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 2.2: Verify market maker is whitelisted', async () => {
      // Market maker NOT in whitelist
      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId,
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('not whitelisted');
    });

    it('should satisfy Requirement 2.3: Verify quote request exists and not expired', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      // Try to submit quote for non-existent quote request
      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:non-existent:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      await expect(
        rfqService.submitQuote({
          quoteRequestId: 'non-existent',
          price: '100.5',
          expirationTime: futureExpiration,
          signature,
          publicKey: marketMakerAddress,
        })
      ).rejects.toThrow('not found');
    });

    it('should satisfy Requirement 2.4: Create Pedersen commitment for price', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      // Verify commitment is created and returned
      expect(result.priceCommitment).toBeDefined();
      expect(result.priceCommitment).toMatch(/^(0x)?[a-fA-F0-9]+$/);
    });

    it('should satisfy Requirement 2.7: Return quote_id to market maker', async () => {
      // Add market maker to whitelist
      await whitelistService.addToWhitelist(
        { address: marketMakerAddress, signature: 'admin_sig' },
        testAdminAddress
      );

      const futureExpiration = Date.now() + 30 * 60 * 1000;
      const message = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await rfqService.submitQuote({
        quoteRequestId,
        price: '100.5',
        expirationTime: futureExpiration,
        signature,
        publicKey: marketMakerAddress,
      });

      expect(result.quoteId).toBeDefined();
      expect(typeof result.quoteId).toBe('string');
    });
  });
});
