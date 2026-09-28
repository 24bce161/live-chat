// userId -> Set of socket ids (one per open tab)
const onlineUsers = new Map();

/**
 * Returns true if this is the user's first open tab (they just came online).
 */
export const addUser = (userId, socketId) => {
  const isFirstConnection = !onlineUsers.has(userId);
  if (isFirstConnection) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
  return isFirstConnection;
};

/**
 * Returns true if that was the user's last open tab (they just went offline).
 */
export const removeUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    const userSockets = onlineUsers.get(userId);
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
      return true; // user completely offline
    }
  }
  return false;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
