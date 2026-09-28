import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useChatContext } from '../contexts/ChatContext';
import { mergeMessages, getErrorMessage, EMPTY_MESSAGE_CACHE } from '../utils/chatHelpers';

/**
 * Messages for one conversation.
 * Loads the latest page the first time the chat is opened, loads older pages
 * on request, and sends new messages.
 */
export const useChat = (conversationId) => {
  const { messageCache, updateMessageCache, sendMessage } = useChatContext();
  const [loading, setLoading] = useState(false);

  // Each conversation has its own cache, so switching chats never mixes up
  // messages or the "hasMore" flag
  const cache = messageCache[conversationId] || EMPTY_MESSAGE_CACHE;

  const loadMessages = useCallback(async (before) => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/${conversationId}`, { params: before ? { before } : {} });
      updateMessageCache(conversationId, current => ({
        // Merge, because messages may already be here from the socket
        items: mergeMessages(current.items, res.data.messages),
        hasMore: res.data.hasMore,
        loaded: true
      }));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load messages'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, updateMessageCache]);

  // Load history the first time this chat is opened (or again after a reconnect).
  // Uses `loaded` rather than "is the list empty", because a message may have
  // arrived over the socket before the chat was ever opened.
  useEffect(() => {
    if (conversationId && !cache.loaded) {
      loadMessages();
    }
  }, [conversationId, cache.loaded, loadMessages]);

  const loadMore = useCallback(() => {
    if (loading || !cache.hasMore || cache.items.length === 0) return;
    loadMessages(cache.items[0].createdAt);
  }, [loading, cache.hasMore, cache.items, loadMessages]);

  const send = useCallback((data) => {
    return sendMessage(conversationId, data);
  }, [conversationId, sendMessage]);

  return {
    messages: cache.items,
    loading,
    loaded: cache.loaded,
    hasMore: cache.hasMore,
    loadMore,
    sendMessage: send
  };
};
