import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, attachmentUrl, attachmentType, replyTo } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send message to this conversation' });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: req.user._id,
      text,
      attachmentUrl,
      attachmentType,
      replyTo: replyTo || null,
      readBy: [{ user: req.user._id, readAt: new Date() }]
    });

    conversation.lastMessage = {
      text: text || (attachmentType === 'image' ? 'Image' : 'File'),
      sender: req.user._id,
      createdAt: newMessage.createdAt
    };
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name avatarUrl')
      .populate({
        path: 'replyTo',
        select: 'text attachmentType senderId',
        populate: { path: 'senderId', select: 'name' }
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 30;
    const actualLimit = Math.min(limit, 50);
    const before = req.query.before;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to read messages in this conversation' });
    }

    let query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(actualLimit + 1)
      .populate('senderId', 'name avatarUrl')
      .populate({
        path: 'replyTo',
        select: 'text attachmentType senderId',
        populate: { path: 'senderId', select: 'name' }
      });

    const hasMore = messages.length > actualLimit;
    if (hasMore) {
      messages.pop();
    }

    res.json({
      messages: messages.reverse(),
      hasMore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await Message.updateMany(
      {
        conversationId,
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } }
      }
    );

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
