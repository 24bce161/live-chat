import { useRef, useCallback, useEffect } from 'react';
import { TYPING_TIMEOUT } from '../utils/constants';
import { TYPING_START, TYPING_STOP } from '../utils/socketEvents';

/**
 * Hook to manage typing indicator events.
 * Emits typing:start on first keypress, then typing:stop after
 * TYPING_TIMEOUT ms of inactivity, when a message is sent, or when
 * the user switches to another chat.
 */
export const useTyping = (conversationId, socket) => {
  const isTyping = useRef(false);
  const timeoutRef = useRef(null);

  const stopTyping = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (isTyping.current && socket && conversationId) {
      socket.emit(TYPING_STOP, { conversationId });
    }
    isTyping.current = false;
  }, [conversationId, socket]);

  const handleTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit(TYPING_START, { conversationId });
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  }, [conversationId, socket, stopTyping]);

  // Switching chats (or closing the chat) counts as "stopped typing"
  useEffect(() => stopTyping, [stopTyping]);

  return { handleTyping, stopTyping };
};
