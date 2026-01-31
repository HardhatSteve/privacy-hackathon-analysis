import { Schema, model, type Document } from 'mongoose';

export interface UserDocument extends Document {
  email: string;           // From Privy auth (internal, not exposed to other users)
  handle: string;          // Public identifier for messaging (e.g., @johndoe)
  solanaAddress?: string;  // User's Solana wallet address
  solanaWalletId?: string; // Privy wallet ID for Solana wallet (server-created)
  ethereumAddress?: string;// User's Ethereum wallet address
  ethereumWalletId?: string; // Privy wallet ID for Ethereum wallet (server-created)
  privyUserId?: string;    // Privy user ID for verification
  walletMigrated?: boolean; // True if user has migrated to server-created wallets
  walletMigratedAt?: Date;  // Timestamp when wallet migration occurred
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [3, 'Handle must be at least 3 characters'],
      maxlength: [20, 'Handle must be at most 20 characters'],
      match: [/^[a-z0-9_]+$/, 'Handle can only contain lowercase letters, numbers, and underscores'],
    },
    solanaAddress: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    solanaWalletId: {
      type: String,
      trim: true,
      sparse: true,
    },
    ethereumAddress: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    ethereumWalletId: {
      type: String,
      trim: true,
      sparse: true,
    },
    privyUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    walletMigrated: {
      type: Boolean,
      default: false,
    },
    walletMigratedAt: {
      type: Date,
    },
    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'sapp_users',
  }
);

export const User = model<UserDocument>('User', UserSchema);
