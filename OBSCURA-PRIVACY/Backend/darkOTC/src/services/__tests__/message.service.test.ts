/**
 * Message Service Tests
 * 
 * Tests for private messaging between takers and market makers.
 * 
 * Requirements tested:
 * - 26.1: Send message with quote_request_id, recipient, content
 * - 26.2: Verify sender is taker or market maker
 * - 26.3: Encrypt message content
 * - 26.4: Use relayer to submit message
 * - 26.5: Return only messages where user is sender or recipient
 * - 26.6: Decrypt messages using user's private key
 * - 26.7: Return descriptive errors
 */

import { messageService } from '../message.service';
import { rfqService } from '../rfq.service';
import { whitelistService } from '../whitelist.service';
import { supabaseConfig } from '../../config/supabase.config';
import { createTestWallet, getWalletAddress } from '../../test-helpers/wots-wallet-helper';

describe('MessageService', () => {
  const testAdminAddress = 'admin_message_test_' + Date.now();
  let takerWallet: any;
  let takerAddress: string;
  let marketMakerWallet: any;
  let marketMakerAddress: string;
  let quoteRequestId: string;
  let stealthAddress: string;

  // Helper to create signatures
  const createSignature = (wallet: any, message: string): string => {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = wallet.sign(messageBytes);
    return Buffer.from(signatureBytes).toString('hex');
  };

  beforeAll(async () => {
    // Verify Supabase connection
    const connected = await supabaseConfig.verifyConnection();
    if (!connected) {
      throw new Error('Supabase connection failed - cannot run integration tests');
    }

    // Create test wallets
    const takerSecret = new Uint8Array(32).fill(0x77);
    const takerTag = new Uint8Array(20).fill(0x22);
    takerWallet = createTestWallet('Taker Wallet Message', takerSecret, takerTag);
    takerAddress = getWalletAddress(takerWallet);
    
    const mmSecret = new Uint8Array(32).fill(0xBB);
    const mmTag = new Uint8Array(20).fill(0x55);
    marketMakerWallet = createTestWallet('Market Maker Wallet Message', mmSecret, mmTag);
    marketMakerAddress = getWalletAddress(marketMakerWallet);
  });

  beforeEach(async () => {
    // Clean up test data
    await supabaseConfig.adminClient
      .from('messages')
      .delete()
      .like('sender_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quotes')
      .delete()
      .like('market_maker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('taker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('used_signatures')
      .delete()
      .neq('signature_hash', '');

    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .neq('address', '');

    // Create a test quote request
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
    stealthAddress = quoteRequest.stealthAddress;

    // Add market maker to whitelist
    await whitelistService.addToWhitelist(
      { address: marketMakerAddress, signature: 'admin_sig' },
      testAdminAddress
    );

    // Submit a quote from market maker
    const futureExpiration = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    const submitMessage = `submit_quote:${quoteRequestId}:100.5:${futureExpiration}`;
    const submitSig = createSignature(marketMakerWallet, submitMessage);

    await rfqService.submitQuote({
      quoteRequestId,
      price: '100.5',
      expirationTime: futureExpiration,
      signature: submitSig,
      publicKey: marketMakerAddress,
    });
  });

  afterAll(async () => {
    // Clean up after all tests
    await supabaseConfig.adminClient
      .from('messages')
      .delete()
      .like('sender_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quotes')
      .delete()
      .like('market_maker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('quote_requests')
      .delete()
      .like('taker_public_key', '%test%');

    await supabaseConfig.adminClient
      .from('used_signatures')
      .delete()
      .neq('signature_hash', '');

    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .neq('address', '');
  });

  describe('sendMessage', () => {
    it('should send a message successfully from taker to market maker', async () => {
      const encryptedContent = 'encrypted_message_content_base64';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      const result = await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent,
        signature,
        publicKey: takerAddress,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.messageId).toBe('string');
      expect(typeof result.timestamp).toBe('number');

      // Verify message was stored in database
      const { data: msg } = await supabaseConfig.adminClient
        .from('messages')
        .select('*')
        .eq('id', result.messageId)
        .single();

      expect(msg).toBeDefined();
      expect(msg.quote_request_id).toBe(quoteRequestId);
      expect(msg.sender_public_key).toBe(takerAddress);
      expect(msg.encrypted_content).toBe(encryptedContent);
    });

    it('should send a message successfully from market maker to taker', async () => {
      const encryptedContent = 'encrypted_response_from_mm';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(marketMakerWallet, message);

      const result = await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent,
        signature,
        publicKey: marketMakerAddress,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should reject message from unauthorized sender', async () => {
      // Create another wallet that is not taker or market maker
      const unauthorizedSecret = new Uint8Array(32).fill(0xCC);
      const unauthorizedTag = new Uint8Array(20).fill(0x66);
      const unauthorizedWallet = createTestWallet('Unauthorized', unauthorizedSecret, unauthorizedTag);
      const unauthorizedAddress = getWalletAddress(unauthorizedWallet);

      const encryptedContent = 'unauthorized_message';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(unauthorizedWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: unauthorizedAddress,
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject message for non-existent quote request', async () => {
      const fakeQuoteRequestId = 'fake-quote-request-id';
      const encryptedContent = 'message_for_fake_request';
      const message = `send_message:${fakeQuoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId: fakeQuoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('not found');
    });

    it('should reject message with empty content', async () => {
      const encryptedContent = '';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('cannot be empty');
    });

    it('should reject message with invalid signature', async () => {
      const encryptedContent = 'message_with_invalid_sig';
      const invalidSignature = 'invalid_signature_data';

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature: invalidSignature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('Signature verification failed');
    });

    it('should reject message with reused signature', async () => {
      const encryptedContent = 'message_with_reused_sig';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      // First message should succeed
      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent,
        signature,
        publicKey: takerAddress,
      });

      // Second message with same signature should fail
      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('already been used');
    });

    it('should reject message with invalid stealth address', async () => {
      const encryptedContent = 'message_with_invalid_address';
      const invalidAddress = '';
      const message = `send_message:${quoteRequestId}:${invalidAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: invalidAddress,
          encryptedContent,
          signature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('Invalid recipient stealth address');
    });
  });

  describe('getMessages', () => {
    it('should return messages for taker', async () => {
      // Send a message from taker
      const content1 = 'message_from_taker';
      const msg1 = `send_message:${quoteRequestId}:${stealthAddress}:${content1}`;
      const sig1 = createSignature(takerWallet, msg1);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content1,
        signature: sig1,
        publicKey: takerAddress,
      });

      // Send a message from market maker
      const content2 = 'message_from_mm';
      const msg2 = `send_message:${quoteRequestId}:${stealthAddress}:${content2}`;
      const sig2 = createSignature(marketMakerWallet, msg2);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content2,
        signature: sig2,
        publicKey: marketMakerAddress,
      });

      // Get messages as taker
      const result = await messageService.getMessages(quoteRequestId, takerAddress);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].encryptedContent).toBe(content1);
      expect(result.messages[1].encryptedContent).toBe(content2);
    });

    it('should return messages for market maker', async () => {
      // Send a message from market maker
      const content = 'message_from_mm_to_taker';
      const msg = `send_message:${quoteRequestId}:${stealthAddress}:${content}`;
      const sig = createSignature(marketMakerWallet, msg);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content,
        signature: sig,
        publicKey: marketMakerAddress,
      });

      // Get messages as market maker
      const result = await messageService.getMessages(quoteRequestId, marketMakerAddress);

      expect(result.success).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      expect(result.messages.some(m => m.encryptedContent === content)).toBe(true);
    });

    it('should return empty array when no messages exist', async () => {
      const result = await messageService.getMessages(quoteRequestId, takerAddress);

      expect(result.success).toBe(true);
      expect(result.messages).toEqual([]);
    });

    it('should reject unauthorized user from viewing messages', async () => {
      // Create another wallet that is not taker or market maker
      const unauthorizedSecret = new Uint8Array(32).fill(0xDD);
      const unauthorizedTag = new Uint8Array(20).fill(0x77);
      const unauthorizedWallet = createTestWallet('Unauthorized Viewer', unauthorizedSecret, unauthorizedTag);
      const unauthorizedAddress = getWalletAddress(unauthorizedWallet);

      await expect(
        messageService.getMessages(quoteRequestId, unauthorizedAddress)
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject viewing messages for non-existent quote request', async () => {
      const fakeQuoteRequestId = 'fake-quote-request-id';

      await expect(
        messageService.getMessages(fakeQuoteRequestId, takerAddress)
      ).rejects.toThrow('not found');
    });

    it('should return messages in chronological order', async () => {
      // Send multiple messages
      const content1 = 'first_message';
      const msg1 = `send_message:${quoteRequestId}:${stealthAddress}:${content1}`;
      const sig1 = createSignature(takerWallet, msg1);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content1,
        signature: sig1,
        publicKey: takerAddress,
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      const content2 = 'second_message';
      const msg2 = `send_message:${quoteRequestId}:${stealthAddress}:${content2}`;
      const sig2 = createSignature(marketMakerWallet, msg2);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content2,
        signature: sig2,
        publicKey: marketMakerAddress,
      });

      // Get messages
      const result = await messageService.getMessages(quoteRequestId, takerAddress);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(2);
      // Messages should be in chronological order (oldest first)
      expect(result.messages[0].timestamp).toBeLessThan(result.messages[1].timestamp);
      expect(result.messages[0].encryptedContent).toBe(content1);
      expect(result.messages[1].encryptedContent).toBe(content2);
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 26.1: Return message_id and timestamp', async () => {
      const encryptedContent = 'test_message_req_26_1';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      const result = await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent,
        signature,
        publicKey: takerAddress,
      });

      expect(result.messageId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.messageId).toBe('string');
      expect(typeof result.timestamp).toBe('number');
    });

    it('should satisfy Requirement 26.2: Verify sender is taker or market maker', async () => {
      // Create unauthorized wallet
      const unauthorizedSecret = new Uint8Array(32).fill(0xEE);
      const unauthorizedTag = new Uint8Array(20).fill(0x88);
      const unauthorizedWallet = createTestWallet('Unauthorized Req 26.2', unauthorizedSecret, unauthorizedTag);
      const unauthorizedAddress = getWalletAddress(unauthorizedWallet);

      const encryptedContent = 'unauthorized_message_req_26_2';
      const message = `send_message:${quoteRequestId}:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(unauthorizedWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: unauthorizedAddress,
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should satisfy Requirement 26.5: Return only messages where user is sender or recipient', async () => {
      // Send message from taker
      const content = 'message_req_26_5';
      const msg = `send_message:${quoteRequestId}:${stealthAddress}:${content}`;
      const sig = createSignature(takerWallet, msg);

      await messageService.sendMessage({
        quoteRequestId,
        recipientStealthAddress: stealthAddress,
        encryptedContent: content,
        signature: sig,
        publicKey: takerAddress,
      });

      // Get messages as taker (should see the message)
      const result = await messageService.getMessages(quoteRequestId, takerAddress);

      expect(result.success).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      expect(result.messages.some(m => m.senderPublicKey === takerAddress)).toBe(true);
    });

    it('should satisfy Requirement 26.7: Return descriptive errors', async () => {
      // Test various error scenarios
      const encryptedContent = 'test_error_messages';
      const message = `send_message:fake-id:${stealthAddress}:${encryptedContent}`;
      const signature = createSignature(takerWallet, message);

      await expect(
        messageService.sendMessage({
          quoteRequestId: 'fake-id',
          recipientStealthAddress: stealthAddress,
          encryptedContent,
          signature,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('Quote request not found');

      // Test empty content error
      const emptyMsg = `send_message:${quoteRequestId}:${stealthAddress}:`;
      const emptySig = createSignature(takerWallet, emptyMsg);

      await expect(
        messageService.sendMessage({
          quoteRequestId,
          recipientStealthAddress: stealthAddress,
          encryptedContent: '',
          signature: emptySig,
          publicKey: takerAddress,
        })
      ).rejects.toThrow('Message content cannot be empty');
    });
  });
});
