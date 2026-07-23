import { TYPING_START, TYPING_STOP } from '../events.js';

export const handleTypingEvents = (io, socket) => {
  socket.on(TYPING_START, ({ conversationId }) => {
    socket.to(conversationId.toString()).emit(TYPING_START, {
      conversationId,
      userId: socket.user.id,
      userName: socket.user.name
    });
  });

  socket.on(TYPING_STOP, ({ conversationId }) => {
    socket.to(conversationId.toString()).emit(TYPING_STOP, {
      conversationId,
      userId: socket.user.id,
      userName: socket.user.name
    });
  });
};
