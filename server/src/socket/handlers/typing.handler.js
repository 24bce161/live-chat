import { TYPING_START, TYPING_STOP } from '../events.js';

export const handleTypingEvents = (io, socket) => {
  // A socket is only in a conversation's room if the user is a member,
  // so checking the room is also the permission check.
  const isMember = (conversationId) => {
    return !!conversationId && socket.rooms.has(conversationId.toString());
  };

  socket.on(TYPING_START, ({ conversationId } = {}) => {
    if (!isMember(conversationId)) return;
    socket.to(conversationId.toString()).emit(TYPING_START, {
      conversationId,
      userId: socket.user.id,
      userName: socket.user.name
    });
  });

  socket.on(TYPING_STOP, ({ conversationId } = {}) => {
    if (!isMember(conversationId)) return;
    socket.to(conversationId.toString()).emit(TYPING_STOP, {
      conversationId,
      userId: socket.user.id,
      userName: socket.user.name
    });
  });
};
