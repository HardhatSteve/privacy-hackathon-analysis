import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrivyClient } from '@privy-io/server-auth';
import { shadowWireService, type TransferRequest } from './shadowWireService.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

// Privy Server Auth Client (Singleton) for WebSocket authentication
let privyServerAuth: PrivyClient | null = null;

function getPrivyServerAuth(): PrivyClient {
  if (!privyServerAuth) {
    console.log(`[WS] Initializing PrivyClient for WebSocket auth`);
    privyServerAuth = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }
  return privyServerAuth;
}

// Types for WebSocket events
interface UserStatus {
  handle: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface TypingEvent {
  conversationId: string;
  fromHandle: string;
  isTyping: boolean;
}

interface MessageEvent {
  id: string;
  conversationId: string;
  fromHandle: string;
  toHandle: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'payment';
}

interface TransferNotificationEvent {
  conversationId?: string;
  senderHandle: string;
  recipientHandle: string;
  amount: number | null;  // null for internal transfers (private)
  token: string;
  signature: string;
  type: 'internal' | 'external';
  timestamp: Date;
}

// Store connected users: handle -> socketId (all handles normalized to lowercase)
const connectedUsers = new Map<string, string>();
const socketToUser = new Map<string, string>();

/**
 * Normalize handle to lowercase for consistent lookups.
 * All handles in the database are stored lowercase, and iOS sends lowercase.
 * This ensures authentication (which may use original case) matches correctly.
 */
function normalizeHandle(handle: string): string {
  return handle.toLowerCase().trim();
}

export function createWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  console.log('[WS] Creating WebSocket server with Socket.IO...');

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Configure for production
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    // Allow both polling and websocket transports
    transports: ['polling', 'websocket'],
    // Allow websocket connections without prior polling handshake
    allowUpgrades: true,
    // Improve compatibility with native WebSocket clients
    perMessageDeflate: false,
  });

  // Log when Engine.IO has a new connection
  io.engine.on('connection', (rawSocket) => {
    console.log(`[WS] Engine.IO raw connection from: ${rawSocket.remoteAddress}`);
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] ========================================`);
    console.log(`[WS] Client connected: ${socket.id}`);
    console.log(`[WS] Transport: ${socket.conn.transport.name}`);
    console.log(`[WS] Remote address: ${socket.handshake.address}`);
    console.log(`[WS] Query params: ${JSON.stringify(socket.handshake.query)}`);
    console.log(`[WS] ========================================`);

    // Authenticate user (with token verification in production)
    socket.on('authenticate', async (data: { handle: string; token: string }) => {
      const { handle, token } = data;

      if (!handle) {
        socket.emit('error', { message: 'Handle required for authentication' });
        return;
      }

      // Verify token in production mode
      if (env.NODE_ENV === 'production') {
        if (!token) {
          console.log(`[WS] Rejected auth for @${handle}: missing token in production`);
          socket.emit('error', { message: 'Authentication token required' });
          return;
        }

        try {
          const privy = getPrivyServerAuth();
          const verifiedClaims = await privy.verifyAuthToken(
            token,
            env.PRIVY_VERIFICATION_KEY
          );

          // Verify the token belongs to this handle by checking the database
          const user = await User.findOne({ privyUserId: verifiedClaims.userId });
          if (!user) {
            console.log(`[WS] Rejected auth: no user found for Privy ID ${verifiedClaims.userId}`);
            socket.emit('error', { message: 'User not found' });
            return;
          }

          if (user.handle.toLowerCase() !== handle.toLowerCase()) {
            console.log(`[WS] Rejected auth: handle mismatch. Token for @${user.handle}, claimed @${handle}`);
            socket.emit('error', { message: 'Token does not match handle' });
            return;
          }

          console.log(`[WS] Token verified for @${handle} (Privy ID: ${verifiedClaims.userId})`);
        } catch (error) {
          console.warn(`[WS] Token verification failed for @${handle}:`, error);
          socket.emit('error', { message: 'Invalid or expired token' });
          return;
        }
      } else {
        // Development mode - allow without token but log warning
        if (!token) {
          console.log(`[WS] DEV MODE: No token provided for @${handle}, proceeding anyway`);
        } else {
          console.log(`[WS] DEV MODE: Token provided for @${handle}, skipping verification`);
        }
      }

      // Normalize handle for consistent lookups
      const normalizedHandle = normalizeHandle(handle);

      // Check if user already has an active connection (duplicate/stale connection)
      const existingSocketId = connectedUsers.get(normalizedHandle);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`[WS] ⚠️  Duplicate connection detected for @${normalizedHandle}`);
        console.log(`[WS]    Old socket: ${existingSocketId}`);
        console.log(`[WS]    New socket: ${socket.id}`);
        console.log(`[WS]    Disconnecting old socket...`);

        // Clean up mappings FIRST before disconnecting to prevent race condition
        connectedUsers.delete(normalizedHandle);
        socketToUser.delete(existingSocketId);

        // Now disconnect the old socket (use false to avoid forcefully closing transport)
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(false);
          console.log(`[WS]    Old socket disconnected (cleanly)`);
        } else {
          console.log(`[WS]    Old socket ${existingSocketId} not found (already gone)`);
        }
      }

      // Store NEW user connection (always use normalized handle)
      connectedUsers.set(normalizedHandle, socket.id);
      socketToUser.set(socket.id, normalizedHandle);

      // Join user's own room for direct messages
      socket.join(`user:${normalizedHandle}`);

      console.log(`[WS] User @${normalizedHandle} now connected on socket ${socket.id}`);
      console.log(`[WS] User authenticated: ${normalizedHandle}`);

      // Deliver any pending messages from MongoDB
      try {
        const pendingMsgs = await Message.find({
          recipientId: normalizedHandle,
          status: 'pending'
        }).sort({ createdAt: 1 });

        if (pendingMsgs.length > 0) {
          console.log(`[WS] Delivering ${pendingMsgs.length} queued messages to @${normalizedHandle}`);

          // First, emit all messages to the client (fast, non-blocking)
          for (const msg of pendingMsgs) {
            io.to(socket.id).emit('message:received', {
              id: msg.messageId,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              content: msg.content,
              timestamp: msg.createdAt.toISOString(),
              replyTo: msg.replyTo,
            });
          }

          // Then, bulk update all as delivered in ONE database operation
          const messageIds = pendingMsgs.map(msg => msg._id);
          await Message.updateMany(
            { _id: { $in: messageIds } },
            {
              $set: {
                status: 'delivered',
                deliveredAt: new Date()
              }
            }
          );

          console.log(`[WS] All queued messages delivered to @${normalizedHandle}`);
        }
      } catch (err) {
        console.error(`[WS] Error delivering pending messages to @${normalizedHandle}:`, err);
      }

      // Send authentication confirmation to this client
      socket.emit('authenticated', { handle: normalizedHandle, status: 'online' });

      // NOW broadcast online status to all other clients (AFTER everything is set up)
      broadcastUserStatus(io, normalizedHandle, true);
      console.log(`[WS] Broadcasted online status for @${normalizedHandle} to all clients`);
    });

    // Handle typing indicators
    socket.on('typing', (data: TypingEvent) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) return;

      // Send typing indicator to conversation participants
      socket.to(`conversation:${data.conversationId}`).emit('typing', {
        conversationId: data.conversationId,
        fromHandle,
        isTyping: data.isTyping,
      });
    });

    // Handle message sending (for signaling, not actual P2P messages)
    socket.on('message:signal', (data: MessageEvent) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) return;

      const recipientSocketId = connectedUsers.get(normalizeHandle(data.toHandle));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:signal', {
          ...data,
          fromHandle,
          timestamp: new Date(),
        });
      }
    });

    // Handle direct message sending via WebSocket relay
    // This is used when P2P connection is not available
    socket.on('message:send', async (data: {
      id: string;
      conversationId: string;
      toHandle: string;
      content: any;  // MessageContent object
      replyTo?: string;
    }) => {
      console.log(`[WS] Received message:send event:`, JSON.stringify(data, null, 2));

      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) {
        console.log(`[WS] Sender not authenticated, socket: ${socket.id}`);
        socket.emit('message:error', { id: data.id, error: 'Not authenticated' });
        return;
      }

      const normalizedFromHandle = fromHandle; // Already normalized when stored
      const normalizedToHandle = normalizeHandle(data.toHandle);

      console.log(`[WS] Message from @${normalizedFromHandle} to @${normalizedToHandle}`);
      console.log(`[WS] Connected users: ${Array.from(connectedUsers.keys()).join(', ')}`);

      const recipientSocketId = connectedUsers.get(normalizedToHandle);

      // Create message payload
      const messagePayload = {
        id: data.id,
        conversationId: data.conversationId,
        senderId: normalizedFromHandle,
        content: data.content,
        timestamp: new Date().toISOString(),
        replyTo: data.replyTo,
      };

      // Always persist to MongoDB for durability
      try {
        await Message.create({
          messageId: data.id,
          conversationId: data.conversationId,
          senderId: normalizedFromHandle,
          recipientId: normalizedToHandle,
          content: data.content,
          replyTo: data.replyTo,
          status: recipientSocketId ? 'delivered' : 'pending',
          deliveredAt: recipientSocketId ? new Date() : undefined,
        });
        console.log(`[WS] Message ${data.id} persisted to MongoDB`);
      } catch (err: any) {
        // Handle duplicate message (same messageId + recipientId)
        if (err.code === 11000) {
          console.log(`[WS] Duplicate message ${data.id} for @${normalizedToHandle} - skipping`);
        } else {
          console.error(`[WS] Failed to persist message:`, err);
        }
      }

      if (recipientSocketId) {
        // Recipient is online - deliver immediately
        console.log(`[WS] Relaying to socket ${recipientSocketId}:`, JSON.stringify(messagePayload, null, 2));

        io.to(recipientSocketId).emit('message:received', messagePayload);

        // Acknowledge to sender that message was delivered
        socket.emit('message:delivered', {
          id: data.id,
          deliveredAt: new Date().toISOString(),
        });

        console.log(`[WS] Message delivered from @${normalizedFromHandle} to @${normalizedToHandle}`);
      } else {
        // Recipient is offline - message already persisted with status: 'pending'
        socket.emit('message:queued', {
          id: data.id,
          reason: 'Recipient offline',
          queuedAt: new Date().toISOString(),
        });

        console.log(`[WS] Recipient @${normalizedToHandle} offline - message queued in MongoDB`);
      }
    });

    // Handle read receipts with database persistence
    socket.on('message:read', async (data: { messageId?: string; conversationId: string }) => {
      const handle = socketToUser.get(socket.id);
      if (!handle) return;

      const normalizedHandle = handle; // Already normalized

      try {
        // Update all delivered messages in this conversation as read
        const result = await Message.updateMany(
          {
            conversationId: data.conversationId,
            recipientId: normalizedHandle,
            status: 'delivered'
          },
          {
            status: 'read',
            readAt: new Date()
          }
        );

        console.log(`[WS] Marked ${result.modifiedCount} messages as read in ${data.conversationId}`);

        // Broadcast read receipt to conversation participants
        socket.to(`conversation:${data.conversationId}`).emit('message:read', {
          conversationId: data.conversationId,
          messageId: data.messageId,
          readBy: normalizedHandle,
          readAt: new Date(),
        });
      } catch (err) {
        console.error(`[WS] Error updating read status:`, err);
      }
    });

    // Handle group creation - registers a new group conversation in MongoDB
    // This is called by iOS after creating the group locally (and in Hypercore if available)
    // The backend stores the group so:
    // 1. Offline message delivery works via MongoDB
    // 2. Membership validation works for WebSocket rooms
    // 3. Users can be notified when they come online
    socket.on('group:create', async (data: {
      conversationId: string;
      participants: string[];
      groupName?: string;
    }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) {
        console.log(`[WS] group:create - sender not authenticated`);
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { conversationId, participants, groupName } = data;
      const normalizedParticipants = participants.map(normalizeHandle);

      console.log(`[WS] @${fromHandle} creating group: ${conversationId}`);
      console.log(`[WS] Participants: ${normalizedParticipants.join(', ')}`);
      console.log(`[WS] Group name: ${groupName || '(none)'}`);

      try {
        // Check if conversation already exists
        let conversation = await Conversation.findOne({ conversationId });

        if (conversation) {
          console.log(`[WS] Conversation ${conversationId} already exists - updating`);
          // Update if it exists (in case of race condition or re-creation)
          if (groupName) {
            conversation.groupName = groupName;
          }
          // Merge participants (in case some were missing)
          for (const p of normalizedParticipants) {
            if (!conversation.participants.includes(p)) {
              conversation.participants.push(p);
            }
          }
          await conversation.save();
        } else {
          // Create new conversation in MongoDB
          conversation = await Conversation.create({
            conversationId,
            participants: normalizedParticipants,
            isGroup: normalizedParticipants.length > 2,
            groupName: groupName || undefined,
            createdBy: fromHandle,
          });
          console.log(`[WS] Created new conversation in MongoDB: ${conversationId}`);
        }

        // Notify all OTHER participants about the new group (skip creator)
        for (const participant of normalizedParticipants) {
          if (participant === fromHandle) continue;

          const participantSocketId = connectedUsers.get(participant);
          if (participantSocketId) {
            io.to(participantSocketId).emit('group:created', {
              conversationId,
              participants: normalizedParticipants,
              groupName: groupName || null,
              createdBy: fromHandle,
              timestamp: new Date().toISOString(),
            });
            console.log(`[WS] Notified @${participant} about new group`);
          } else {
            console.log(`[WS] @${participant} is offline - will sync via P2P or pending messages`);
          }
        }

        // Acknowledge success to the creator
        socket.emit('group:create:success', {
          conversationId,
          participants: normalizedParticipants,
          groupName: groupName || null,
          timestamp: new Date().toISOString(),
        });

        console.log(`[WS] Group ${conversationId} registered successfully by @${fromHandle}`);

      } catch (error) {
        console.error(`[WS] Error creating group:`, error);
        socket.emit('error', { message: 'Failed to create group' });
      }
    });

    // Handle group name updates
    socket.on('group:nameUpdate', (data: {
      conversationId: string;
      groupName: string;
      toHandle: string;
    }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) {
        console.log(`[WS] group:nameUpdate - sender not authenticated`);
        return;
      }

      const normalizedToHandle = normalizeHandle(data.toHandle);
      console.log(`[WS] Group name update from @${fromHandle} for ${data.conversationId}: "${data.groupName}"`);

      const recipientSocketId = connectedUsers.get(normalizedToHandle);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('group:nameUpdate', {
          conversationId: data.conversationId,
          groupName: data.groupName,
          updatedBy: fromHandle,
          timestamp: new Date().toISOString(),
        });
        console.log(`[WS] Group name update relayed to @${normalizedToHandle}`);
      } else {
        console.log(`[WS] Recipient @${normalizedToHandle} offline - group name update not delivered`);
        // Note: Group name updates are not queued for offline delivery
        // The recipient will sync group name when they reconnect
      }
    });

    // Handle P2P connection signaling (for establishing direct connections)
    socket.on('p2p:signal', (data: { toHandle: string; signalData: any }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) return;

      const normalizedToHandle = normalizeHandle(data.toHandle);
      const recipientSocketId = connectedUsers.get(normalizedToHandle);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('p2p:signal', {
          fromHandle,
          signalData: data.signalData,
          timestamp: new Date(),
        });
        console.log(`[WS] P2P signal from ${fromHandle} to ${normalizedToHandle}`);
      }
    });

    // Handle P2P connection request (notify recipient that someone wants to connect)
    socket.on('p2p:request', (data: { toHandle: string; conversationId?: string }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) return;

      const normalizedToHandle = normalizeHandle(data.toHandle);
      const recipientSocketId = connectedUsers.get(normalizedToHandle);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('p2p:request', {
          fromHandle,
          conversationId: data.conversationId,
          timestamp: new Date(),
        });
        console.log(`[WS] P2P connection request from ${fromHandle} to ${normalizedToHandle}`);
      }
    });

    // Handle P2P connection accept (notify requester that connection was accepted)
    socket.on('p2p:accept', (data: { toHandle: string; conversationId?: string }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) return;

      const normalizedToHandle = normalizeHandle(data.toHandle);
      const recipientSocketId = connectedUsers.get(normalizedToHandle);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('p2p:accept', {
          fromHandle,
          conversationId: data.conversationId,
          timestamp: new Date(),
        });
        console.log(`[WS] P2P connection accepted by ${fromHandle} for ${normalizedToHandle}`);
      }
    });

    // Handle crypto transfer notification (sender notifies recipient of completed transfer)
    socket.on('transfer:notify', (data: {
      conversationId?: string;
      recipientHandle: string;
      signature: string;
      amount: number | null;  // null for internal (private) transfers
      token: string;
      type: 'internal' | 'external';
    }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) {
        console.log(`[WS] Transfer notification from unauthenticated socket: ${socket.id}`);
        return;
      }

      const normalizedRecipientHandle = normalizeHandle(data.recipientHandle);
      console.log(`[WS] Transfer notification: @${fromHandle} → @${normalizedRecipientHandle} | ${data.amount || 'PRIVATE'} ${data.token} (${data.type})`);

      const recipientSocketId = connectedUsers.get(normalizedRecipientHandle);
      if (recipientSocketId) {
        const notification: TransferNotificationEvent = {
          conversationId: data.conversationId,
          senderHandle: fromHandle,
          recipientHandle: normalizedRecipientHandle,
          amount: data.amount,
          token: data.token,
          signature: data.signature,
          type: data.type,
          timestamp: new Date(),
        };

        io.to(recipientSocketId).emit('transfer:received', notification);
        console.log(`[WS] Transfer notification delivered to @${normalizedRecipientHandle}`);

        // Acknowledge to sender
        socket.emit('transfer:notification:sent', {
          recipientHandle: normalizedRecipientHandle,
          timestamp: new Date(),
        });
      } else {
        console.log(`[WS] Recipient @${normalizedRecipientHandle} is offline - transfer notification skipped`);
        // Note: The transaction is still completed on-chain, this is just a notification
      }
    });

    // Handle balance query request
    socket.on('balance:request', async (data: { token: string }) => {
      const handle = socketToUser.get(socket.id);
      if (!handle) {
        socket.emit('balance:response', { error: 'Not authenticated' });
        return;
      }

      try {
        // Get user's wallet address from database
        // In production, you'd fetch this from your User model
        // For now, we'll return an error asking them to use the REST API
        socket.emit('balance:response', {
          error: 'Use REST API endpoint /api/sapp/crypto/balance/:walletAddress for balance queries'
        });
      } catch (error) {
        console.error(`[WS] Balance query failed for @${handle}:`, error);
        socket.emit('balance:response', {
          error: error instanceof Error ? error.message : 'Balance query failed'
        });
      }
    });

    // Join conversation room (with membership validation)
    socket.on('conversation:join', (conversationId: string) => {
      const handle = socketToUser.get(socket.id);
      if (!handle) {
        socket.emit('error', { message: 'Not authenticated' });
        console.log(`[WS] Rejected conversation:join - socket ${socket.id} not authenticated`);
        return;
      }

      // Validate membership by parsing the deterministic conversation ID
      // Format: "dm_alice_bob" or "group_alice_bob_charlie" (handles sorted alphabetically)
      const normalizedHandle = handle.toLowerCase();
      let isParticipant = false;

      if (conversationId.startsWith('dm_')) {
        // DM format: dm_handle1_handle2
        const participantsFromId = conversationId.replace('dm_', '').split('_');
        isParticipant = participantsFromId.includes(normalizedHandle);
      } else if (conversationId.startsWith('group_')) {
        // Group format: group_handle1_handle2_handle3...
        const participantsFromId = conversationId.replace('group_', '').split('_');
        isParticipant = participantsFromId.includes(normalizedHandle);
      } else {
        // Unknown format - reject for security
        console.log(`[WS] Rejected conversation:join - unknown format: ${conversationId}`);
        socket.emit('error', { message: 'Invalid conversation ID format' });
        return;
      }

      if (!isParticipant) {
        console.log(`[WS] Rejected conversation:join - @${handle} is not a participant in ${conversationId}`);
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`[WS] @${handle} joined conversation: ${conversationId}`);
    });

    // Leave conversation room (just leaves the WebSocket room, doesn't update DB)
    socket.on('conversation:leave', (conversationId: string) => {
      const handle = socketToUser.get(socket.id);
      socket.leave(`conversation:${conversationId}`);
      console.log(`[WS] ${handle || socket.id} left conversation room: ${conversationId}`);
    });

    // Permanently leave a group chat (updates database and notifies participants)
    socket.on('group:leave', async (data: { conversationId: string }) => {
      const handle = socketToUser.get(socket.id);
      if (!handle) {
        console.log(`[WS] group:leave - sender not authenticated`);
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { conversationId } = data;
      console.log(`[WS] @${handle} permanently leaving group: ${conversationId}`);

      try {
        // 1. Find the conversation in the database
        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
          console.log(`[WS] Conversation not found in DB: ${conversationId}`);
          // Still leave the WebSocket room even if not in DB
          socket.leave(`conversation:${conversationId}`);
          return;
        }

        // 2. Remove the participant from the list
        const normalizedHandle = handle.toLowerCase();
        const updatedParticipants = conversation.participants.filter(
          (p: string) => p.toLowerCase() !== normalizedHandle
        );

        // 3. Check remaining participant count
        if (updatedParticipants.length < 2) {
          // Delete conversation if less than 2 participants remain
          await Conversation.deleteOne({ conversationId });
          console.log(`[WS] Conversation ${conversationId} deleted - less than 2 participants remaining`);

          // Notify the last remaining participant that the conversation was deleted
          if (updatedParticipants.length === 1) {
            const lastParticipant = updatedParticipants[0];
            const lastParticipantSocket = connectedUsers.get(normalizeHandle(lastParticipant));
            if (lastParticipantSocket) {
              io.to(lastParticipantSocket).emit('conversation:deleted', {
                conversationId,
                reason: 'All other participants have left',
                timestamp: new Date().toISOString(),
              });
              console.log(`[WS] Notified @${lastParticipant} that conversation was deleted`);
            }
          }
        } else {
          // Update the conversation with the new participant list
          conversation.participants = updatedParticipants;
          await conversation.save();
          console.log(`[WS] Removed @${handle} from ${conversationId}. Remaining: ${updatedParticipants.length} participants`);

          // Notify remaining participants about the leave
          for (const participant of updatedParticipants) {
            const participantSocket = connectedUsers.get(normalizeHandle(participant));
            if (participantSocket) {
              io.to(participantSocket).emit('group:participantLeft', {
                conversationId,
                handle: handle,
                remainingParticipants: updatedParticipants,
                timestamp: new Date().toISOString(),
              });
            }
          }
          console.log(`[WS] Notified ${updatedParticipants.length} remaining participants about @${handle} leaving`);
        }

        // 4. Leave the WebSocket room
        socket.leave(`conversation:${conversationId}`);

        // 5. Acknowledge success to the leaving user
        socket.emit('group:left', {
          conversationId,
          success: true,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error(`[WS] Error processing group:leave for ${conversationId}:`, error);
        socket.emit('error', { message: 'Failed to leave group' });
      }
    });

    // Handle adding a new member to a group
    socket.on('group:memberAdd', async (data: {
      conversationId: string;
      handle: string;
      timestamp?: string;
    }) => {
      const fromHandle = socketToUser.get(socket.id);
      if (!fromHandle) {
        console.log(`[WS] group:memberAdd - sender not authenticated`);
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { conversationId, handle } = data;
      const normalizedNewMember = normalizeHandle(handle);

      console.log(`[WS] @${fromHandle} adding @${normalizedNewMember} to ${conversationId}`);

      try {
        // 1. Find the conversation in the database
        const conversation = await Conversation.findOne({ conversationId });
        if (!conversation) {
          console.log(`[WS] Conversation not found: ${conversationId}`);
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // 2. Check if the requesting user is a participant
        const normalizedFromHandle = fromHandle.toLowerCase();
        const isParticipant = conversation.participants.some(
          (p: string) => p.toLowerCase() === normalizedFromHandle
        );

        if (!isParticipant) {
          console.log(`[WS] @${fromHandle} is not a participant in ${conversationId}`);
          socket.emit('error', { message: 'Not a participant in this conversation' });
          return;
        }

        // 3. Check if the new member is already in the conversation
        const alreadyInGroup = conversation.participants.some(
          (p: string) => p.toLowerCase() === normalizedNewMember
        );

        if (alreadyInGroup) {
          console.log(`[WS] @${normalizedNewMember} is already in ${conversationId}`);
          socket.emit('error', { message: 'User is already in this group' });
          return;
        }

        // 4. Add the new participant
        conversation.participants.push(normalizedNewMember);
        await conversation.save();

        console.log(`[WS] Added @${normalizedNewMember} to ${conversationId}`);

        // 5. Notify the added user with group:added
        const newMemberSocketId = connectedUsers.get(normalizedNewMember);
        if (newMemberSocketId) {
          io.to(newMemberSocketId).emit('group:added', {
            conversationId,
            participants: conversation.participants,
            groupName: conversation.groupName || null,
            addedBy: fromHandle,
            timestamp: new Date().toISOString(),
          });
          console.log(`[WS] Notified @${normalizedNewMember} that they were added to group`);
        }

        // 6. Notify existing participants with group:memberAdded
        for (const participant of conversation.participants) {
          const normalizedParticipant = normalizeHandle(participant);
          // Don't notify the newly added member (they got group:added) or the adder
          if (normalizedParticipant === normalizedNewMember || normalizedParticipant === normalizedFromHandle) {
            continue;
          }

          const participantSocketId = connectedUsers.get(normalizedParticipant);
          if (participantSocketId) {
            io.to(participantSocketId).emit('group:memberAdded', {
              conversationId,
              handle: normalizedNewMember,
              addedBy: fromHandle,
              timestamp: new Date().toISOString(),
            });
          }
        }

        console.log(`[WS] Notified existing participants about new member @${normalizedNewMember}`);

        // 7. Acknowledge success to the adder
        socket.emit('group:memberAdd:success', {
          conversationId,
          handle: normalizedNewMember,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error(`[WS] Error processing group:memberAdd for ${conversationId}:`, error);
        socket.emit('error', { message: 'Failed to add member to group' });
      }
    });

    // Request user status
    socket.on('status:request', (handles: string[]) => {
      const statuses: UserStatus[] = handles.map((handle) => {
        const normalizedHandle = normalizeHandle(handle);
        return {
          handle: normalizedHandle,
          isOnline: connectedUsers.has(normalizedHandle),
          lastSeen: connectedUsers.has(normalizedHandle) ? new Date() : undefined,
        };
      });

      socket.emit('status:response', statuses);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const handle = socketToUser.get(socket.id);

      if (handle) {
        console.log(`[WS] ========================================`);
        console.log(`[WS] DISCONNECT EVENT`);
        console.log(`[WS] Handle: @${handle}`);
        console.log(`[WS] Socket ID: ${socket.id}`);
        console.log(`[WS] Reason: ${reason}`);
        console.log(`[WS] Current mapping: @${handle} -> ${connectedUsers.get(handle)}`);
        console.log(`[WS] ========================================`);

        // Only clean up if this socket is still the active one for this user
        if (connectedUsers.get(handle) === socket.id) {
          connectedUsers.delete(handle);
          socketToUser.delete(socket.id);

          // Broadcast offline status
          broadcastUserStatus(io, handle, false);

          console.log(`[WS] User @${handle} went offline (cleaned up from connectedUsers)`);
        } else {
          // This was an old/stale socket, just clean up socketToUser
          socketToUser.delete(socket.id);
          console.log(`[WS] Stale socket for @${handle} disconnected (was already replaced, not broadcasting offline)`);
        }
      } else {
        console.log(`[WS] Socket ${socket.id} disconnected (no associated handle)`);
      }
    });
  });

  return io;
}

// Helper to broadcast user status changes
function broadcastUserStatus(io: SocketIOServer, handle: string, isOnline: boolean): void {
  io.emit('user:status', {
    handle,
    isOnline,
    lastSeen: isOnline ? new Date() : undefined,
  } as UserStatus);
}

// Export for use in other services
export function getUserSocketId(handle: string): string | undefined {
  return connectedUsers.get(normalizeHandle(handle));
}

export function isUserOnline(handle: string): boolean {
  return connectedUsers.has(normalizeHandle(handle));
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}
