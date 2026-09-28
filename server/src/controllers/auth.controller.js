import User, { CASE_INSENSITIVE } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatUser } from '../utils/formatUser.js';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const emailTaken = await User.findOne({ email });
  if (emailTaken) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  // Case-insensitive, so "John" can't sign up if "john" exists
  const nameTaken = await User.findOne({ name }).collation(CASE_INSENSITIVE);
  if (nameTaken) {
    return res.status(409).json({ message: 'Username is already taken' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    user: formatUser(user),
    token: generateToken(user._id)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Usernames are matched ignoring case, so "John" and "john" both work
  const user = await User.findOne({ name: username })
    .collation(CASE_INSENSITIVE)
    .select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  res.json({
    user: formatUser(user),
    token: generateToken(user._id)
  });
});

// JWTs are stateless, so there's nothing to delete on the server.
// Online/offline is handled by the socket disconnecting when the client logs out.
export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

export const getMe = (req, res) => {
  res.json({ user: formatUser(req.user) });
};
