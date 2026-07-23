import { useState, useCallback, useEffect } from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useSocketContext } from '../contexts/SocketContext';
import { MESSAGE_SEND } from '../utils/socketEvents';

/**
 * Hook for managing chat messages in a specific conversation.
 * Handles loading, pagination, and sending messages via Socket.IO.
 */
export const useChat = (conversationId) => {
  const { messages, setMessages, fetchMessages } = useChatContext();
  const { socket } = useSocketContext();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const conversationMessages = messages[conversationId] || [];

  const loadMessages = useCallback(async (before = null) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await fetchMessages(conversationId, before);
      const fetchedMessages = data.messages || data;
      const moreAvailable = data.hasMore !== undefined ? data.hasMore : fetchedMessages.length >= 30;

      if (fetchedMessages.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(moreAvailable);
        setMessages(prev => {
          const current = prev[conversationId] || [];
          // Avoid duplicates
          const newMsgs = fetchedMessages.filter(d => !current.find(c => c._id === d._id));
          return {
            ...prev,
            [conversationId]: [...newMsgs, ...current].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            )
          };
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, fetchMessages, setMessages]);

  const sendMessage = useCallback(async (text, attachmentUrl = null, attachmentType = null, replyTo = null) => {
    if (!socket || !conversationId) return;
    socket.emit(MESSAGE_SEND, {
      conversationId,
      text,
      attachmentUrl,
      attachmentType,
      replyTo
    });
  }, [socket, conversationId]);

  // Auto-load messages when conversation is selected
  useEffect(() => {
    if (conversationId && conversationMessages.length === 0) {
      setHasMore(true);
      loadMessages();
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages: conversationMessages,
    loading,
    hasMore,
    loadMore: () => {
      if (conversationMessages.length > 0) {
        loadMessages(conversationMessages[0]?.createdAt);
      }
    },
    sendMessage
  };
};
