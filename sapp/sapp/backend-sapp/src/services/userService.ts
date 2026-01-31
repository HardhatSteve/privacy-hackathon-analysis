import { User, type UserDocument } from '../models/User.js';

// Import types from dedicated type files
import type { PublicUserInfo, UserWithWallet } from '../types/user.types.js';

// Import utilities
import { normalizeHandle, normalizeEmail, normalizeQuery } from '../utils/normalization.js';

// Re-export types for consumers
export type { PublicUserInfo, UserWithWallet };

export class UserService {
  /**
   * Look up a user by handle
   * This is the main lookup for messaging - find user to message by their handle
   * Returns user info including wallet address for payment functionality
   */
  static async findByHandle(handle: string): Promise<UserWithWallet | null> {
    const user = await User.findOne({ handle: normalizeHandle(handle) });

    if (!user) {
      return null;
    }

    return this.toUserWithWallet(user);
  }

  /**
   * Check if a handle exists (for messaging validation)
   */
  static async handleExists(handle: string): Promise<boolean> {
    const user = await User.findOne({ handle: normalizeHandle(handle) });
    return user !== null;
  }

  /**
   * Search users by partial handle
   * For autocomplete in the "To:" field
   */
  static async search(query: string, limit: number = 10): Promise<PublicUserInfo[]> {
    const normQuery = normalizeQuery(query);

    if (normQuery.length < 2) {
      return [];
    }

    const users = await User.find({
      handle: { $regex: normQuery, $options: 'i' },
    })
      .limit(limit)
      .select('handle');

    return users.map(this.toPublicInfo);
  }

  /**
   * Get multiple users by their handles
   */
  static async findByHandles(handles: string[]): Promise<PublicUserInfo[]> {
    const normalizedHandles = handles.map(normalizeHandle);
    const users = await User.find({
      handle: { $in: normalizedHandles },
    }).select('handle');

    return users.map(this.toPublicInfo);
  }

  /**
   * Get the email for a handle (internal use for P2P connection)
   * This maps handle -> email for the messaging system
   */
  static async getEmailForHandle(handle: string): Promise<string | null> {
    const user = await User.findOne({ handle: normalizeHandle(handle) });
    return user?.email ?? null;
  }

  /**
   * Get the handle for an email (internal use)
   */
  static async getHandleForEmail(email: string): Promise<string | null> {
    const user = await User.findOne({ email: normalizeEmail(email) });
    return user?.handle ?? null;
  }

  private static toPublicInfo(user: UserDocument): PublicUserInfo {
    return {
      handle: user.handle,
    };
  }

  private static toUserWithWallet(user: UserDocument): UserWithWallet {
    return {
      handle: user.handle,
      solanaAddress: user.solanaAddress,
    };
  }
}
