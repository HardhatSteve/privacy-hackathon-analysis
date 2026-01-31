import { Schema, model, type Document } from 'mongoose';

/**
 * Message Model
 *
 * Persists messages for offline delivery and message history.
 * Messages are stored per-recipient to track delivery status individually.
 *
 * Content types supported:
 * - text: { type: "text", text: "..." }
 * - image: { type: "image", url: "...", width: N, height: N }
 * - transaction: { type: "transaction", signature: "...", amount: N, token: "SOL" }
 * - paymentRequest: { type: "paymentRequest", id: "...", amount: N, ... }
 */

export interface MessageDocument extends Document {
  /** Client-generated UUID for the message */
  messageId: string;
  /** Conversation ID (dm_... or group_...) */
  conversationId: string;
  /** Handle of the message sender */
  senderId: string;
  /** Handle of the intended recipient (for per-recipient delivery tracking) */
  recipientId: string;
  /** Message content object (type-dependent structure) */
  content: {
    type: 'text' | 'image' | 'transaction' | 'paymentRequest';
    [key: string]: unknown;
  };
  /** ID of message being replied to (if any) */
  replyTo?: string;
  /** Delivery status */
  status: 'pending' | 'delivered' | 'read';
  /** When the message was created */
  createdAt: Date;
  /** When the message was delivered to recipient */
  deliveredAt?: Date;
  /** When the message was read by recipient */
  readAt?: Date;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v: { type?: string }) {
          return v && typeof v.type === 'string';
        },
        message: 'Content must have a type field',
      },
    },
    replyTo: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'read'],
      default: 'pending',
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'sapp_messages',
  }
);

// Compound index for fetching pending messages for a recipient
MessageSchema.index({ recipientId: 1, status: 1 });

// Compound index for conversation message history (ordered by time)
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Compound index for sender message history
MessageSchema.index({ senderId: 1, createdAt: -1 });

// Unique compound index to prevent duplicate messages per recipient
// (same messageId can be sent to multiple recipients in group chats)
MessageSchema.index({ messageId: 1, recipientId: 1 }, { unique: true });

/**
 * Mark message as delivered
 */
MessageSchema.methods.markDelivered = function (): void {
  this.status = 'delivered';
  this.deliveredAt = new Date();
};

/**
 * Mark message as read
 */
MessageSchema.methods.markRead = function (): void {
  this.status = 'read';
  this.readAt = new Date();
  if (!this.deliveredAt) {
    this.deliveredAt = this.readAt;
  }
};

export const Message = model<MessageDocument>('Message', MessageSchema);
