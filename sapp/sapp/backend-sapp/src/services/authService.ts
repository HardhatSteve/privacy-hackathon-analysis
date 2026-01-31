import { User, type UserDocument } from '../models/User.js';

// Import types from dedicated type files
import type { RegisterUserInput } from '../types/user.types.js';

// Import utilities
import { normalizeEmail, normalizeHandle } from '../utils/normalization.js';
import { isValidHandle } from '../utils/validation.js';

// Re-export types for consumers
export type { RegisterUserInput };

export class UserRegistrationService {

  /**
   * Register a new user after Privy authentication
   * Called when user completes Privy OTP and sets up their handle
   */
  static async registerUser(input: RegisterUserInput): Promise<UserDocument> {
    const normEmail = normalizeEmail(input.email);
    const normHandle = normalizeHandle(input.handle);

    // Check if email already registered
    const existingByEmail = await User.findOne({ email: normEmail });
    if (existingByEmail) {
      // Idempotent: If same email AND same handle, return existing user (duplicate request)
      if (existingByEmail.handle === normHandle) {
        console.log(`[sapp-backend] Idempotent registration: returning existing user @${normHandle}`);
        return existingByEmail;
      }
      // Different handle = user trying to register with different handle
      throw new Error('Email is already registered');
    }

    // Check if handle already taken by a different user
    const existingByHandle = await User.findOne({ handle: normHandle });
    if (existingByHandle) {
      throw new Error('Handle is already taken');
    }

    // Validate handle format using shared utility
    if (!isValidHandle(normHandle)) {
      throw new Error('Handle must be 3-20 characters, lowercase letters, numbers, and underscores only');
    }

    const user = new User({
      email: normEmail,
      handle: normHandle,
      privyUserId: input.privyUserId,
      lastSeen: new Date(),
    });

    await user.save();
    console.log(`[sapp-backend] Registered user: @${normHandle} (${normEmail})`);

    return user;
  }

  /**
   * Get user by email (for internal use after Privy auth)
   */
  static async getUserByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ email: normalizeEmail(email) });
  }

  /**
   * Get user by Privy user ID
   */
  static async getUserByPrivyId(privyUserId: string): Promise<UserDocument | null> {
    return User.findOne({ privyUserId });
  }

  /**
   * Check if handle is available
   */
  static async isHandleAvailable(handle: string): Promise<boolean> {
    const existing = await User.findOne({ handle: normalizeHandle(handle) });
    return existing === null;
  }

  /**
   * Update last seen timestamp
   */
  static async updateLastSeen(email: string): Promise<void> {
    await User.findOneAndUpdate(
      { email: normalizeEmail(email) },
      { lastSeen: new Date() }
    );
  }

  /**
   * Update wallet address for existing user
   */
  static async updateWalletAddress(email: string, solanaAddress: string): Promise<UserDocument | null> {
    const updatedUser = await User.findOneAndUpdate(
      { email: normalizeEmail(email) },
      { solanaAddress: solanaAddress.trim() },
      { new: true }
    );

    if (updatedUser) {
      console.log(`[sapp-backend] Updated wallet for @${updatedUser.handle}: ${solanaAddress.substring(0, 8)}...`);
    }

    return updatedUser;
  }

  /**
   * Update wallet IDs and addresses for server-created wallets
   */
  static async updateWalletIds(
    privyUserId: string,
    walletInfo: {
      solanaWalletId?: string;
      solanaAddress?: string;
      ethereumWalletId?: string;
      ethereumAddress?: string;
    }
  ): Promise<UserDocument | null> {
    const updateFields: Record<string, string> = {};

    if (walletInfo.solanaWalletId) {
      updateFields.solanaWalletId = walletInfo.solanaWalletId;
    }
    if (walletInfo.solanaAddress) {
      updateFields.solanaAddress = walletInfo.solanaAddress.trim();
    }
    if (walletInfo.ethereumWalletId) {
      updateFields.ethereumWalletId = walletInfo.ethereumWalletId;
    }
    if (walletInfo.ethereumAddress) {
      updateFields.ethereumAddress = walletInfo.ethereumAddress.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return this.getUserByPrivyId(privyUserId);
    }

    const updatedUser = await User.findOneAndUpdate(
      { privyUserId },
      { $set: updateFields },
      { new: true }
    );

    if (updatedUser) {
      console.log(`[sapp-backend] Updated wallet IDs for @${updatedUser.handle}`);
    }

    return updatedUser;
  }

  /**
   * Mark user as having migrated to server-created wallets
   */
  static async markWalletMigrated(privyUserId: string): Promise<UserDocument | null> {
    const updatedUser = await User.findOneAndUpdate(
      { privyUserId },
      {
        $set: {
          walletMigrated: true,
          walletMigratedAt: new Date(),
        },
      },
      { new: true }
    );

    if (updatedUser) {
      console.log(`[sapp-backend] Marked wallet migrated for @${updatedUser.handle}`);
    }

    return updatedUser;
  }

  /**
   * Get users who need wallet migration (have solanaAddress but no solanaWalletId)
   */
  static async getUsersNeedingMigration(limit: number = 100): Promise<UserDocument[]> {
    return User.find({
      solanaAddress: { $exists: true, $ne: null },
      walletMigrated: { $ne: true },
    })
      .limit(limit)
      .sort({ createdAt: 1 });
  }

  /**
   * Check if user has migrated to server wallets
   */
  static async hasServerWallets(privyUserId: string): Promise<boolean> {
    const user = await User.findOne({ privyUserId });
    return user?.walletMigrated === true && !!user?.solanaWalletId;
  }
}
