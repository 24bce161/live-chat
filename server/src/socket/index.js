import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { addUser, removeUser, getOnlineUsers } from './handlers/presence.handler.js';
import { handleMessageEvents } from './handlers/message.handler.js';
import { handleTypingEvents } from './handlers/typing.handler.js';
import { CONNECTION, DISCONNECT, USER_ONLINE, USER_OFFLINE, ERROR } from './events.js';

export let io;

export const initializeSocket = (server) => {
  // Create Socket.IO server with CORS config
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
      // verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
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

    // Set user status to 'online' in DB
    await User.findByIdAndUpdate(userId, { status: 'online' });
    
    addUser(userId, socket.id);

    // Find all user's conversations, join socket to each room
    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach(conv => {
      socket.join(conv._id.toString());
    });

    // Also join a personal room for direct notifications
    socket.join(userId);

    // Broadcast USER_ONLINE to all connected clients
    socket.broadcast.emit(USER_ONLINE, { userId, status: 'online' });

    // Send initial online users to the connecting client
    socket.emit('INITIAL_USERS', getOnlineUsers());

    // Register handlers
    handleMessageEvents(io, socket);
    handleTypingEvents(io, socket);

    socket.on(DISCONNECT, async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name}`);
      const isCompletelyOffline = removeUser(userId, socket.id);

      if (isCompletelyOffline) {
        const lastSeen = Date.now();
        // Set user status to 'offline', update lastSeen
        await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen });
        // Broadcast USER_OFFLINE
        socket.broadcast.emit(USER_OFFLINE, { userId, status: 'offline', lastSeen });
      }
    });
  });

  return io;
};
