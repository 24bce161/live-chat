import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateConnectionCode } from '../utils/generateConnectionCode.js';

/**
 * Pass to .collation() to compare usernames ignoring upper/lower case,
 * so "John" and "john" count as the same username.
 */
export const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

const userSchema = new mongoose.Schema({
  // Used both as the login username and the name other people see
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
    // Format is checked by express-validator's isEmail() in the signup route
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
  // "Online" is tracked live by the socket server (see socket/handlers/presence.handler.js).
  // The database only remembers when the user was last seen.
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

userSchema.pre('save', async function () {
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

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
