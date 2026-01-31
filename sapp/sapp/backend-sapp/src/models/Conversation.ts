import { Schema, model, type Document } from 'mongoose';

/**
 * Conversation Model
 *
 * Tracks conversation metadata and participant membership for access control.
 * Used by WebSocket service to validate room membership.
 *
 * Note: Conversation IDs are deterministic based on participants:
 * - DM: "dm_alice_bob" (sorted alphabetically)
 * - Group: "group_alice_bob_charlie" (sorted alphabetically)
 */

export interface ConversationDocument extends Document {
  /** Deterministic ID: "dm_alice_bob" or "group_alice_bob_charlie" */
  conversationId: string;
  /** Array of participant handles (all members, lowercase) */
  participants: string[];
  /** True if more than 2 participants */
  isGroup: boolean;
  /** Optional name for group conversations */
  groupName?: string;
  /** Handle of the user who created the conversation */
  createdBy: string;
  /** Timestamp when conversation was created */
  createdAt: Date;
  /** Timestamp when conversation was last updated */
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationDocument>(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    participants: {
      type: [String],
      required: true,
      index: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length >= 2;
        },
        message: 'Conversation must have at least 2 participants',
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: [100, 'Group name must be at most 100 characters'],
    },
    createdBy: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'sapp_conversations',
  }
);

// Compound index for efficient participant lookups
ConversationSchema.index({ participants: 1 });

// Index for finding conversations by creator
ConversationSchema.index({ createdBy: 1 });

/**
 * Check if a user is a participant in this conversation
 */
ConversationSchema.methods.hasParticipant = function (handle: string): boolean {
  return this.participants.includes(handle.toLowerCase());
};

/**
 * Add a participant to the conversation (for group management)
 */
ConversationSchema.methods.addParticipant = function (handle: string): void {
  const normalizedHandle = handle.toLowerCase();
  if (!this.participants.includes(normalizedHandle)) {
    this.participants.push(normalizedHandle);
    // Update isGroup status if needed
    if (this.participants.length > 2) {
      this.isGroup = true;
    }
  }
};

/**
 * Remove a participant from the conversation (for group management)
 */
ConversationSchema.methods.removeParticipant = function (handle: string): void {
  const normalizedHandle = handle.toLowerCase();
  this.participants = this.participants.filter((p: string) => p !== normalizedHandle);
};

export const Conversation = model<ConversationDocument>('Conversation', ConversationSchema);
