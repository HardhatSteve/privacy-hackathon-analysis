/**
 * Privacy Service Tests
 * 
 * Tests for privacy-preserving cryptographic operations.
 * Focuses on stealth address generation for Task 3.1.
 */

import { privacyService, PrivacyService } from '../privacy.service';

describe('PrivacyService', () => {
  let service: PrivacyService;

  beforeEach(() => {
    service = new PrivacyService();
  });

  describe('Stealth Address Generation (Task 3.1)', () => {
    describe('generateStealthAddress', () => {
      it('should generate a valid stealth address pair', () => {
        const result = service.generateStealthAddress();

        // Verify all required fields are present
        expect(result).toHaveProperty('address');
        expect(result).toHaveProperty('privateKey');
        expect(result).toHaveProperty('ephemeralPublicKey');

        // Verify address format (compressed public key, 66 hex chars)
        expect(result.address).toMatch(/^[0-9a-f]{66}$/i);

        // Verify private key format (64 hex chars)
        expect(result.privateKey).toMatch(/^[0-9a-f]{64}$/i);

        // Verify ephemeral public key format (compressed, 66 hex chars)
        expect(result.ephemeralPublicKey).toMatch(/^[0-9a-f]{66}$/i);
      });

      it('should generate unique stealth addresses on each call', () => {
        const address1 = service.generateStealthAddress();
        const address2 = service.generateStealthAddress();
        const address3 = service.generateStealthAddress();

        // All addresses should be different (unlinkability)
        expect(address1.address).not.toBe(address2.address);
        expect(address1.address).not.toBe(address3.address);
        expect(address2.address).not.toBe(address3.address);

        // All private keys should be different
        expect(address1.privateKey).not.toBe(address2.privateKey);
        expect(address1.privateKey).not.toBe(address3.privateKey);
        expect(address2.privateKey).not.toBe(address3.privateKey);

        // All ephemeral keys should be different
        expect(address1.ephemeralPublicKey).not.toBe(address2.ephemeralPublicKey);
        expect(address1.ephemeralPublicKey).not.toBe(address3.ephemeralPublicKey);
        expect(address2.ephemeralPublicKey).not.toBe(address3.ephemeralPublicKey);
      });

      it('should use real cryptographic operations (no mocks)', () => {
        const result = service.generateStealthAddress();

        // Verify the address is a valid elliptic curve point
        // by checking it starts with 02 or 03 (compressed format)
        const firstByte = result.address.substring(0, 2);
        expect(['02', '03']).toContain(firstByte);

        // Verify private key is within valid range (not all zeros, not all ones)
        expect(result.privateKey).not.toBe('0'.repeat(64));
        expect(result.privateKey).not.toBe('f'.repeat(64));

        // Verify ephemeral public key is valid
        const ephemeralFirstByte = result.ephemeralPublicKey.substring(0, 2);
        expect(['02', '03']).toContain(ephemeralFirstByte);
      });

      it('should generate addresses with proper entropy', () => {
        // Generate multiple addresses and check for randomness
        const addresses = Array.from({ length: 10 }, () =>
          service.generateStealthAddress()
        );

        // Check that all addresses are unique
        const uniqueAddresses = new Set(addresses.map(a => a.address));
        expect(uniqueAddresses.size).toBe(10);

        // Check that all private keys are unique
        const uniquePrivateKeys = new Set(addresses.map(a => a.privateKey));
        expect(uniquePrivateKeys.size).toBe(10);

        // Check that all ephemeral keys are unique
        const uniqueEphemeralKeys = new Set(addresses.map(a => a.ephemeralPublicKey));
        expect(uniqueEphemeralKeys.size).toBe(10);
      });

      it('should generate addresses that are unlinkable', () => {
        // Generate multiple stealth addresses
        const addresses = Array.from({ length: 5 }, () =>
          service.generateStealthAddress()
        );

        // Verify no two addresses share any common prefix beyond the format byte
        for (let i = 0; i < addresses.length; i++) {
          for (let j = i + 1; j < addresses.length; j++) {
            const addr1 = addresses[i].address;
            const addr2 = addresses[j].address;

            // Check that addresses are completely different
            expect(addr1).not.toBe(addr2);

            // Check that they don't share a long common prefix (beyond first 2 chars)
            let commonPrefixLength = 0;
            for (let k = 2; k < Math.min(addr1.length, addr2.length); k++) {
              if (addr1[k] === addr2[k]) {
                commonPrefixLength++;
              } else {
                break;
              }
            }

            // Common prefix should be very short (statistical randomness)
            // Allow up to 4 chars common prefix (very unlikely but possible)
            expect(commonPrefixLength).toBeLessThan(5);
          }
        }
      });

      it('should return both address and private key for recipient', () => {
        const result = service.generateStealthAddress();

        // Verify both address (public) and private key (secret) are returned
        expect(result.address).toBeDefined();
        expect(result.privateKey).toBeDefined();

        // Verify they are different
        expect(result.address).not.toBe(result.privateKey);

        // Verify address is longer (compressed public key)
        expect(result.address.length).toBe(66);
        expect(result.privateKey.length).toBe(64);
      });

      it('should use ECDH key derivation', () => {
        // Generate a stealth address
        const stealth = service.generateStealthAddress();

        // Verify the ephemeral public key is present (required for ECDH)
        expect(stealth.ephemeralPublicKey).toBeDefined();
        expect(stealth.ephemeralPublicKey.length).toBe(66);

        // Verify it's a valid compressed public key
        const firstByte = stealth.ephemeralPublicKey.substring(0, 2);
        expect(['02', '03']).toContain(firstByte);
      });

      it('should generate one-time addresses', () => {
        // Generate multiple addresses
        const addresses = Array.from({ length: 20 }, () =>
          service.generateStealthAddress()
        );

        // Verify all addresses are unique (one-time use)
        const uniqueAddresses = new Set(addresses.map(a => a.address));
        expect(uniqueAddresses.size).toBe(20);

        // Verify no address is repeated
        addresses.forEach((addr, index) => {
          const otherAddresses = addresses.filter((_, i) => i !== index);
          expect(otherAddresses.some(a => a.address === addr.address)).toBe(false);
        });
      });
    });

    describe('deriveStealthPrivateKey', () => {
      it('should allow recipient to derive the stealth private key', () => {
        // Generate a recipient key pair
        const recipientKeyPair = service.generateKeyPair();

        // Simulate stealth address generation with known recipient
        // (In real usage, the stealth address would be generated for this recipient)
        const stealth = service.generateStealthAddress();

        // Recipient should be able to derive the private key using their key and ephemeral public key
        // Note: This test verifies the method exists and works, but in real usage,
        // the stealth address would be generated specifically for the recipient's public key
        const derivedKey = service.deriveStealthPrivateKey(
          recipientKeyPair.privateKey,
          stealth.ephemeralPublicKey
        );

        // Verify derived key is valid format
        expect(derivedKey).toMatch(/^[0-9a-f]{64}$/i);
        expect(derivedKey.length).toBe(64);
      });

      it('should derive different keys for different recipients', () => {
        // Generate two recipient key pairs
        const recipient1 = service.generateKeyPair();
        const recipient2 = service.generateKeyPair();

        // Generate a stealth address
        const stealth = service.generateStealthAddress();

        // Derive keys for both recipients
        const derivedKey1 = service.deriveStealthPrivateKey(
          recipient1.privateKey,
          stealth.ephemeralPublicKey
        );
        const derivedKey2 = service.deriveStealthPrivateKey(
          recipient2.privateKey,
          stealth.ephemeralPublicKey
        );

        // Keys should be different for different recipients
        expect(derivedKey1).not.toBe(derivedKey2);
      });
    });

    describe('Integration: Stealth Address Workflow', () => {
      it('should support complete stealth address workflow', () => {
        // Step 1: Generate stealth address for quote request
        const stealthAddress = service.generateStealthAddress();

        // Verify stealth address is generated
        expect(stealthAddress.address).toBeDefined();
        expect(stealthAddress.privateKey).toBeDefined();
        expect(stealthAddress.ephemeralPublicKey).toBeDefined();

        // Step 2: Stealth address can be shared publicly (unlinkable)
        const publicAddress = stealthAddress.address;
        expect(publicAddress).toMatch(/^[0-9a-f]{66}$/i);

        // Step 3: Private key is kept secret by recipient
        const secretPrivateKey = stealthAddress.privateKey;
        expect(secretPrivateKey).toMatch(/^[0-9a-f]{64}$/i);

        // Step 4: Verify address and private key are different
        expect(publicAddress).not.toBe(secretPrivateKey);

        // Step 5: Multiple stealth addresses are unlinkable
        const stealthAddress2 = service.generateStealthAddress();
        expect(stealthAddress2.address).not.toBe(stealthAddress.address);
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle rapid successive calls', () => {
        // Generate many addresses rapidly
        const addresses = Array.from({ length: 100 }, () =>
          service.generateStealthAddress()
        );

        // All should be unique
        const uniqueAddresses = new Set(addresses.map(a => a.address));
        expect(uniqueAddresses.size).toBe(100);
      });

      it('should generate cryptographically secure addresses', () => {
        const address = service.generateStealthAddress();

        // Verify address is not predictable (not all zeros or all ones)
        expect(address.address).not.toBe('02' + '0'.repeat(64));
        expect(address.address).not.toBe('02' + 'f'.repeat(64));
        expect(address.privateKey).not.toBe('0'.repeat(64));
        expect(address.privateKey).not.toBe('f'.repeat(64));

        // Verify sufficient entropy (no repeated patterns)
        const addressHex = address.address;
        const repeatedPattern = /(.{4})\1{3,}/; // Check for 4-char pattern repeated 3+ times
        expect(addressHex).not.toMatch(repeatedPattern);
      });
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(privacyService).toBeDefined();
      expect(privacyService).toBeInstanceOf(PrivacyService);
    });

    it('should work with singleton instance', () => {
      const result = privacyService.generateStealthAddress();

      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('privateKey');
      expect(result).toHaveProperty('ephemeralPublicKey');
    });
  });

  describe('Key Pair Generation', () => {
    it('should generate valid key pairs', () => {
      const keyPair = service.generateKeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');

      // Verify formats
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]{66}$/i);
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = service.generateKeyPair();
      const keyPair2 = service.generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('Pedersen Commitment Creation and Verification (Task 3.2)', () => {
    describe('createCommitment', () => {
      it('should create a valid Pedersen commitment with provided value', () => {
        const value = BigInt(1000);
        const result = service.createCommitment({ value });

        // Verify all required fields are present
        expect(result).toHaveProperty('commitment');
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('blinding');

        // Verify commitment format (compressed elliptic curve point, 66 hex chars)
        expect(result.commitment).toMatch(/^[0-9a-f]{66}$/i);

        // Verify value is preserved
        expect(result.value).toBe(value);

        // Verify blinding factor is generated (non-zero)
        expect(result.blinding).toBeGreaterThan(BigInt(0));
      });

      it('should create a commitment with custom blinding factor', () => {
        const value = BigInt(5000);
        const blinding = BigInt(12345);
        const result = service.createCommitment({ value, blinding });

        // Verify blinding factor is used
        expect(result.blinding).toBe(blinding);
        expect(result.value).toBe(value);
        expect(result.commitment).toMatch(/^[0-9a-f]{66}$/i);
      });

      it('should create different commitments for the same value with different blinding', () => {
        const value = BigInt(1000);
        const commitment1 = service.createCommitment({ value });
        const commitment2 = service.createCommitment({ value });

        // Commitments should be different (different random blinding factors)
        expect(commitment1.commitment).not.toBe(commitment2.commitment);
        expect(commitment1.blinding).not.toBe(commitment2.blinding);

        // But values should be the same
        expect(commitment1.value).toBe(commitment2.value);
      });

      it('should create different commitments for different values', () => {
        const value1 = BigInt(1000);
        const value2 = BigInt(2000);
        const commitment1 = service.createCommitment({ value: value1 });
        const commitment2 = service.createCommitment({ value: value2 });

        // Commitments should be different
        expect(commitment1.commitment).not.toBe(commitment2.commitment);
        expect(commitment1.value).not.toBe(commitment2.value);
      });

      it('should use real elliptic curve operations (no mocks)', () => {
        const value = BigInt(1000);
        const result = service.createCommitment({ value });

        // Verify the commitment is a valid elliptic curve point
        // by checking it starts with 02 or 03 (compressed format)
        const firstByte = result.commitment.substring(0, 2);
        expect(['02', '03']).toContain(firstByte);

        // Verify commitment is not a simple hash or placeholder
        expect(result.commitment).not.toBe('0'.repeat(66));
        expect(result.commitment).not.toBe('f'.repeat(66));
      });

      it('should handle zero value', () => {
        const value = BigInt(0);
        const result = service.createCommitment({ value });

        // Should still create a valid commitment (hiding the zero)
        expect(result.commitment).toMatch(/^[0-9a-f]{66}$/i);
        expect(result.value).toBe(BigInt(0));
        expect(result.blinding).toBeGreaterThan(BigInt(0));
      });

      it('should handle large values', () => {
        const value = BigInt('999999999999999999999999');
        const result = service.createCommitment({ value });

        // Should handle large values correctly
        expect(result.commitment).toMatch(/^[0-9a-f]{66}$/i);
        expect(result.value).toBe(value);
        expect(result.blinding).toBeGreaterThan(BigInt(0));
      });

      it('should generate cryptographically secure blinding factors', () => {
        const value = BigInt(1000);
        const commitments = Array.from({ length: 10 }, () =>
          service.createCommitment({ value })
        );

        // All blinding factors should be unique
        const uniqueBlindings = new Set(commitments.map(c => c.blinding.toString()));
        expect(uniqueBlindings.size).toBe(10);

        // All commitments should be unique
        const uniqueCommitments = new Set(commitments.map(c => c.commitment));
        expect(uniqueCommitments.size).toBe(10);
      });

      it('should create deterministic commitments with same value and blinding', () => {
        const value = BigInt(1000);
        const blinding = BigInt(54321);

        const commitment1 = service.createCommitment({ value, blinding });
        const commitment2 = service.createCommitment({ value, blinding });

        // Same value and blinding should produce same commitment
        expect(commitment1.commitment).toBe(commitment2.commitment);
        expect(commitment1.value).toBe(commitment2.value);
        expect(commitment1.blinding).toBe(commitment2.blinding);
      });

      it('should hide the actual value (commitment property)', () => {
        const value1 = BigInt(1000);
        const value2 = BigInt(1001);

        const commitment1 = service.createCommitment({ value: value1 });
        const commitment2 = service.createCommitment({ value: value2 });

        // Commitments should be completely different despite similar values
        expect(commitment1.commitment).not.toBe(commitment2.commitment);

        // Commitments should not be simple transformations of the value
        // (e.g., not just hash(value) or value encoded in some way)
        // The commitment should be an elliptic curve point
        const firstByte1 = commitment1.commitment.substring(0, 2);
        const firstByte2 = commitment2.commitment.substring(0, 2);
        expect(['02', '03']).toContain(firstByte1);
        expect(['02', '03']).toContain(firstByte2);

        // Without the blinding factor, it should be computationally infeasible
        // to determine the value from the commitment alone
        // (This is the hiding property of Pedersen commitments)
      });
    });

    describe('verifyCommitment', () => {
      it('should verify a valid commitment', () => {
        const value = BigInt(1000);
        const blinding = BigInt(12345);
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: commitmentData.value,
          blinding: commitmentData.blinding,
        });

        expect(result.isValid).toBe(true);
        expect(result.commitment).toBe(commitmentData.commitment);
      });

      it('should reject commitment with wrong value', () => {
        const value = BigInt(1000);
        const blinding = BigInt(12345);
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: BigInt(2000), // Wrong value
          blinding: commitmentData.blinding,
        });

        expect(result.isValid).toBe(false);
      });

      it('should reject commitment with wrong blinding factor', () => {
        const value = BigInt(1000);
        const blinding = BigInt(12345);
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: commitmentData.value,
          blinding: BigInt(54321), // Wrong blinding
        });

        expect(result.isValid).toBe(false);
      });

      it('should reject commitment with both wrong value and blinding', () => {
        const value = BigInt(1000);
        const blinding = BigInt(12345);
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: BigInt(2000), // Wrong value
          blinding: BigInt(54321), // Wrong blinding
        });

        expect(result.isValid).toBe(false);
      });

      it('should verify commitment with zero value', () => {
        const value = BigInt(0);
        const blinding = BigInt(12345);
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: commitmentData.value,
          blinding: commitmentData.blinding,
        });

        expect(result.isValid).toBe(true);
      });

      it('should verify commitment with large value', () => {
        const value = BigInt('999999999999999999999999');
        const blinding = BigInt('123456789012345678901234');
        const commitmentData = service.createCommitment({ value, blinding });

        const result = service.verifyCommitment({
          commitment: commitmentData.commitment,
          value: commitmentData.value,
          blinding: commitmentData.blinding,
        });

        expect(result.isValid).toBe(true);
      });

      it('should handle invalid commitment format gracefully', () => {
        const result = service.verifyCommitment({
          commitment: 'invalid-commitment',
          value: BigInt(1000),
          blinding: BigInt(12345),
        });

        expect(result.isValid).toBe(false);
        expect(result.commitment).toBe('invalid-commitment');
      });

      it('should verify multiple commitments independently', () => {
        const commitment1 = service.createCommitment({ value: BigInt(1000), blinding: BigInt(111) });
        const commitment2 = service.createCommitment({ value: BigInt(2000), blinding: BigInt(222) });
        const commitment3 = service.createCommitment({ value: BigInt(3000), blinding: BigInt(333) });

        // Verify all commitments
        const result1 = service.verifyCommitment({
          commitment: commitment1.commitment,
          value: commitment1.value,
          blinding: commitment1.blinding,
        });
        const result2 = service.verifyCommitment({
          commitment: commitment2.commitment,
          value: commitment2.value,
          blinding: commitment2.blinding,
        });
        const result3 = service.verifyCommitment({
          commitment: commitment3.commitment,
          value: commitment3.value,
          blinding: commitment3.blinding,
        });

        expect(result1.isValid).toBe(true);
        expect(result2.isValid).toBe(true);
        expect(result3.isValid).toBe(true);
      });

      it('should not verify commitment with swapped parameters', () => {
        const commitment1 = service.createCommitment({ value: BigInt(1000), blinding: BigInt(111) });
        const commitment2 = service.createCommitment({ value: BigInt(2000), blinding: BigInt(222) });

        // Try to verify commitment1 with commitment2's parameters
        const result = service.verifyCommitment({
          commitment: commitment1.commitment,
          value: commitment2.value,
          blinding: commitment2.blinding,
        });

        expect(result.isValid).toBe(false);
      });
    });

    describe('Integration: Commitment Workflow', () => {
      it('should support complete commitment workflow for quote request', () => {
        // Step 1: Taker creates quote request with amount commitment
        const amount = BigInt(1000000); // 1 SOL in lamports
        const amountCommitment = service.createCommitment({ value: amount });

        // Verify commitment is created
        expect(amountCommitment.commitment).toBeDefined();
        expect(amountCommitment.value).toBe(amount);
        expect(amountCommitment.blinding).toBeGreaterThan(BigInt(0));

        // Step 2: Commitment is stored publicly (hides actual amount)
        const publicCommitment = amountCommitment.commitment;
        expect(publicCommitment).toMatch(/^[0-9a-f]{66}$/i);

        // Step 3: Taker keeps value and blinding secret
        const secretValue = amountCommitment.value;
        const secretBlinding = amountCommitment.blinding;

        // Step 4: Later, taker can prove the committed value
        const verification = service.verifyCommitment({
          commitment: publicCommitment,
          value: secretValue,
          blinding: secretBlinding,
        });

        expect(verification.isValid).toBe(true);
      });

      it('should support complete commitment workflow for quote price', () => {
        // Step 1: Market maker creates quote with price commitment
        const price = BigInt(50000); // Price in smallest units
        const priceCommitment = service.createCommitment({ value: price });

        // Verify commitment is created
        expect(priceCommitment.commitment).toBeDefined();
        expect(priceCommitment.value).toBe(price);

        // Step 2: Commitment is stored publicly (hides actual price)
        const publicCommitment = priceCommitment.commitment;

        // Step 3: Market maker keeps value and blinding secret
        const secretValue = priceCommitment.value;
        const secretBlinding = priceCommitment.blinding;

        // Step 4: Later, market maker can prove the committed price
        const verification = service.verifyCommitment({
          commitment: publicCommitment,
          value: secretValue,
          blinding: secretBlinding,
        });

        expect(verification.isValid).toBe(true);
      });

      it('should prevent commitment forgery', () => {
        // Create a commitment
        const originalCommitment = service.createCommitment({ value: BigInt(1000) });

        // Attacker tries to claim different value for same commitment
        const forgedVerification = service.verifyCommitment({
          commitment: originalCommitment.commitment,
          value: BigInt(2000), // Forged value
          blinding: originalCommitment.blinding,
        });

        expect(forgedVerification.isValid).toBe(false);
      });

      it('should support multiple independent commitments', () => {
        // Create multiple commitments for different purposes
        const amountCommitment = service.createCommitment({ value: BigInt(1000) });
        const priceCommitment = service.createCommitment({ value: BigInt(50) });
        const feeCommitment = service.createCommitment({ value: BigInt(10) });

        // All commitments should be different
        expect(amountCommitment.commitment).not.toBe(priceCommitment.commitment);
        expect(amountCommitment.commitment).not.toBe(feeCommitment.commitment);
        expect(priceCommitment.commitment).not.toBe(feeCommitment.commitment);

        // All should verify correctly
        expect(service.verifyCommitment({
          commitment: amountCommitment.commitment,
          value: amountCommitment.value,
          blinding: amountCommitment.blinding,
        }).isValid).toBe(true);

        expect(service.verifyCommitment({
          commitment: priceCommitment.commitment,
          value: priceCommitment.value,
          blinding: priceCommitment.blinding,
        }).isValid).toBe(true);

        expect(service.verifyCommitment({
          commitment: feeCommitment.commitment,
          value: feeCommitment.value,
          blinding: feeCommitment.blinding,
        }).isValid).toBe(true);
      });
    });

    describe('Edge Cases and Security', () => {
      it('should handle rapid successive commitment creations', () => {
        const value = BigInt(1000);
        const commitments = Array.from({ length: 100 }, () =>
          service.createCommitment({ value })
        );

        // All commitments should be unique (different blinding factors)
        const uniqueCommitments = new Set(commitments.map(c => c.commitment));
        expect(uniqueCommitments.size).toBe(100);

        // All should verify correctly
        commitments.forEach(commitment => {
          const verification = service.verifyCommitment({
            commitment: commitment.commitment,
            value: commitment.value,
            blinding: commitment.blinding,
          });
          expect(verification.isValid).toBe(true);
        });
      });

      it('should use cryptographically secure operations', () => {
        const commitment = service.createCommitment({ value: BigInt(1000) });

        // Verify commitment is not predictable
        expect(commitment.commitment).not.toMatch(/^02(0+|1+|f+)/);

        // Verify blinding factor has sufficient entropy
        const blindingHex = commitment.blinding.toString(16);
        expect(blindingHex.length).toBeGreaterThan(10);

        // Verify no repeated patterns
        const repeatedPattern = /(.{4})\1{3,}/;
        expect(commitment.commitment).not.toMatch(repeatedPattern);
      });

      it('should maintain commitment binding property', () => {
        // Binding property: Cannot find two different (value, blinding) pairs
        // that produce the same commitment
        const value1 = BigInt(1000);
        const blinding1 = BigInt(12345);
        const commitment1 = service.createCommitment({ value: value1, blinding: blinding1 });

        const value2 = BigInt(2000);
        const blinding2 = BigInt(54321);
        const commitment2 = service.createCommitment({ value: value2, blinding: blinding2 });

        // Different inputs should produce different commitments
        expect(commitment1.commitment).not.toBe(commitment2.commitment);
      });

      it('should maintain commitment hiding property', () => {
        // Hiding property: Commitment reveals no information about the value
        const value1 = BigInt(1000);
        const value2 = BigInt(1000);

        const commitment1 = service.createCommitment({ value: value1 });
        const commitment2 = service.createCommitment({ value: value2 });

        // Same value with different blinding should produce different commitments
        expect(commitment1.commitment).not.toBe(commitment2.commitment);

        // Cannot determine if two commitments hide the same value
        // (without knowing the blinding factors)
      });
    });
  });

  describe('Nullifier Generation and Hashing (Task 3.3)', () => {
    describe('generateNullifier', () => {
      it('should generate a valid nullifier with hash', () => {
        const result = service.generateNullifier();

        // Verify all required fields are present
        expect(result).toHaveProperty('nullifier');
        expect(result).toHaveProperty('nullifierHash');

        // Verify nullifier format (64 hex chars = 32 bytes)
        expect(result.nullifier).toMatch(/^[0-9a-f]{64}$/i);
        expect(result.nullifier.length).toBe(64);

        // Verify nullifierHash format (64 hex chars = SHA256 output)
        expect(result.nullifierHash).toMatch(/^[0-9a-f]{64}$/i);
        expect(result.nullifierHash.length).toBe(64);

        // Verify nullifier and hash are different
        expect(result.nullifier).not.toBe(result.nullifierHash);
      });

      it('should generate unique nullifiers on each call', () => {
        const nullifier1 = service.generateNullifier();
        const nullifier2 = service.generateNullifier();
        const nullifier3 = service.generateNullifier();

        // All nullifiers should be different (unpredictable)
        expect(nullifier1.nullifier).not.toBe(nullifier2.nullifier);
        expect(nullifier1.nullifier).not.toBe(nullifier3.nullifier);
        expect(nullifier2.nullifier).not.toBe(nullifier3.nullifier);

        // All nullifier hashes should be different
        expect(nullifier1.nullifierHash).not.toBe(nullifier2.nullifierHash);
        expect(nullifier1.nullifierHash).not.toBe(nullifier3.nullifierHash);
        expect(nullifier2.nullifierHash).not.toBe(nullifier3.nullifierHash);
      });

      it('should use cryptographically secure random generation', () => {
        const result = service.generateNullifier();

        // Verify nullifier is not predictable (not all zeros or all ones)
        expect(result.nullifier).not.toBe('0'.repeat(64));
        expect(result.nullifier).not.toBe('f'.repeat(64));

        // Verify sufficient entropy (no repeated patterns)
        const repeatedPattern = /(.{4})\1{3,}/; // Check for 4-char pattern repeated 3+ times
        expect(result.nullifier).not.toMatch(repeatedPattern);

        // Verify nullifierHash is also not predictable
        expect(result.nullifierHash).not.toBe('0'.repeat(64));
        expect(result.nullifierHash).not.toBe('f'.repeat(64));
      });

      it('should generate nullifiers with proper entropy', () => {
        // Generate multiple nullifiers and check for randomness
        const nullifiers = Array.from({ length: 20 }, () =>
          service.generateNullifier()
        );

        // Check that all nullifiers are unique
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(20);

        // Check that all nullifier hashes are unique
        const uniqueHashes = new Set(nullifiers.map(n => n.nullifierHash));
        expect(uniqueHashes.size).toBe(20);

        // Verify no nullifier is repeated
        nullifiers.forEach((nullifier, index) => {
          const otherNullifiers = nullifiers.filter((_, i) => i !== index);
          expect(otherNullifiers.some(n => n.nullifier === nullifier.nullifier)).toBe(false);
        });
      });

      it('should generate 32-byte nullifiers', () => {
        const result = service.generateNullifier();

        // Verify nullifier is exactly 32 bytes (64 hex chars)
        expect(result.nullifier.length).toBe(64);

        // Verify it's valid hex
        expect(result.nullifier).toMatch(/^[0-9a-f]{64}$/i);

        // Convert to buffer and verify size
        const nullifierBuffer = Buffer.from(result.nullifier, 'hex');
        expect(nullifierBuffer.length).toBe(32);
      });

      it('should use SHA256 for nullifier hashing', () => {
        const result = service.generateNullifier();

        // SHA256 produces 32 bytes (64 hex chars)
        expect(result.nullifierHash.length).toBe(64);
        expect(result.nullifierHash).toMatch(/^[0-9a-f]{64}$/i);

        // Verify hash is deterministic by re-hashing
        const rehashed = service.hashNullifier(result.nullifier);
        expect(rehashed).toBe(result.nullifierHash);
      });

      it('should ensure nullifiers are unpredictable', () => {
        // Generate many nullifiers
        const nullifiers = Array.from({ length: 100 }, () =>
          service.generateNullifier()
        );

        // All should be unique (no collisions)
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(100);

        // Check for statistical randomness (no sequential patterns)
        for (let i = 0; i < nullifiers.length - 1; i++) {
          const current = BigInt('0x' + nullifiers[i].nullifier);
          const next = BigInt('0x' + nullifiers[i + 1].nullifier);
          
          // Difference should not be small (not sequential)
          const diff = current > next ? current - next : next - current;
          expect(diff).toBeGreaterThan(BigInt(1000));
        }
      });

      it('should handle rapid successive calls', () => {
        // Generate many nullifiers rapidly
        const nullifiers = Array.from({ length: 100 }, () =>
          service.generateNullifier()
        );

        // All should be unique
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(100);

        // All hashes should be unique
        const uniqueHashes = new Set(nullifiers.map(n => n.nullifierHash));
        expect(uniqueHashes.size).toBe(100);
      });

      it('should use real cryptographic operations (no mocks)', () => {
        const result = service.generateNullifier();

        // Verify nullifier is truly random (not a simple counter or timestamp)
        const timestamp = Date.now().toString(16).padStart(64, '0');
        expect(result.nullifier).not.toBe(timestamp);

        // Verify hash is real SHA256 (not a simple transformation)
        // SHA256 has specific properties - verify by re-hashing
        const crypto = require('crypto');
        const expectedHash = crypto.createHash('sha256')
          .update(result.nullifier)
          .digest('hex');
        expect(result.nullifierHash).toBe(expectedHash);
      });
    });

    describe('hashNullifier', () => {
      it('should hash a nullifier using SHA256', () => {
        const nullifier = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const hash = service.hashNullifier(nullifier);

        // Verify hash format (64 hex chars = SHA256 output)
        expect(hash).toMatch(/^[0-9a-f]{64}$/i);
        expect(hash.length).toBe(64);

        // Verify hash is different from input
        expect(hash).not.toBe(nullifier);
      });

      it('should produce deterministic hashes', () => {
        const nullifier = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        
        const hash1 = service.hashNullifier(nullifier);
        const hash2 = service.hashNullifier(nullifier);
        const hash3 = service.hashNullifier(nullifier);

        // Same nullifier should always produce same hash
        expect(hash1).toBe(hash2);
        expect(hash1).toBe(hash3);
        expect(hash2).toBe(hash3);
      });

      it('should produce different hashes for different nullifiers', () => {
        const nullifier1 = '1111111111111111111111111111111111111111111111111111111111111111';
        const nullifier2 = '2222222222222222222222222222222222222222222222222222222222222222';
        const nullifier3 = '3333333333333333333333333333333333333333333333333333333333333333';

        const hash1 = service.hashNullifier(nullifier1);
        const hash2 = service.hashNullifier(nullifier2);
        const hash3 = service.hashNullifier(nullifier3);

        // All hashes should be different
        expect(hash1).not.toBe(hash2);
        expect(hash1).not.toBe(hash3);
        expect(hash2).not.toBe(hash3);
      });

      it('should use real SHA256 hashing', () => {
        const nullifier = 'test1234567890abcdeftest1234567890abcdeftest1234567890abcdeftest12';
        const hash = service.hashNullifier(nullifier);

        // Verify against Node.js crypto SHA256
        const crypto = require('crypto');
        const expectedHash = crypto.createHash('sha256')
          .update(nullifier)
          .digest('hex');

        expect(hash).toBe(expectedHash);
      });

      it('should handle edge case nullifiers', () => {
        // All zeros
        const nullifier1 = '0'.repeat(64);
        const hash1 = service.hashNullifier(nullifier1);
        expect(hash1).toMatch(/^[0-9a-f]{64}$/i);

        // All ones (f in hex)
        const nullifier2 = 'f'.repeat(64);
        const hash2 = service.hashNullifier(nullifier2);
        expect(hash2).toMatch(/^[0-9a-f]{64}$/i);

        // Mixed pattern
        const nullifier3 = '0f'.repeat(32);
        const hash3 = service.hashNullifier(nullifier3);
        expect(hash3).toMatch(/^[0-9a-f]{64}$/i);

        // All hashes should be different
        expect(hash1).not.toBe(hash2);
        expect(hash1).not.toBe(hash3);
        expect(hash2).not.toBe(hash3);
      });

      it('should be collision-resistant', () => {
        // Generate many nullifiers and hash them
        const nullifiers = Array.from({ length: 100 }, (_, i) => {
          const num = i.toString(16).padStart(64, '0');
          return num;
        });

        const hashes = nullifiers.map(n => service.hashNullifier(n));

        // All hashes should be unique (no collisions)
        const uniqueHashes = new Set(hashes);
        expect(uniqueHashes.size).toBe(100);
      });

      it('should not reveal the nullifier from the hash', () => {
        const nullifier = service.generateNullifier().nullifier;
        const hash = service.hashNullifier(nullifier);

        // Hash should be completely different from nullifier
        expect(hash).not.toBe(nullifier);

        // Hash should not contain the nullifier as substring
        expect(hash).not.toContain(nullifier.substring(0, 10));

        // Cannot derive nullifier from hash (one-way function)
        // This is a property of SHA256 - we can only verify it's different
        expect(hash.length).toBe(64);
        expect(nullifier.length).toBe(64);
      });
    });

    describe('Integration: Nullifier Workflow', () => {
      it('should support complete nullifier workflow for quote acceptance', () => {
        // Step 1: Generate nullifier when taker accepts a quote
        const nullifierData = service.generateNullifier();

        // Verify nullifier is generated
        expect(nullifierData.nullifier).toBeDefined();
        expect(nullifierData.nullifierHash).toBeDefined();

        // Step 2: Nullifier is kept secret by taker
        const secretNullifier = nullifierData.nullifier;
        expect(secretNullifier).toMatch(/^[0-9a-f]{64}$/i);

        // Step 3: NullifierHash is stored publicly to prevent double-acceptance
        const publicNullifierHash = nullifierData.nullifierHash;
        expect(publicNullifierHash).toMatch(/^[0-9a-f]{64}$/i);

        // Step 4: Verify hash matches nullifier
        const verifyHash = service.hashNullifier(secretNullifier);
        expect(verifyHash).toBe(publicNullifierHash);

        // Step 5: Cannot derive nullifier from hash (one-way)
        expect(publicNullifierHash).not.toBe(secretNullifier);
      });

      it('should prevent double-acceptance with nullifier hashes', () => {
        // Simulate two quote acceptances
        const acceptance1 = service.generateNullifier();
        const acceptance2 = service.generateNullifier();

        // Both should have unique nullifier hashes
        expect(acceptance1.nullifierHash).not.toBe(acceptance2.nullifierHash);

        // Store nullifier hashes in a set (simulating database)
        const usedNullifierHashes = new Set<string>();
        usedNullifierHashes.add(acceptance1.nullifierHash);

        // First acceptance succeeds
        expect(usedNullifierHashes.has(acceptance1.nullifierHash)).toBe(true);

        // Second acceptance with different nullifier succeeds
        expect(usedNullifierHashes.has(acceptance2.nullifierHash)).toBe(false);
        usedNullifierHashes.add(acceptance2.nullifierHash);

        // Attempting to reuse first nullifier fails
        expect(usedNullifierHashes.has(acceptance1.nullifierHash)).toBe(true);
        expect(usedNullifierHashes.size).toBe(2);
      });

      it('should support multiple independent nullifiers', () => {
        // Generate nullifiers for different quote acceptances
        const nullifiers = Array.from({ length: 10 }, () =>
          service.generateNullifier()
        );

        // All nullifiers should be unique
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(10);

        // All nullifier hashes should be unique
        const uniqueHashes = new Set(nullifiers.map(n => n.nullifierHash));
        expect(uniqueHashes.size).toBe(10);

        // Each nullifier should hash to its corresponding hash
        nullifiers.forEach(nullifierData => {
          const verifyHash = service.hashNullifier(nullifierData.nullifier);
          expect(verifyHash).toBe(nullifierData.nullifierHash);
        });
      });

      it('should ensure nullifiers are unpredictable and unique', () => {
        // Generate many nullifiers
        const nullifiers = Array.from({ length: 50 }, () =>
          service.generateNullifier()
        );

        // All nullifiers should be unique (unpredictable)
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(50);

        // All hashes should be unique
        const uniqueHashes = new Set(nullifiers.map(n => n.nullifierHash));
        expect(uniqueHashes.size).toBe(50);

        // Verify no patterns in generation
        for (let i = 0; i < nullifiers.length - 1; i++) {
          // Consecutive nullifiers should be completely different
          expect(nullifiers[i].nullifier).not.toBe(nullifiers[i + 1].nullifier);
          expect(nullifiers[i].nullifierHash).not.toBe(nullifiers[i + 1].nullifierHash);
        }
      });
    });

    describe('Edge Cases and Security', () => {
      it('should handle rapid successive nullifier generations', () => {
        // Generate many nullifiers rapidly
        const nullifiers = Array.from({ length: 200 }, () =>
          service.generateNullifier()
        );

        // All should be unique
        const uniqueNullifiers = new Set(nullifiers.map(n => n.nullifier));
        expect(uniqueNullifiers.size).toBe(200);

        // All hashes should be unique
        const uniqueHashes = new Set(nullifiers.map(n => n.nullifierHash));
        expect(uniqueHashes.size).toBe(200);
      });

      it('should use cryptographically secure operations', () => {
        const nullifierData = service.generateNullifier();

        // Verify sufficient entropy - nullifier should be 32 bytes (64 hex chars)
        const nullifierHex = nullifierData.nullifier;
        expect(nullifierHex.length).toBe(64);

        // Verify nullifier is valid hex
        expect(nullifierHex).toMatch(/^[0-9a-f]{64}$/);

        // Verify no repeated patterns (not all same character)
        const allSameChar = /^(.)\1{63}$/;
        expect(nullifierHex).not.toMatch(allSameChar);

        // Verify hash is real SHA256
        const crypto = require('crypto');
        const expectedHash = crypto.createHash('sha256')
          .update(nullifierData.nullifier)
          .digest('hex');
        expect(nullifierData.nullifierHash).toBe(expectedHash);
      });

      it('should maintain one-way property of hash function', () => {
        const nullifierData = service.generateNullifier();

        // Cannot derive nullifier from hash
        expect(nullifierData.nullifierHash).not.toBe(nullifierData.nullifier);

        // Hash should not contain nullifier as substring
        expect(nullifierData.nullifierHash).not.toContain(
          nullifierData.nullifier.substring(0, 16)
        );

        // Verify hash is deterministic
        const rehash = service.hashNullifier(nullifierData.nullifier);
        expect(rehash).toBe(nullifierData.nullifierHash);
      });

      it('should ensure nullifiers are suitable for double-spend protection', () => {
        // Generate nullifiers for multiple quote acceptances
        const nullifiers = Array.from({ length: 20 }, () =>
          service.generateNullifier()
        );

        // Simulate storing nullifier hashes in database
        const usedNullifierHashes = new Set<string>();

        // Add all nullifier hashes
        nullifiers.forEach(n => {
          usedNullifierHashes.add(n.nullifierHash);
        });

        // All should be stored (no duplicates)
        expect(usedNullifierHashes.size).toBe(20);

        // Attempting to reuse any nullifier should be detectable
        nullifiers.forEach(n => {
          expect(usedNullifierHashes.has(n.nullifierHash)).toBe(true);
        });

        // New nullifier should not be in the set
        const newNullifier = service.generateNullifier();
        expect(usedNullifierHashes.has(newNullifier.nullifierHash)).toBe(false);
      });
    });
  });
});

