import { Server } from 'socket.io';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { verifyToken } from '../utils/generateToken.js';
import { addUser, removeUser, getOnlineUsers } from './handlers/presence.handler.js';
import { handleTypingEvents } from './handlers/typing.handler.js';
import {
  CONNECTION,
  DISCONNECTING,
  DISCONNECT,
  ONLINE_USERS,
  USER_ONLINE,
  USER_OFFLINE,
  TYPING_STOP
} from './events.js';

export let io;

/*
 * Helpers the REST controllers use to push real-time updates.
 * Every user has a personal room named after their user id, and every
 * conversation has a room named after its id.
 * They do nothing when the socket server isn't running (e.g. in tests).
 */

// Send an event to everyone in a room (a conversation id or a user id)
export const emitToRoom = (room, event, data) => {
  if (io) io.to(room.toString()).emit(event, data);
};

// Make all of a user's open tabs join a conversation room
export const joinRoom = (userId, room) => {
  if (io) io.in(userId.toString()).socketsJoin(room.toString());
};

// Make all of a user's open tabs leave a conversation room
export const leaveRoom = (userId, room) => {
  if (io) io.in(userId.toString()).socketsLeave(room.toString());
};

export const initializeSocket = (server) => {
  // Create Socket.IO server with CORS config
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.CLIENT_URL || 'http://localhost:5173')
        : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Add auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }
      // attach user to socket
      socket.user = { id: user._id.toString(), name: user.name };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on(CONNECTION, async (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${socket.user.name}`);

    // Register handlers first, so no events are missed while we wait for the database below
    handleTypingEvents(io, socket);

    // Rooms are still available in 'disconnecting' (they're gone by 'disconnect').
    // Tell each chat this user stopped typing, so "typing..." doesn't get stuck.
    socket.on(DISCONNECTING, () => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id && room !== userId) {
          socket.to(room).emit(TYPING_STOP, { conversationId: room, userId });
        }
      });
    });

    socket.on(DISCONNECT, async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name}`);
      const isCompletelyOffline = removeUser(userId, socket.id);

      // Only when the user's LAST tab closes
      if (isCompletelyOffline) {
        const lastSeen = new Date();
        socket.broadcast.emit(USER_OFFLINE, { userId, lastSeen });
        try {
          await User.findByIdAndUpdate(userId, { lastSeen });
        } catch (error) {
          console.error('[Socket] Failed to save lastSeen:', error);
        }
      }
    });

    // Personal room for notifications meant for this user only (e.g. "you were added to a group")
    socket.join(userId);

    // Only announce "online" for the user's first tab, not every extra tab
    const isFirstConnection = addUser(userId, socket.id);
    if (isFirstConnection) {
      socket.broadcast.emit(USER_ONLINE, { userId });
    }

    // Send the current online list to the user who just connected
    socket.emit(ONLINE_USERS, getOnlineUsers());

    // Join a room for each of the user's conversations.
    // Conversations created later are joined from the conversation controller.
    try {
      const conversations = await Conversation.find({ participants: userId }).select('_id');
      conversations.forEach(conv => {
        socket.join(conv._id.toString());
      });
    } catch (error) {
      console.error('[Socket] Failed to join conversation rooms:', error);
    }
  });

  return io;
};
