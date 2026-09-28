/**
 * Fields that are safe to show about OTHER users (in search results, chat participants, etc.).
 * Email is deliberately left out — people find each other by connection code only.
 */
export const PUBLIC_USER_FIELDS = 'name avatarUrl lastSeen';

/**
 * The shape of the logged-in user sent back by auth/profile endpoints.
 * Every endpoint uses this, so the client always gets the same fields (always `_id`, never `id`).
 */
export const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  connectionCode: user.connectionCode,
  lastSeen: user.lastSeen,
});
