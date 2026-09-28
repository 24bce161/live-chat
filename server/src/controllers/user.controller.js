import User, { CASE_INSENSITIVE } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatUser, PUBLIC_USER_FIELDS } from '../utils/formatUser.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(PUBLIC_USER_FIELDS);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

/**
 * Find a user by their exact 6-character connection code.
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const code = String(req.query.q || '').trim().toUpperCase();
  if (code.length !== 6) {
    return res.json([]);
  }

  const users = await User.find({
    connectionCode: code,
    _id: { $ne: req.user._id }
  })
    .select(PUBLIC_USER_FIELDS)
    .limit(1);

  res.json(users);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const user = await User.findById(req.user._id);

  if (name && name !== user.name) {
    const nameTaken = await User.findOne({ name, _id: { $ne: user._id } }).collation(CASE_INSENSITIVE);
    if (nameTaken) {
      return res.status(409).json({ message: 'Username is already taken' });
    }
    user.name = name;
  }

  // An empty string removes the avatar
  if (avatarUrl !== undefined) {
    user.avatarUrl = avatarUrl;
  }

  await user.save();
  res.json({ user: formatUser(user) });
});
