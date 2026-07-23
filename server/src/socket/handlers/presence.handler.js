export const onlineUsers = new Map();

export const addUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

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

export const isOnline = (userId) => {
  return onlineUsers.has(userId);
};
