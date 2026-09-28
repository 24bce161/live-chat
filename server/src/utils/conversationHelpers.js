/**
 * Is this user a member of the conversation?
 * Works whether participants are populated (user objects) or plain ObjectIds.
 */
export const isParticipant = (conversation, userId) => {
  return conversation.participants.some(
    (p) => (p._id || p).toString() === userId.toString()
  );
};

export const isAdmin = (conversation, userId) => {
  return !!conversation.admin && conversation.admin.toString() === userId.toString();
};

/**
 * When did this user last read the conversation? (null if never)
 */
export const getLastReadAt = (conversation, userId) => {
  const entry = (conversation.lastRead || []).find(
    (r) => r.user.toString() === userId.toString()
  );
  return entry ? entry.at : null;
};

/**
 * Record that a user has read the conversation up to `date`.
 * Only changes the document — the caller still needs to save() it.
 */
export const setLastRead = (conversation, userId, date) => {
  const entry = conversation.lastRead.find(
    (r) => r.user.toString() === userId.toString()
  );
  if (entry) {
    entry.at = date;
  } else {
    conversation.lastRead.push({ user: userId, at: date });
  }
};

/**
 * Short text for the conversation list, e.g. "Hello" or "📷 Photo"
 */
export const getMessagePreview = (message) => {
  if (message.text) return message.text;
  return message.attachmentType === 'image' ? '📷 Photo' : '📎 File';
};

/**
 * Newest activity first. Chats with no messages yet use their creation time,
 * so a brand-new chat shows at the top instead of the bottom.
 */
export const sortByActivity = (conversations) => {
  const activityTime = (c) => new Date(c.lastMessage?.createdAt || c.createdAt).getTime();
  return conversations.sort((a, b) => activityTime(b) - activityTime(a));
};
