/**
 * Small helpers shared by the chat components, so the same logic
 * isn't copied into every file.
 */

// senderId is a user object when populated, or just an id string
export const getSenderId = (message) => message.senderId?._id || message.senderId;

// In a direct chat, the person who isn't me
export const getOtherParticipant = (conversation, myId) => {
  return conversation.participants?.find(p => p._id !== myId);
};

// Group name, or the other person's name for direct chats
export const getConversationName = (conversation, myId) => {
  if (conversation.type === 'group') return conversation.name;
  return getOtherParticipant(conversation, myId)?.name || 'Unknown user';
};

// Short text for the sidebar and reply previews, e.g. "Hello" or "📷 Photo"
export const getMessagePreview = (message) => {
  if (message.text) return message.text;
  return message.attachmentType === 'image' ? '📷 Photo' : '📎 File';
};

// Newest activity first (chats with no messages use their creation time)
export const sortByActivity = (conversations) => {
  const activityTime = (c) => new Date(c.lastMessage?.createdAt || c.createdAt).getTime();
  return [...conversations].sort((a, b) => activityTime(b) - activityTime(a));
};

// Record that a user has read a conversation up to `at` (returns a new conversation object)
export const withLastRead = (conversation, userId, at) => ({
  ...conversation,
  lastRead: [...(conversation.lastRead || []).filter(r => r.user !== userId), { user: userId, at }]
});

// What we know about one conversation's messages before anything is loaded
export const EMPTY_MESSAGE_CACHE = { items: [], hasMore: true, loaded: false };

// Add messages to a list without duplicates, keeping oldest -> newest order
export const mergeMessages = (existing, incoming) => {
  const existingIds = new Set(existing.map(m => m._id));
  const newOnes = incoming.filter(m => !existingIds.has(m._id));
  return [...existing, ...newOnes].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
};

/**
 * Blue ticks: true once EVERY other member has read the chat after this message was sent.
 * Uses conversation.lastRead = [{ user, at }] from the server.
 */
export const isSeenByEveryone = (message, conversation) => {
  const senderId = getSenderId(message);
  const others = conversation.participants.filter(p => p._id !== senderId);
  if (others.length === 0) return false;

  return others.every(person => {
    const entry = conversation.lastRead?.find(r => r.user === person._id);
    return !!entry && new Date(entry.at) >= new Date(message.createdAt);
  });
};

// The server always sends { message }, so this is the one place to read errors
export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  return error.response?.data?.message || fallback;
};
