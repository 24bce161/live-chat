import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PUBLIC_USER_FIELDS } from '../utils/formatUser.js';
import { isParticipant, isAdmin, getLastReadAt, sortByActivity } from '../utils/conversationHelpers.js';
import { emitToRoom, joinRoom, leaveRoom } from '../socket/index.js';
import { CONVERSATION_CREATED, CONVERSATION_UPDATED, CONVERSATION_REMOVED } from '../socket/events.js';

const findPopulated = (conversationId) => {
  return Conversation.findById(conversationId).populate('participants', PUBLIC_USER_FIELDS);
};

export const createConversation = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const name = req.body.name?.trim();
  const myId = req.user._id.toString();

  // Remove duplicates and make sure the current user is included
  const participantIds = [...new Set([...req.body.participants.map(String), myId])];

  if (type === 'direct' && participantIds.length !== 2) {
    return res.status(400).json({ message: 'A direct chat needs exactly one other person' });
  }
  if (type === 'group' && !name) {
    return res.status(400).json({ message: 'Group conversation requires a name' });
  }
  if (type === 'group' && participantIds.length < 2) {
    return res.status(400).json({ message: 'Add at least one other person to the group' });
  }

  // Every participant must be a real user
  const userCount = await User.countDocuments({ _id: { $in: participantIds } });
  if (userCount !== participantIds.length) {
    return res.status(400).json({ message: 'One or more users do not exist' });
  }

  // Reuse the existing direct chat between these two people
  if (type === 'direct') {
    const existingConversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: participantIds, $size: 2 }
    }).populate('participants', PUBLIC_USER_FIELDS);

    if (existingConversation) {
      participantIds.forEach((userId) => {
        joinRoom(userId, existingConversation._id);
        emitToRoom(userId, CONVERSATION_CREATED, existingConversation);
      });
      return res.json(existingConversation);
    }
  }

  const newConversation = await Conversation.create({
    type,
    participants: participantIds,
    name: type === 'group' ? name : undefined,
    admin: type === 'group' ? req.user._id : undefined,
    lastRead: [{ user: req.user._id, at: new Date() }]
  });

  const populatedConv = await findPopulated(newConversation._id);

  // Put every member's open tabs into the new room (so they get messages right away)
  // and add the chat to their sidebar
  participantIds.forEach((userId) => {
    joinRoom(userId, newConversation._id);
    emitToRoom(userId, CONVERSATION_CREATED, populatedConv);
  });

  res.status(201).json(populatedConv);
});

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', PUBLIC_USER_FIELDS)
    .lean();

  // Unread = messages from other people that are newer than when I last read the chat
  for (const conv of conversations) {
    const query = { conversationId: conv._id, senderId: { $ne: userId } };
    const lastReadAt = getLastReadAt(conv, userId);
    if (lastReadAt) {
      query.createdAt = { $gt: lastReadAt };
    }
    conv.unreadCount = await Message.countDocuments(query);
  }

  res.json(sortByActivity(conversations));
});

export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await findPopulated(req.params.id);

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  if (!isParticipant(conversation, req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to access this conversation' });
  }

  res.json(conversation);
});

export const addParticipant = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || conversation.type !== 'group') {
    return res.status(404).json({ message: 'Group conversation not found' });
  }

  if (!isAdmin(conversation, req.user._id)) {
    return res.status(403).json({ message: 'Only the group admin can add members' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (isParticipant(conversation, userId)) {
    return res.status(400).json({ message: `${user.name} is already in this group` });
  }

  conversation.participants.push(userId);
  await conversation.save();

  const populatedConv = await findPopulated(conversation._id);

  // Existing members see the new member list; the new member gets the chat in their sidebar
  emitToRoom(conversation._id, CONVERSATION_UPDATED, populatedConv);
  joinRoom(userId, conversation._id);
  emitToRoom(userId, CONVERSATION_CREATED, populatedConv);

  res.json(populatedConv);
});

/**
 * The admin can remove anyone except themselves.
 * Any other member can remove themselves (leave the group).
 */
export const removeParticipant = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || conversation.type !== 'group') {
    return res.status(404).json({ message: 'Group conversation not found' });
  }

  const isLeaving = userId === req.user._id.toString();
  if (!isAdmin(conversation, req.user._id) && !isLeaving) {
    return res.status(403).json({ message: 'Only the group admin can remove members' });
  }

  if (isAdmin(conversation, userId)) {
    return res.status(400).json({ message: 'Cannot remove admin' });
  }

  if (!isParticipant(conversation, userId)) {
    return res.status(404).json({ message: 'User is not in this group' });
  }

  conversation.participants = conversation.participants.filter(p => p.toString() !== userId);
  conversation.lastRead = conversation.lastRead.filter(r => r.user.toString() !== userId);
  await conversation.save();

  // The removed user stops getting this chat's messages and loses it from their sidebar
  leaveRoom(userId, conversation._id);
  emitToRoom(userId, CONVERSATION_REMOVED, { conversationId: conversation._id });

  const populatedConv = await findPopulated(conversation._id);
  emitToRoom(conversation._id, CONVERSATION_UPDATED, populatedConv);

  res.json(populatedConv);
});
