/**
 * Whitelist Service
 * 
 * Manages market maker authorization through whitelist operations.
 * 
 * ⚠️ CRITICAL: All implementations use REAL Supabase database operations.
 * NO mocks, stubs, or simulations allowed.
 * 
 * Requirements:
 * - 33.1: Store address as authorized market maker
 * - 33.2: Revoke market maker authorization
 * - 33.3: Verify address exists in whitelist
 * - 33.4: Reject non-whitelisted quote submissions
 * - 33.5: Return all authorized market maker addresses
 * - 33.6: Log whitelist changes for audit
 */

import { supabaseConfig } from '../config/supabase.config';
import {
  WhitelistEntry,
  AddToWhitelistRequest,
  AddToWhitelistResponse,
  RemoveFromWhitelistRequest,
  RemoveFromWhitelistResponse,
  GetWhitelistResponse,
  CheckWhitelistRequest,
  CheckWhitelistResponse,
  WhitelistAuditLog,
} from '../types/whitelist.types';
import { BlockchainAddress } from '../types/common.types';

/**
 * Whitelist Service Class
 * 
 * Provides market maker authorization management.
 * Uses Supabase database for persistent whitelist storage.
 */
export class WhitelistService {
  /**
   * Add Market Maker to Whitelist
   * 
   * Adds an address to the whitelist, authorizing it as a market maker.
   * 
   * Requirement 33.1: Store address as authorized market maker
   * Requirement 33.6: Log whitelist changes for audit
   * 
   * @param request - Add to whitelist request with address and admin signature
   * @param adminAddress - Admin address performing the operation
   * @returns AddToWhitelistResponse with success confirmation
   */
  async addToWhitelist(
    request: AddToWhitelistRequest,
    adminAddress: BlockchainAddress
  ): Promise<AddToWhitelistResponse> {
    const { address } = request;
    const addedAt = Date.now();

    try {
      // Check if address is already whitelisted
      const { data: existing } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('address')
        .eq('address', address)
        .maybeSingle();

      if (existing) {
        throw new Error(`Address ${address} is already whitelisted`);
      }

      // Insert into whitelist table
      const { error: insertError } = await supabaseConfig.adminClient
        .from('whitelist')
        .insert({
          address,
          added_at: addedAt,
          added_by: adminAddress,
        });

      if (insertError) {
        console.error('Error adding to whitelist:', insertError);
        throw new Error(`Failed to add address to whitelist: ${insertError.message}`);
      }

      // Log the action for audit
      await this.logWhitelistAction('add', address, adminAddress, addedAt);

      return {
        success: true,
        address,
        addedAt,
      };
    } catch (error) {
      console.error('Exception adding to whitelist:', error);
      throw error;
    }
  }

  /**
   * Remove Market Maker from Whitelist
   * 
   * Removes an address from the whitelist, revoking market maker authorization.
   * 
   * Requirement 33.2: Revoke market maker authorization
   * Requirement 33.6: Log whitelist changes for audit
   * 
   * @param request - Remove from whitelist request with address and admin signature
   * @param adminAddress - Admin address performing the operation
   * @returns RemoveFromWhitelistResponse with success confirmation
   */
  async removeFromWhitelist(
    request: RemoveFromWhitelistRequest,
    adminAddress: BlockchainAddress
  ): Promise<RemoveFromWhitelistResponse> {
    const { address } = request;
    const removedAt = Date.now();

    try {
      // Check if address exists in whitelist
      const { data: existing } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('address')
        .eq('address', address)
        .maybeSingle();

      if (!existing) {
        throw new Error(`Address ${address} is not in the whitelist`);
      }

      // Delete from whitelist table
      const { error: deleteError } = await supabaseConfig.adminClient
        .from('whitelist')
        .delete()
        .eq('address', address);

      if (deleteError) {
        console.error('Error removing from whitelist:', deleteError);
        throw new Error(`Failed to remove address from whitelist: ${deleteError.message}`);
      }

      // Log the action for audit
      await this.logWhitelistAction('remove', address, adminAddress, removedAt);

      return {
        success: true,
        address,
        removedAt,
      };
    } catch (error) {
      console.error('Exception removing from whitelist:', error);
      throw error;
    }
  }

  /**
   * Get Whitelist
   * 
   * Retrieves all authorized market maker addresses.
   * 
   * Requirement 33.5: Return all authorized market maker addresses
   * 
   * @returns GetWhitelistResponse with all whitelisted addresses
   */
  async getWhitelist(): Promise<GetWhitelistResponse> {
    try {
      const { data, error } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('address, added_at, added_by')
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error getting whitelist:', error);
        throw new Error(`Failed to get whitelist: ${error.message}`);
      }

      // Map to WhitelistEntry format
      const entries: WhitelistEntry[] = (data || []).map(row => ({
        address: row.address,
        addedAt: row.added_at,
        addedBy: row.added_by,
      }));

      const addresses = entries.map(entry => entry.address);

      return {
        success: true,
        addresses,
        entries,
      };
    } catch (error) {
      console.error('Exception getting whitelist:', error);
      throw error;
    }
  }

  /**
   * Check if Address is Whitelisted
   * 
   * Verifies if an address exists in the whitelist.
   * 
   * Requirement 33.3: Verify address exists in whitelist
   * 
   * @param request - Check whitelist request with address
   * @returns CheckWhitelistResponse with whitelist status
   */
  async checkWhitelist(request: CheckWhitelistRequest): Promise<CheckWhitelistResponse> {
    const { address } = request;

    try {
      const { data, error } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('address, added_at, added_by')
        .eq('address', address)
        .maybeSingle();

      if (error) {
        console.error('Error checking whitelist:', error);
        throw new Error(`Failed to check whitelist: ${error.message}`);
      }

      const isWhitelisted = data !== null;
      const entry: WhitelistEntry | undefined = data
        ? {
            address: data.address,
            addedAt: data.added_at,
            addedBy: data.added_by,
          }
        : undefined;

      return {
        success: true,
        address,
        isWhitelisted,
        entry,
      };
    } catch (error) {
      console.error('Exception checking whitelist:', error);
      throw error;
    }
  }

  /**
   * Is Address Whitelisted (Helper)
   * 
   * Quick check if an address is whitelisted.
   * 
   * In permissionless mode, always returns true (anyone can be market maker).
   * In permissioned mode, checks database whitelist.
   * 
   * Requirement 33.3: Verify address exists in whitelist
   * Requirement 33.4: Support both permissioned and permissionless modes
   * 
   * @param address - Address to check
   * @returns True if address is whitelisted (or in permissionless mode)
   */
  async isWhitelisted(address: BlockchainAddress): Promise<boolean> {
    // Import config
    const { config } = await import('../config');
    
    // In permissionless mode, everyone is whitelisted
    if (config.whitelist.mode === 'permissionless') {
      console.log('[WhitelistService] Permissionless mode: allowing all market makers');
      return true;
    }
    
    // In permissioned mode, check database
    try {
      const { data } = await supabaseConfig.adminClient
        .from('whitelist')
        .select('address')
        .eq('address', address)
        .maybeSingle();

      return data !== null;
    } catch (error) {
      console.error('Exception checking if address is whitelisted:', error);
      return false;
    }
  }

  /**
   * Log Whitelist Action
   * 
   * Logs whitelist changes for audit purposes.
   * 
   * Requirement 33.6: Log whitelist changes for audit
   * 
   * @param action - Action performed (add or remove)
   * @param address - Address that was added or removed
   * @param adminAddress - Admin who performed the action
   * @param timestamp - Timestamp of the action
   */
  private async logWhitelistAction(
    action: 'add' | 'remove',
    address: BlockchainAddress,
    adminAddress: BlockchainAddress,
    timestamp: number
  ): Promise<void> {
    try {
      const { error } = await supabaseConfig.adminClient
        .from('whitelist_audit_log')
        .insert({
          action,
          address,
          admin_address: adminAddress,
          timestamp,
        });

      if (error) {
        console.error('Error logging whitelist action:', error);
        // Don't throw - logging failure shouldn't block the operation
      }
    } catch (error) {
      console.error('Exception logging whitelist action:', error);
      // Don't throw - logging failure shouldn't block the operation
    }
  }

  /**
   * Get Whitelist Audit Log
   * 
   * Retrieves audit log of whitelist changes.
   * 
   * Requirement 33.6: Log whitelist changes for audit
   * 
   * @param limit - Maximum number of entries to return (default: 100)
   * @returns Array of whitelist audit log entries
   */
  async getAuditLog(limit: number = 100): Promise<WhitelistAuditLog[]> {
    try {
      const { data, error } = await supabaseConfig.adminClient
        .from('whitelist_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting audit log:', error);
        throw new Error(`Failed to get audit log: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        action: row.action,
        address: row.address,
        adminAddress: row.admin_address,
        timestamp: row.timestamp,
        reason: row.reason,
      }));
    } catch (error) {
      console.error('Exception getting audit log:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whitelistService = new WhitelistService();

