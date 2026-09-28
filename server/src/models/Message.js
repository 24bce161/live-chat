import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  attachmentUrl: {
    type: String
  },
  attachmentType: {
    type: String,
    enum: ['image', 'file']
  },
  // Original file name, shown on file cards (e.g. "report.pdf")
  attachmentName: {
    type: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
  // Read receipts are stored once per conversation (Conversation.lastRead),
  // not on every message.
}, { timestamps: true });

// A message needs some content: text, an attachment, or both
messageSchema.pre('validate', function (next) {
  if (!this.text && !this.attachmentUrl) {
    this.invalidate('text', 'Message cannot be empty');
  }
  next();
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
