import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateConnectionCode } from '../utils/generateConnectionCode.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  connectionCode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple nulls if necessary, but we'll try to populate them
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

userSchema.pre('save', async function (next) {
  // Generate a unique connection code for new users or users missing it
  if (!this.connectionCode) {
    let isUnique = false;
    while (!isUnique) {
      const code = generateConnectionCode();
      const existing = await mongoose.models.User.findOne({ connectionCode: code });
      if (!existing) {
        this.connectionCode = code;
        isUnique = true;
      }
    }
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
