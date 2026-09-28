import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: [v => v.length >= 2, 'Conversation must have at least 2 participants']
  },
  name: {
    type: String,
    trim: true,
    required: function() { return this.type === 'group'; }
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  },
  // When each member last read this chat. Used for:
  //  - unread count: messages from others newer than my `at`
  //  - read ticks:   a message is "seen" once every other member's `at` is after it
  lastRead: [{
    _id: false,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: Date
  }]
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
