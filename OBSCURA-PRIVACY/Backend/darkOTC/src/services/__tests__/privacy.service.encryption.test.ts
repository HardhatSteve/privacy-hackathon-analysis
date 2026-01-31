/**
 * Privacy Service - Message Encryption/Decryption Tests (Task 3.4)
 * 
 * Tests for ECIES-based message encryption and decryption.
 * Requirements: 26.3, 26.6
 * 
 * ⚠️ CRITICAL: All tests use REAL cryptographic operations.
 * NO mocks, stubs, or simulations allowed.
 */

import { PrivacyService } from '../privacy.service';

describe('PrivacyService - Message Encryption/Decryption (Task 3.4)', () => {
  let service: PrivacyService;

  beforeEach(() => {
    service = new PrivacyService();
  });

  describe('encryptMessage', () => {
    it('should encrypt a message using recipient public key', () => {
      const message = 'Hello, this is a private message';
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Verify all required fields are present
      expect(result).toHaveProperty('encryptedContent');
      expect(result).toHaveProperty('recipientStealthAddress');
      expect(result).toHaveProperty('ephemeralPublicKey');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');

      // Verify encrypted content is base64
      expect(result.encryptedContent).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // Verify encrypted content is different from original message
      expect(result.encryptedContent).not.toBe(message);

      // Verify ephemeral public key format (compressed, 66 hex chars)
      expect(result.ephemeralPublicKey).toMatch(/^[0-9a-f]{66}$/i);

      // Verify IV format (32 hex chars = 16 bytes)
      expect(result.iv).toMatch(/^[0-9a-f]{32}$/i);

      // Verify authTag format (32 hex chars = 16 bytes)
      expect(result.authTag).toBeDefined();
      expect(result.authTag!.length).toBe(32);

      // Verify recipient address is stored
      expect(result.recipientStealthAddress).toBe(recipientKeyPair.publicKey);
    });

    it('should encrypt different messages differently', () => {
      const message1 = 'First message';
      const message2 = 'Second message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted1 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: message1,
      });

      const encrypted2 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: message2,
      });

      // Encrypted contents should be different
      expect(encrypted1.encryptedContent).not.toBe(encrypted2.encryptedContent);

      // Ephemeral keys should be different (new key per encryption)
      expect(encrypted1.ephemeralPublicKey).not.toBe(encrypted2.ephemeralPublicKey);

      // IVs should be different (random per encryption)
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Auth tags should be different
      expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
    });

    it('should encrypt same message differently each time (randomized)', () => {
      const message = 'Same message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted1 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      const encrypted2 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Even same message should encrypt differently (due to random IV and ephemeral key)
      expect(encrypted1.encryptedContent).not.toBe(encrypted2.encryptedContent);
      expect(encrypted1.ephemeralPublicKey).not.toBe(encrypted2.ephemeralPublicKey);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should use ECIES authenticated encryption', () => {
      const message = 'Test message for ECIES';
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // ECIES requires ephemeral key pair
      expect(result.ephemeralPublicKey).toBeDefined();
      expect(result.ephemeralPublicKey.length).toBe(66);

      // Authenticated encryption requires auth tag
      expect(result.authTag).toBeDefined();
      expect(result.authTag!.length).toBe(32);

      // AES-256-GCM requires IV
      expect(result.iv).toBeDefined();
      expect(result.iv.length).toBe(32);
    });

    it('should encrypt messages with stealth addresses', () => {
      const message = 'Private message to stealth address';
      const stealthAddress = service.generateStealthAddress();

      const result = service.encryptMessage({
        recipientKey: stealthAddress.address,
        message,
      });

      // Should work with stealth addresses
      expect(result.encryptedContent).toBeDefined();
      expect(result.recipientStealthAddress).toBe(stealthAddress.address);
      expect(result.ephemeralPublicKey).toBeDefined();
    });

    it('should handle empty messages', () => {
      const message = '';
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Should still encrypt empty messages
      expect(result.encryptedContent).toBeDefined();
      expect(result.ephemeralPublicKey).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
    });

    it('should handle long messages', () => {
      const message = 'A'.repeat(10000); // 10KB message
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Should handle long messages
      expect(result.encryptedContent).toBeDefined();
      expect(result.encryptedContent.length).toBeGreaterThan(0);
    });

    it('should handle special characters and unicode', () => {
      const message = 'Hello 世界 🌍 Special chars: !@#$%^&*()';
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Should handle unicode and special characters
      expect(result.encryptedContent).toBeDefined();
      expect(result.encryptedContent).not.toBe(message);
    });

    it('should use real cryptographic operations (no mocks)', () => {
      const message = 'Real crypto test';
      const recipientKeyPair = service.generateKeyPair();

      const result = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Verify ephemeral public key is valid EC point
      const firstByte = result.ephemeralPublicKey.substring(0, 2);
      expect(['02', '03']).toContain(firstByte);

      // Verify IV is random (not all zeros)
      expect(result.iv).not.toBe('0'.repeat(32));

      // Verify auth tag is not empty
      expect(result.authTag).not.toBe('0'.repeat(32));

      // Verify encrypted content is not plaintext
      expect(result.encryptedContent).not.toContain(message);
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt a message using recipient private key', () => {
      const originalMessage = 'Hello, this is a private message';
      const recipientKeyPair = service.generateKeyPair();

      // Encrypt the message
      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      // Decrypt the message
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      // Decrypted message should match original
      expect(decrypted).toBe(originalMessage);
    });

    it('should decrypt empty messages', () => {
      const originalMessage = '';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(originalMessage);
    });

    it('should decrypt long messages', () => {
      const originalMessage = 'B'.repeat(10000);
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(originalMessage);
    });

    it('should decrypt messages with special characters and unicode', () => {
      const originalMessage = 'Hello 世界 🌍 Special: !@#$%^&*()';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(originalMessage);
    });

    it('should fail to decrypt with wrong private key', () => {
      const message = 'Secret message';
      const recipientKeyPair = service.generateKeyPair();
      const wrongKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Attempting to decrypt with wrong private key should fail
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: wrongKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow();
    });

    it('should fail to decrypt with tampered encrypted content', () => {
      const message = 'Secret message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Tamper with encrypted content
      const tamperedContent = encrypted.encryptedContent.substring(0, encrypted.encryptedContent.length - 4) + 'XXXX';

      // Decryption should fail (auth tag verification)
      expect(() => {
        service.decryptMessage({
          encryptedContent: tamperedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow();
    });

    it('should fail to decrypt with tampered auth tag', () => {
      const message = 'Secret message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Tamper with auth tag
      expect(encrypted.authTag).toBeDefined();
      const tamperedAuthTag = encrypted.authTag!.substring(0, 30) + 'ff';

      // Decryption should fail (auth tag verification)
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: tamperedAuthTag,
        });
      }).toThrow();
    });

    it('should fail to decrypt with wrong IV', () => {
      const message = 'Secret message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Use wrong IV
      const wrongIV = '0'.repeat(32);

      // Decryption should fail
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: wrongIV,
          authTag: encrypted.authTag,
        });
      }).toThrow();
    });

    it('should fail to decrypt with missing parameters', () => {
      const message = 'Secret message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Missing ephemeralPublicKey
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: undefined as any,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow('Missing required decryption parameters');

      // Missing IV
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: undefined as any,
          authTag: encrypted.authTag,
        });
      }).toThrow('Missing required decryption parameters');

      // Missing authTag
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: undefined as any,
        });
      }).toThrow('Missing required decryption parameters');
    });
  });

  describe('Integration: Encryption/Decryption Round-Trip', () => {
    it('should support complete encryption/decryption workflow', () => {
      // Step 1: Generate recipient key pair
      const recipientKeyPair = service.generateKeyPair();

      // Step 2: Encrypt message
      const originalMessage = 'This is a confidential message for the RFQ system';
      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      // Step 3: Verify encryption worked
      expect(encrypted.encryptedContent).toBeDefined();
      expect(encrypted.encryptedContent).not.toBe(originalMessage);

      // Step 4: Decrypt message
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      // Step 5: Verify decryption matches original
      expect(decrypted).toBe(originalMessage);
    });

    it('should support encryption with stealth addresses', () => {
      // Step 1: Generate stealth address for recipient
      const stealthAddress = service.generateStealthAddress();

      // Step 2: Encrypt message to stealth address
      const message = 'Private message to stealth address';
      const encrypted = service.encryptMessage({
        recipientKey: stealthAddress.address,
        message,
      });

      // Step 3: Decrypt using stealth private key
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: stealthAddress.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      // Step 4: Verify round-trip
      expect(decrypted).toBe(message);
    });

    it('should support multiple messages between same parties', () => {
      const recipientKeyPair = service.generateKeyPair();

      // Encrypt multiple messages
      const messages = [
        'First message',
        'Second message',
        'Third message',
      ];

      const encrypted = messages.map(msg =>
        service.encryptMessage({
          recipientKey: recipientKeyPair.publicKey,
          message: msg,
        })
      );

      // Decrypt all messages
      const decrypted = encrypted.map(enc =>
        service.decryptMessage({
          encryptedContent: enc.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: enc.ephemeralPublicKey,
          iv: enc.iv,
          authTag: enc.authTag,
        })
      );

      // Verify all messages decrypt correctly
      expect(decrypted).toEqual(messages);

      // Verify each encryption is unique
      expect(encrypted[0].encryptedContent).not.toBe(encrypted[1].encryptedContent);
      expect(encrypted[0].encryptedContent).not.toBe(encrypted[2].encryptedContent);
      expect(encrypted[1].encryptedContent).not.toBe(encrypted[2].encryptedContent);
    });

    it('should support bidirectional messaging', () => {
      // Generate key pairs for taker and market maker
      const takerKeyPair = service.generateKeyPair();
      const makerKeyPair = service.generateKeyPair();

      // Taker sends message to maker
      const takerMessage = 'I want to buy 1000 SOL';
      const takerEncrypted = service.encryptMessage({
        recipientKey: makerKeyPair.publicKey,
        message: takerMessage,
      });

      // Maker decrypts taker's message
      const takerDecrypted = service.decryptMessage({
        encryptedContent: takerEncrypted.encryptedContent,
        privateKey: makerKeyPair.privateKey,
        ephemeralPublicKey: takerEncrypted.ephemeralPublicKey,
        iv: takerEncrypted.iv,
        authTag: takerEncrypted.authTag,
      });

      expect(takerDecrypted).toBe(takerMessage);

      // Maker sends response to taker
      const makerMessage = 'I can offer 50 USDC per SOL';
      const makerEncrypted = service.encryptMessage({
        recipientKey: takerKeyPair.publicKey,
        message: makerMessage,
      });

      // Taker decrypts maker's message
      const makerDecrypted = service.decryptMessage({
        encryptedContent: makerEncrypted.encryptedContent,
        privateKey: takerKeyPair.privateKey,
        ephemeralPublicKey: makerEncrypted.ephemeralPublicKey,
        iv: makerEncrypted.iv,
        authTag: makerEncrypted.authTag,
      });

      expect(makerDecrypted).toBe(makerMessage);
    });
  });

  describe('Security Properties', () => {
    it('should provide confidentiality (encrypted content hides message)', () => {
      const message = 'Secret trading information';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Encrypted content should not contain plaintext
      expect(encrypted.encryptedContent).not.toContain(message);
      expect(encrypted.encryptedContent).not.toContain('Secret');
      expect(encrypted.encryptedContent).not.toContain('trading');

      // Encrypted content should be base64 (not readable)
      expect(encrypted.encryptedContent).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should provide authenticity (auth tag prevents tampering)', () => {
      const message = 'Important message';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Tamper with encrypted content
      const tamperedContent = Buffer.from(encrypted.encryptedContent, 'base64');
      tamperedContent[0] = tamperedContent[0] ^ 0xFF; // Flip bits
      const tamperedBase64 = tamperedContent.toString('base64');

      // Decryption should fail due to auth tag mismatch
      expect(() => {
        service.decryptMessage({
          encryptedContent: tamperedBase64,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow();
    });

    it('should use unique ephemeral keys (forward secrecy)', () => {
      const message = 'Test message';
      const recipientKeyPair = service.generateKeyPair();

      // Encrypt same message multiple times
      const encrypted1 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      const encrypted2 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Each encryption should use different ephemeral key
      expect(encrypted1.ephemeralPublicKey).not.toBe(encrypted2.ephemeralPublicKey);

      // This provides forward secrecy - compromising one message doesn't affect others
    });

    it('should use unique IVs (prevents pattern analysis)', () => {
      const message = 'Same message';
      const recipientKeyPair = service.generateKeyPair();

      // Encrypt same message multiple times
      const encrypted1 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      const encrypted2 = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Each encryption should use different IV
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Different IVs prevent pattern analysis
      expect(encrypted1.encryptedContent).not.toBe(encrypted2.encryptedContent);
    });

    it('should prevent unauthorized decryption', () => {
      const message = 'Confidential information';
      const recipientKeyPair = service.generateKeyPair();
      const attackerKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Attacker with different key cannot decrypt
      expect(() => {
        service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: attackerKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow();
    });

    it('should use AES-256-GCM (authenticated encryption)', () => {
      const message = 'Test AES-256-GCM';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // AES-256-GCM requires:
      // 1. IV (16 bytes = 32 hex chars)
      expect(encrypted.iv.length).toBe(32);

      // 2. Auth tag (16 bytes = 32 hex chars)
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.authTag!.length).toBe(32);

      // 3. Encrypted content
      expect(encrypted.encryptedContent).toBeDefined();

      // Verify decryption works (proves AES-256-GCM is used correctly)
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(message);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid successive encryptions', () => {
      const recipientKeyPair = service.generateKeyPair();
      const messages = Array.from({ length: 50 }, (_, i) => `Message ${i}`);

      // Encrypt all messages rapidly
      const encrypted = messages.map(msg =>
        service.encryptMessage({
          recipientKey: recipientKeyPair.publicKey,
          message: msg,
        })
      );

      // All encryptions should be unique
      const uniqueEncrypted = new Set(encrypted.map(e => e.encryptedContent));
      expect(uniqueEncrypted.size).toBe(50);

      // All should decrypt correctly
      const decrypted = encrypted.map(enc =>
        service.decryptMessage({
          encryptedContent: enc.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: enc.ephemeralPublicKey,
          iv: enc.iv,
          authTag: enc.authTag,
        })
      );

      expect(decrypted).toEqual(messages);
    });

    it('should handle messages with newlines and whitespace', () => {
      const message = 'Line 1\nLine 2\n\tTabbed\n  Spaced';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(message);
    });

    it('should handle JSON messages', () => {
      const jsonMessage = JSON.stringify({
        quoteRequestId: 'qr-123',
        price: 50000,
        amount: 1000,
        timestamp: Date.now(),
      });

      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: jsonMessage,
      });

      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(jsonMessage);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonMessage));
    });

    it('should use real cryptographic operations (no mocks)', () => {
      const message = 'Verify real crypto';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Verify ephemeral key is valid EC point (starts with 02 or 03)
      const firstByte = encrypted.ephemeralPublicKey.substring(0, 2);
      expect(['02', '03']).toContain(firstByte);

      // Verify IV is random (not predictable)
      expect(encrypted.iv).not.toBe('0'.repeat(32));
      expect(encrypted.iv).not.toBe('f'.repeat(32));

      // Verify auth tag is not empty
      expect(encrypted.authTag).not.toBe('0'.repeat(32));

      // Verify encrypted content is base64
      expect(encrypted.encryptedContent).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // Verify decryption works (proves real crypto)
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(message);
    });

    it('should maintain encryption strength across multiple operations', () => {
      const recipientKeyPair = service.generateKeyPair();

      // Perform multiple encrypt/decrypt cycles
      for (let i = 0; i < 10; i++) {
        const message = `Message iteration ${i}`;

        const encrypted = service.encryptMessage({
          recipientKey: recipientKeyPair.publicKey,
          message,
        });

        const decrypted = service.decryptMessage({
          encryptedContent: encrypted.encryptedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });

        expect(decrypted).toBe(message);

        // Verify each encryption is unique
        expect(encrypted.ephemeralPublicKey).toMatch(/^[0-9a-f]{66}$/i);
        expect(encrypted.iv).toMatch(/^[0-9a-f]{32}$/i);
        expect(encrypted.authTag).toMatch(/^[0-9a-f]{32}$/i);
      }
    });
  });

  describe('Requirement Validation', () => {
    it('should satisfy Requirement 26.3: Encrypt messages using recipient stealth address', () => {
      // Generate stealth address for recipient
      const stealthAddress = service.generateStealthAddress();

      // Encrypt message using stealth address
      const message = 'Private RFQ message';
      const encrypted = service.encryptMessage({
        recipientKey: stealthAddress.address,
        message,
      });

      // Verify encryption succeeded
      expect(encrypted.encryptedContent).toBeDefined();
      expect(encrypted.recipientStealthAddress).toBe(stealthAddress.address);

      // Verify message is encrypted (not plaintext)
      expect(encrypted.encryptedContent).not.toBe(message);
      expect(encrypted.encryptedContent).not.toContain(message);
    });

    it('should satisfy Requirement 26.6: Decrypt messages using recipient private key', () => {
      // Generate key pair for recipient
      const recipientKeyPair = service.generateKeyPair();

      // Encrypt message
      const originalMessage = 'Confidential quote details';
      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message: originalMessage,
      });

      // Decrypt using recipient's private key
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      // Verify decryption succeeded and matches original
      expect(decrypted).toBe(originalMessage);
    });

    it('should use ECIES authenticated encryption (AES-256-GCM)', () => {
      const message = 'Test ECIES with AES-256-GCM';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // ECIES components:
      // 1. Ephemeral public key (for ECDH)
      expect(encrypted.ephemeralPublicKey).toBeDefined();
      expect(encrypted.ephemeralPublicKey.length).toBe(66);

      // 2. AES-256-GCM components
      expect(encrypted.iv).toBeDefined(); // Initialization vector
      expect(encrypted.authTag).toBeDefined(); // Authentication tag
      expect(encrypted.encryptedContent).toBeDefined(); // Ciphertext

      // Verify authenticated encryption works
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(message);
    });

    it('should work with stealth addresses from Task 3.1', () => {
      // Generate stealth address (Task 3.1)
      const stealthAddress = service.generateStealthAddress();

      // Encrypt message to stealth address (Task 3.4)
      const message = 'Message to stealth address';
      const encrypted = service.encryptMessage({
        recipientKey: stealthAddress.address,
        message,
      });

      // Decrypt using stealth private key (Task 3.4)
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: stealthAddress.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      // Verify integration works
      expect(decrypted).toBe(message);
    });

    it('should ensure message confidentiality and authenticity', () => {
      const message = 'Sensitive trading information';
      const recipientKeyPair = service.generateKeyPair();

      const encrypted = service.encryptMessage({
        recipientKey: recipientKeyPair.publicKey,
        message,
      });

      // Confidentiality: Message is hidden
      expect(encrypted.encryptedContent).not.toContain(message);
      expect(encrypted.encryptedContent).not.toContain('Sensitive');
      expect(encrypted.encryptedContent).not.toContain('trading');

      // Authenticity: Tampering is detected
      const tamperedContent = encrypted.encryptedContent.substring(0, encrypted.encryptedContent.length - 4) + 'XXXX';

      expect(() => {
        service.decryptMessage({
          encryptedContent: tamperedContent,
          privateKey: recipientKeyPair.privateKey,
          ephemeralPublicKey: encrypted.ephemeralPublicKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        });
      }).toThrow();

      // Verify original decrypts correctly
      const decrypted = service.decryptMessage({
        encryptedContent: encrypted.encryptedContent,
        privateKey: recipientKeyPair.privateKey,
        ephemeralPublicKey: encrypted.ephemeralPublicKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      expect(decrypted).toBe(message);
    });
  });
});
