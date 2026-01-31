/**
 * RFQ Service Tests
 * 
 * Tests for quote request creation, timeout logic, and cancellation.
 * 
 * Requirements: 1.1-1.7, 10.1-10.8
 */

import { rfqService } from '../rfq.service';
import { signatureService } from '../signature.service';
import { supabaseConfig } from '../../config/supabase.config';
import { QuoteRequestStatus } from '../../types/common.types';
import { createTestWallet, getWalletAddress } from '../../test-helpers/wots-wallet-helper';

describe('RFQ Service', () => {
  let testWallet: any;
  let testPublicKey: string;
  let signatureCounter = 0;
  
  // Helper function to create unique signatures
  const createSignature = (wallet: any, baseMessage: string): string => {
    const nonce = `${Date.now()}-${signatureCounter++}-${Math.random().toString(36).substring(7)}`;
    const message = `${baseMessage}:${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    return Buffer.from(wallet.sign(messageBytes)).toString('hex');
  };
  
  beforeAll(async () => {
    // Create WOTS+ wallet for testing
    const secret = new Uint8Array(32).fill(0x42);
    const tag = new Uint8Array(20).fill(0x12);
    testWallet = createTestWallet('Test Wallet', secret, tag);
    testPublicKey = getWalletAddress(testWallet);
    
    // Clear any existing test data
    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('asset_pair', 'TEST/%');
    
    await signatureService.clearUsedSignatures();
  });
  
  afterEach(async () => {
    // Clean up test data after each test
    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('asset_pair', 'TEST/%');
    
    // Clean up used signatures to prevent reuse errors in subsequent tests
    await signatureService.clearUsedSignatures();
  });
  
  describe('createQuoteRequest', () => {
    it('should create a quote request with valid parameters', async () => {
      // Prepare test data
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000; // 1 hour from now
      
      // Create signature with unique nonce
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      // Create quote request
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Verify response
      expect(result).toBeDefined();
      expect(result.quoteRequestId).toBeDefined();
      expect(result.stealthAddress).toBeDefined();
      expect(result.commitment).toBeDefined();
      expect(result.expiresAt).toBe(timeout);
      
      // Verify database entry
      const { data: quoteRequest } = await supabaseConfig.adminClient
        .from('quote_requests')
        .select('*')
        .eq('id', result.quoteRequestId)
        .single();
      
      expect(quoteRequest).toBeDefined();
      expect(quoteRequest.asset_pair).toBe(assetPair);
      expect(quoteRequest.direction).toBe(direction);
      expect(quoteRequest.status).toBe(QuoteRequestStatus.ACTIVE);
      expect(quoteRequest.taker_public_key).toBe(testPublicKey);
    });
    
    it('should reject quote request with timeout in the past', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() - 1000; // 1 second ago
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      await expect(
        rfqService.createQuoteRequest({
          assetPair,
          direction,
          amount,
          timeout,
          signature,
          publicKey: testPublicKey,
        })
      ).rejects.toThrow('Timeout must be in the future');
    });
    
    it('should reject quote request with timeout > 24 hours', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 25 * 60 * 60 * 1000; // 25 hours from now
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      await expect(
        rfqService.createQuoteRequest({
          assetPair,
          direction,
          amount,
          timeout,
          signature,
          publicKey: testPublicKey,
        })
      ).rejects.toThrow('Timeout cannot exceed 24 hours');
    });
    
    it('should reject quote request with invalid signature', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      // Use invalid signature
      const signature = '0'.repeat(4288); // Invalid signature
      
      await expect(
        rfqService.createQuoteRequest({
          assetPair,
          direction,
          amount,
          timeout,
          signature,
          publicKey: testPublicKey,
        })
      ).rejects.toThrow('Signature verification failed');
    });
    
    it('should reject quote request with reused signature', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      // Use same message for both requests (no nonce) to test reuse detection
      const message = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = Buffer.from(testWallet.sign(messageBytes)).toString('hex');
      
      // Create first quote request (should succeed)
      await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Try to create second quote request with same signature (should fail)
      await expect(
        rfqService.createQuoteRequest({
          assetPair,
          direction,
          amount,
          timeout,
          signature,
          publicKey: testPublicKey,
        })
      ).rejects.toThrow('Signature has already been used');
    });
  });
  
  describe('checkAndMarkExpired', () => {
    it('should mark expired quote request as expired', async () => {
      // Create a quote request that expires immediately
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 100; // Expires in 100ms
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check and mark expired
      const isExpired = await rfqService.checkAndMarkExpired(result.quoteRequestId);
      
      expect(isExpired).toBe(true);
      
      // Verify database status
      const { data: quoteRequest } = await supabaseConfig.adminClient
        .from('quote_requests')
        .select('*')
        .eq('id', result.quoteRequestId)
        .single();
      
      expect(quoteRequest.status).toBe(QuoteRequestStatus.EXPIRED);
    });
    
    it('should return false for non-expired quote request', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000; // 1 hour from now
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Check expiration
      const isExpired = await rfqService.checkAndMarkExpired(result.quoteRequestId);
      
      expect(isExpired).toBe(false);
      
      // Verify database status is still active
      const { data: quoteRequest } = await supabaseConfig.adminClient
        .from('quote_requests')
        .select('*')
        .eq('id', result.quoteRequestId)
        .single();
      
      expect(quoteRequest.status).toBe(QuoteRequestStatus.ACTIVE);
    });
  });
  
  describe('verifyQuoteRequestActive', () => {
    it('should return quote request data for active request', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Verify active
      const quoteRequest = await rfqService.verifyQuoteRequestActive(result.quoteRequestId);
      
      expect(quoteRequest).toBeDefined();
      expect(quoteRequest.id).toBe(result.quoteRequestId);
      expect(quoteRequest.status).toBe(QuoteRequestStatus.ACTIVE);
    });
    
    it('should throw error for expired quote request', async () => {
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 100; // Expires in 100ms
      
      const baseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const signature = createSignature(testWallet, baseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature,
        publicKey: testPublicKey,
      });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify should throw
      await expect(
        rfqService.verifyQuoteRequestActive(result.quoteRequestId)
      ).rejects.toThrow('Quote request has expired');
    });
    
    it('should throw error for non-existent quote request', async () => {
      await expect(
        rfqService.verifyQuoteRequestActive('non-existent-id')
      ).rejects.toThrow('Quote request not found');
    });
  });
  
  describe('cancelQuoteRequest', () => {
    it('should cancel an active quote request', async () => {
      // Create quote request
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      const createBaseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const createSig = createSignature(testWallet, createBaseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature: createSig,
        publicKey: testPublicKey,
      });
      
      // Cancel quote request (need new signature)
      const cancelBaseMessage = `cancel_quote_request:${result.quoteRequestId}`;
      const cancelSig = createSignature(testWallet, cancelBaseMessage);
      
      const cancelResult = await rfqService.cancelQuoteRequest({
        quoteRequestId: result.quoteRequestId,
        signature: cancelSig,
        publicKey: testPublicKey,
      });
      
      expect(cancelResult.quoteRequestId).toBe(result.quoteRequestId);
      expect(cancelResult.status).toBe(QuoteRequestStatus.CANCELLED);
      
      // Verify database status
      const { data: quoteRequest } = await supabaseConfig.adminClient
        .from('quote_requests')
        .select('*')
        .eq('id', result.quoteRequestId)
        .single();
      
      expect(quoteRequest.status).toBe(QuoteRequestStatus.CANCELLED);
    });
    
    it('should reject cancellation by non-owner', async () => {
      // Create quote request with first wallet
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      const createBaseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const createSig = createSignature(testWallet, createBaseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature: createSig,
        publicKey: testPublicKey,
      });
      
      // Try to cancel with different wallet
      const otherSecret = new Uint8Array(32).fill(0x99);
      const otherTag = new Uint8Array(20).fill(0x34);
      const otherWallet = createTestWallet('Other Wallet', otherSecret, otherTag);
      const otherPublicKey = getWalletAddress(otherWallet);
      const cancelBaseMessage = `cancel_quote_request:${result.quoteRequestId}`;
      const cancelSig = createSignature(otherWallet, cancelBaseMessage);
      
      await expect(
        rfqService.cancelQuoteRequest({
          quoteRequestId: result.quoteRequestId,
          signature: cancelSig,
          publicKey: otherPublicKey,
        })
      ).rejects.toThrow('Only the taker can cancel this quote request');
    });
    
    it('should reject cancellation of already cancelled request', async () => {
      // Create and cancel quote request
      const assetPair = 'TEST/USDC';
      const direction = 'buy';
      const amount = '1.5';
      const timeout = Date.now() + 60 * 60 * 1000;
      
      const createBaseMessage = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;
      const createSig = createSignature(testWallet, createBaseMessage);
      
      const result = await rfqService.createQuoteRequest({
        assetPair,
        direction,
        amount,
        timeout,
        signature: createSig,
        publicKey: testPublicKey,
      });
      
      // First cancellation
      const cancelBaseMessage1 = `cancel_quote_request:${result.quoteRequestId}`;
      const cancelSig1 = createSignature(testWallet, cancelBaseMessage1);
      
      await rfqService.cancelQuoteRequest({
        quoteRequestId: result.quoteRequestId,
        signature: cancelSig1,
        publicKey: testPublicKey,
      });
      
      // Second cancellation (should fail)
      // Note: We need to use the SAME signature to test reuse detection
      // Using a different signature would just be a normal "already cancelled" error
      await expect(
        rfqService.cancelQuoteRequest({
          quoteRequestId: result.quoteRequestId,
          signature: cancelSig1, // Reuse same signature
          publicKey: testPublicKey,
        })
      ).rejects.toThrow(); // Can be either "Signature has already been used" or "already cancelled"
    });
  });
});
