import Conversation from '../models/Conversation.js';

export const createConversation = async (req, res) => {
  try {
    let { type, participants, name } = req.body;

    // Ensure the current user is in the participants array
    const userIdStr = req.user._id.toString();
    if (!participants.some(p => p.toString() === userIdStr)) {
      participants.push(req.user._id);
    }

    if (type === 'direct') {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: participants, $size: 2 }
      }).populate('participants', 'name email avatarUrl status');

      if (existingConversation) {
        return res.json(existingConversation);
      }
    }

    if (type === 'group' && !name) {
      return res.status(400).json({ message: 'Group conversation requires a name' });
    }

    const newConversation = await Conversation.create({
      type,
      participants,
      name: type === 'group' ? name : undefined,
      admin: type === 'group' ? req.user._id : undefined
    });

    const populatedConv = await Conversation.findById(newConversation._id)
      .populate('participants', 'name email avatarUrl status');

    res.status(201).json(populatedConv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email avatarUrl status')
      .sort({ 'lastMessage.createdAt': -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email avatarUrl status');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    if (!conversation.participants.includes(req.body.userId)) {
      conversation.participants.push(req.body.userId);
      await conversation.save();
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    if (conversation.admin.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove admin' });
    }

    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.params.userId
    );
    await conversation.save();

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
