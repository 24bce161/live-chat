import { useRef, useCallback } from 'react';
import { TYPING_TIMEOUT } from '../utils/constants';
import { TYPING_START, TYPING_STOP } from '../utils/socketEvents';

/**
 * Hook to manage typing indicator events.
 * Emits typing:start on first keypress, then typing:stop after
 * TYPING_TIMEOUT ms of inactivity (debounced).
 */
export const useTyping = (conversationId, socket) => {
  const isTyping = useRef(false);
  const timeoutRef = useRef(null);

  const handleTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit(TYPING_START, { conversationId });
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isTyping.current = false;
      socket.emit(TYPING_STOP, { conversationId });
    }, TYPING_TIMEOUT);
  }, [conversationId, socket]);

  return { handleTyping };
};
