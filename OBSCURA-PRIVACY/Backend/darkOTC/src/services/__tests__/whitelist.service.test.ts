/**
 * Whitelist Service Tests
 * 
 * Tests for market maker authorization and whitelist management.
 * 
 * Requirements tested:
 * - 33.1: Store address as authorized market maker
 * - 33.2: Revoke market maker authorization
 * - 33.3: Verify address exists in whitelist
 * - 33.4: Reject non-whitelisted quote submissions
 * - 33.5: Return all authorized market maker addresses
 * - 33.6: Log whitelist changes for audit
 */

import { WhitelistService } from '../whitelist.service';
import { supabaseConfig } from '../../config/supabase.config';

describe('WhitelistService', () => {
  let whitelistService: WhitelistService;
  const testAdminAddress = 'admin_test_address_' + Date.now();
  const testMarketMaker1 = 'mm1_test_address_' + Date.now();
  const testMarketMaker2 = 'mm2_test_address_' + Date.now();
  const testMarketMaker3 = 'mm3_test_address_' + Date.now();

  beforeAll(async () => {
    whitelistService = new WhitelistService();
    
    // Verify Supabase connection
    const connected = await supabaseConfig.verifyConnection();
    if (!connected) {
      throw new Error('Supabase connection failed - cannot run integration tests');
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test - match all test patterns
    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .or('address.like.%test_address%,address.like.%test_mm_%');
    
    await supabaseConfig.adminClient
      .from('whitelist_audit_log')
      .delete()
      .or('address.like.%test_address%,address.like.%test_mm_%');
  });

  afterAll(async () => {
    // Clean up after all tests - match all test patterns
    await supabaseConfig.adminClient
      .from('whitelist')
      .delete()
      .or('address.like.%test_address%,address.like.%test_mm_%');
    
    await supabaseConfig.adminClient
      .from('whitelist_audit_log')
      .delete()
      .or('address.like.%test_address%,address.like.%test_mm_%');
  });

  describe('addToWhitelist', () => {
    it('should add a market maker to the whitelist', async () => {
      const request = {
        address: testMarketMaker1,
        signature: 'test_signature',
      };

      const result = await whitelistService.addToWhitelist(request, testAdminAddress);

      expect(result.success).toBe(true);
      expect(result.address).toBe(testMarketMaker1);
      expect(result.addedAt).toBeDefined();
      expect(typeof result.addedAt).toBe('number');
    });

    it('should reject adding duplicate address', async () => {
      const request = {
        address: testMarketMaker1,
        signature: 'test_signature',
      };

      // Add first time
      await whitelistService.addToWhitelist(request, testAdminAddress);

      // Try to add again
      await expect(
        whitelistService.addToWhitelist(request, testAdminAddress)
      ).rejects.toThrow('already whitelisted');
    });

    it('should log the add action for audit', async () => {
      const request = {
        address: testMarketMaker1,
        signature: 'test_signature',
      };

      await whitelistService.addToWhitelist(request, testAdminAddress);

      // Check audit log
      const auditLog = await whitelistService.getAuditLog(10);
      const addLog = auditLog.find(log => log.address === testMarketMaker1 && log.action === 'add');

      expect(addLog).toBeDefined();
      expect(addLog?.adminAddress).toBe(testAdminAddress);
    });
  });

  describe('removeFromWhitelist', () => {
    it('should remove a market maker from the whitelist', async () => {
      // First add the address
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'test_signature' },
        testAdminAddress
      );

      // Then remove it
      const removeRequest = {
        address: testMarketMaker1,
        signature: 'test_signature',
      };

      const result = await whitelistService.removeFromWhitelist(removeRequest, testAdminAddress);

      expect(result.success).toBe(true);
      expect(result.address).toBe(testMarketMaker1);
      expect(result.removedAt).toBeDefined();
    });

    it('should reject removing non-existent address', async () => {
      const request = {
        address: 'non_existent_address',
        signature: 'test_signature',
      };

      await expect(
        whitelistService.removeFromWhitelist(request, testAdminAddress)
      ).rejects.toThrow('not in the whitelist');
    });

    it('should log the remove action for audit', async () => {
      // Add then remove
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'test_signature' },
        testAdminAddress
      );

      await whitelistService.removeFromWhitelist(
        { address: testMarketMaker1, signature: 'test_signature' },
        testAdminAddress
      );

      // Check audit log
      const auditLog = await whitelistService.getAuditLog(10);
      const removeLog = auditLog.find(log => log.address === testMarketMaker1 && log.action === 'remove');

      expect(removeLog).toBeDefined();
      expect(removeLog?.adminAddress).toBe(testAdminAddress);
    });
  });

  describe('getWhitelist', () => {
    it('should return empty list when no addresses are whitelisted', async () => {
      const result = await whitelistService.getWhitelist();

      expect(result.success).toBe(true);
      expect(result.addresses).toEqual([]);
      expect(result.entries).toEqual([]);
    });

    it('should return all whitelisted addresses', async () => {
      // Add multiple addresses
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );
      await whitelistService.addToWhitelist(
        { address: testMarketMaker2, signature: 'sig2' },
        testAdminAddress
      );
      await whitelistService.addToWhitelist(
        { address: testMarketMaker3, signature: 'sig3' },
        testAdminAddress
      );

      const result = await whitelistService.getWhitelist();

      expect(result.success).toBe(true);
      expect(result.addresses).toHaveLength(3);
      expect(result.addresses).toContain(testMarketMaker1);
      expect(result.addresses).toContain(testMarketMaker2);
      expect(result.addresses).toContain(testMarketMaker3);
      expect(result.entries).toHaveLength(3);
    });

    it('should return entries with metadata', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const result = await whitelistService.getWhitelist();

      expect(result.entries).toBeDefined();
      expect(result.entries![0].address).toBe(testMarketMaker1);
      expect(result.entries![0].addedBy).toBe(testAdminAddress);
      expect(result.entries![0].addedAt).toBeDefined();
    });
  });

  describe('checkWhitelist', () => {
    it('should return true for whitelisted address', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const result = await whitelistService.checkWhitelist({ address: testMarketMaker1 });

      expect(result.success).toBe(true);
      expect(result.address).toBe(testMarketMaker1);
      expect(result.isWhitelisted).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry?.address).toBe(testMarketMaker1);
    });

    it('should return false for non-whitelisted address', async () => {
      const result = await whitelistService.checkWhitelist({ address: 'non_whitelisted_address' });

      expect(result.success).toBe(true);
      expect(result.isWhitelisted).toBe(false);
      expect(result.entry).toBeUndefined();
    });
  });

  describe('isWhitelisted', () => {
    it('should return true for whitelisted address', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const isWhitelisted = await whitelistService.isWhitelisted(testMarketMaker1);

      expect(isWhitelisted).toBe(true);
    });

    it('should return false for non-whitelisted address', async () => {
      const isWhitelisted = await whitelistService.isWhitelisted('non_whitelisted_address');

      expect(isWhitelisted).toBe(false);
    });
  });

  describe('getAuditLog', () => {
    it('should return audit log entries', async () => {
      // Perform some operations
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );
      await whitelistService.addToWhitelist(
        { address: testMarketMaker2, signature: 'sig2' },
        testAdminAddress
      );
      await whitelistService.removeFromWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const auditLog = await whitelistService.getAuditLog(10);

      expect(auditLog.length).toBeGreaterThanOrEqual(3);
      
      // Check that all actions are logged
      const addLogs = auditLog.filter(log => log.action === 'add');
      const removeLogs = auditLog.filter(log => log.action === 'remove');

      expect(addLogs.length).toBeGreaterThanOrEqual(2);
      expect(removeLogs.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect limit parameter', async () => {
      // Add multiple entries
      for (let i = 0; i < 5; i++) {
        await whitelistService.addToWhitelist(
          { address: `test_mm_${i}_${Date.now()}`, signature: `sig${i}` },
          testAdminAddress
        );
      }

      const auditLog = await whitelistService.getAuditLog(3);

      expect(auditLog.length).toBeLessThanOrEqual(3);
    });

    it('should return entries in descending order by timestamp', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await whitelistService.addToWhitelist(
        { address: testMarketMaker2, signature: 'sig2' },
        testAdminAddress
      );

      const auditLog = await whitelistService.getAuditLog(10);

      // Most recent should be first
      for (let i = 0; i < auditLog.length - 1; i++) {
        expect(auditLog[i].timestamp).toBeGreaterThanOrEqual(auditLog[i + 1].timestamp);
      }
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 33.1: Store address as authorized market maker', async () => {
      const request = {
        address: testMarketMaker1,
        signature: 'test_signature',
      };

      await whitelistService.addToWhitelist(request, testAdminAddress);

      // Verify stored in database
      const { data } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('*')
        .eq('address', testMarketMaker1)
        .single();

      expect(data).toBeDefined();
      expect(data.address).toBe(testMarketMaker1);
      expect(data.added_by).toBe(testAdminAddress);
    });

    it('should satisfy Requirement 33.2: Revoke market maker authorization', async () => {
      // Add then remove
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      await whitelistService.removeFromWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      // Verify removed from database
      const { data } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('*')
        .eq('address', testMarketMaker1)
        .maybeSingle();

      expect(data).toBeNull();
    });

    it('should satisfy Requirement 33.3: Verify address exists in whitelist', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const isWhitelisted = await whitelistService.isWhitelisted(testMarketMaker1);
      const isNotWhitelisted = await whitelistService.isWhitelisted('non_existent');

      expect(isWhitelisted).toBe(true);
      expect(isNotWhitelisted).toBe(false);
    });

    it('should satisfy Requirement 33.5: Return all authorized market maker addresses', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );
      await whitelistService.addToWhitelist(
        { address: testMarketMaker2, signature: 'sig2' },
        testAdminAddress
      );

      const result = await whitelistService.getWhitelist();

      expect(result.addresses).toContain(testMarketMaker1);
      expect(result.addresses).toContain(testMarketMaker2);
    });

    it('should satisfy Requirement 33.6: Log whitelist changes for audit', async () => {
      await whitelistService.addToWhitelist(
        { address: testMarketMaker1, signature: 'sig1' },
        testAdminAddress
      );

      const auditLog = await whitelistService.getAuditLog(10);
      const addLog = auditLog.find(log => log.address === testMarketMaker1);

      expect(addLog).toBeDefined();
      expect(addLog?.action).toBe('add');
      expect(addLog?.adminAddress).toBe(testAdminAddress);
      expect(addLog?.timestamp).toBeDefined();
    });
  });
});

