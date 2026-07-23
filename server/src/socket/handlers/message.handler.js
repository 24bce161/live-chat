import Message from '../../models/Message.js';
import Conversation from '../../models/Conversation.js';
import { MESSAGE_SEND, MESSAGE_RECEIVE, MESSAGE_READ, MESSAGE_READ_UPDATE, ERROR } from '../events.js';

export const handleMessageEvents = (io, socket) => {
  // Handle sending a message
  socket.on(MESSAGE_SEND, async ({ conversationId, text, attachmentUrl, attachmentType, replyTo }) => {
    try {
      // Create Message in DB
      const newMessage = await Message.create({
        conversationId,
        senderId: socket.user.id,
        text,
        attachmentUrl,
        attachmentType,
        replyTo: replyTo || null,
        readBy: [{ user: socket.user.id, readAt: new Date() }]
      });

      // Update conversation's lastMessage
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          text: text || (attachmentType === 'image' ? 'Image' : 'File'),
          sender: socket.user.id,
          createdAt: newMessage.createdAt
        }
      });

      // Populate senderId and replyTo
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('senderId', 'name avatarUrl')
        .populate({
          path: 'replyTo',
          select: 'text attachmentType senderId',
          populate: { path: 'senderId', select: 'name' }
        });

      // Emit MESSAGE_RECEIVE to the conversation room (so all participants get it)
      io.to(conversationId.toString()).emit(MESSAGE_RECEIVE, populatedMessage);
    } catch (error) {
      console.error('Socket message send error:', error);
      socket.emit(ERROR, { message: 'Failed to send message' });
    }
  });

  // Handle reading a message
  socket.on(MESSAGE_READ, async ({ conversationId }) => {
    try {
      const readAt = new Date();
      // Update all unread messages' readBy
      await Message.updateMany(
        {
          conversationId,
          'readBy.user': { $ne: socket.user.id }
        },
        {
          $push: { readBy: { user: socket.user.id, readAt } }
        }
      );

      // Emit MESSAGE_READ_UPDATE to conversation room
      io.to(conversationId.toString()).emit(MESSAGE_READ_UPDATE, {
        conversationId,
        userId: socket.user.id,
        readAt
      });
    } catch (error) {
      console.error('Socket message read error:', error);
    }
  });
};
