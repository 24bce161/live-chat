import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isParticipant, setLastRead, getMessagePreview } from '../utils/conversationHelpers.js';
import { emitToRoom } from '../socket/index.js';
import { MESSAGE_RECEIVE, MESSAGE_READ_UPDATE } from '../socket/events.js';

const populateMessage = (query) => {
  return query
    .populate('senderId', 'name avatarUrl')
    .populate({
      path: 'replyTo',
      select: 'text attachmentType senderId',
      populate: { path: 'senderId', select: 'name' }
    });
};

/**
 * The ONLY place messages are created.
 * The client sends messages over REST (so they get validation, rate limiting and
 * a proper error response), then the server pushes them to everyone over Socket.IO.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, attachmentUrl, attachmentType, attachmentName, replyTo } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to send message to this conversation' });
  }

  // You can only reply to a message from the same conversation
  if (replyTo) {
    const original = await Message.exists({ _id: replyTo, conversationId });
    if (!original) {
      return res.status(400).json({ message: 'The message you are replying to was not found' });
    }
  }

  // The model rejects messages with no text and no attachment
  const newMessage = await Message.create({
    conversationId,
    senderId: req.user._id,
    text,
    attachmentUrl: attachmentUrl || undefined,
    attachmentType: attachmentUrl ? attachmentType : undefined,
    attachmentName: attachmentUrl ? attachmentName : undefined,
    replyTo: replyTo || null
  });

  conversation.lastMessage = {
    text: getMessagePreview(newMessage),
    sender: req.user._id,
    createdAt: newMessage.createdAt
  };
  // Sending a message means you've seen everything before it
  setLastRead(conversation, req.user._id, newMessage.createdAt);
  await conversation.save();

  const populatedMessage = await populateMessage(Message.findById(newMessage._id));

  // Everyone in the chat (including the sender's other tabs) gets it in real time
  emitToRoom(conversationId, MESSAGE_RECEIVE, populatedMessage);

  res.status(201).json(populatedMessage);
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit) || 30;
  const actualLimit = Math.min(limit, 50);
  const before = req.query.before;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to read messages in this conversation' });
  }

  let query = { conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await populateMessage(
    Message.find(query)
      .sort({ createdAt: -1 })
      .limit(actualLimit + 1)
  );

  const hasMore = messages.length > actualLimit;
  if (hasMore) {
    messages.pop();
  }

  res.json({
    messages: messages.reverse(),
    hasMore
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to access this conversation' });
  }

  // One update on the conversation, instead of updating every message
  const readAt = new Date();
  setLastRead(conversation, req.user._id, readAt);
  await conversation.save();

  // Lets the other members turn their ticks blue
  emitToRoom(conversationId, MESSAGE_READ_UPDATE, {
    conversationId,
    userId: req.user._id.toString(),
    readAt
  });

  res.json({ conversationId, readAt });
});
