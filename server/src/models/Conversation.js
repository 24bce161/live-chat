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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
