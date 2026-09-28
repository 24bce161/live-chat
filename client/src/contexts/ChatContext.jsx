import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocketContext } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
import {
  MESSAGE_RECEIVE,
  MESSAGE_READ_UPDATE,
  TYPING_START,
  TYPING_STOP,
  CONVERSATION_CREATED,
  CONVERSATION_UPDATED,
  CONVERSATION_REMOVED
} from '../utils/socketEvents';
import {
  getSenderId,
  getMessagePreview,
  sortByActivity,
  mergeMessages,
  withLastRead,
  EMPTY_MESSAGE_CACHE
} from '../utils/chatHelpers';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { user, isAuthenticated } = useAuth();

  // Each conversation from the server includes `unreadCount` and `lastRead`
  const [conversations, setConversations] = useState([]);
  // Store only the id. The conversation itself is always looked up in the list,
  // so the open chat never shows an out-of-date copy.
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  // { [conversationId]: { items: [messages], hasMore, loaded } }
  const [messageCache, setMessageCache] = useState({});
  // { [conversationId]: [{ userId, userName }] }
  const [typingUsers, setTypingUsers] = useState({});

  const activeConversation = conversations.find(c => c._id === activeConversationId) || null;

  // The socket listeners below are registered only once, so they read
  // the current user and open chat through refs (always up to date).
  const myIdRef = useRef(null);
  const activeIdRef = useRef(null);
  useEffect(() => { myIdRef.current = user?._id; }, [user]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  }, []);

  // Change one conversation in the list. `update` gets the old one and returns the new one.
  const updateConversation = useCallback((conversationId, update) => {
    setConversations(prev => prev.map(c => (c._id === conversationId ? update(c) : c)));
  }, []);

  // Change one conversation's message cache. `update` returns the fields to change.
  const updateMessageCache = useCallback((conversationId, update) => {
    setMessageCache(prev => {
      const current = prev[conversationId] || EMPTY_MESSAGE_CACHE;
      return { ...prev, [conversationId]: { ...current, ...update(current) } };
    });
  }, []);

  const addConversation = useCallback((conversation) => {
    setConversations(prev => {
      if (prev.some(c => c._id === conversation._id)) return prev;
      return sortByActivity([{ unreadCount: 0, ...conversation }, ...prev]);
    });
  }, []);

  // Swap in a newer copy from the server (e.g. members changed), keeping our unread count
  const replaceConversation = useCallback((conversation) => {
    updateConversation(conversation._id, c => ({ ...conversation, unreadCount: c.unreadCount }));
  }, [updateConversation]);

  const removeConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c._id !== conversationId));
    setActiveConversationId(prev => (prev === conversationId ? null : prev));
  }, []);

  const setTypingUser = useCallback((conversationId, typingUser, isTyping) => {
    setTypingUsers(prev => {
      const currentTyping = prev[conversationId] || [];
      if (isTyping) {
        if (!currentTyping.find(u => u.userId === typingUser.userId)) {
          return { ...prev, [conversationId]: [...currentTyping, typingUser] };
        }
        return prev;
      } else {
        return { ...prev, [conversationId]: currentTyping.filter(u => u.userId !== typingUser.userId) };
      }
    });
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    updateConversation(conversationId, c => ({ ...c, unreadCount: 0 }));
    try {
      // The server tells the other members over the socket (so their ticks turn blue)
      await api.put(`/messages/read/${conversationId}`);
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  }, [updateConversation]);

  /**
   * Handles a new message, whether it came from the socket or from our own send request.
   * Safe to call twice with the same message (duplicates are ignored).
   */
  const handleNewMessage = useCallback((message) => {
    const conversationId = message.conversationId;
    const senderId = getSenderId(message);
    const isOwn = senderId === myIdRef.current;
    const isActive = conversationId === activeIdRef.current;

    updateMessageCache(conversationId, current => ({
      items: mergeMessages(current.items, [message])
    }));

    setConversations(prev => {
      const exists = prev.some(c => c._id === conversationId);
      if (!exists) {
        // Conversation doesn't exist in sidebar list yet — fetch it immediately from API
        api.get(`/conversations/${conversationId}`)
          .then(res => {
            setConversations(list => {
              if (list.some(c => c._id === conversationId)) return list;
              return sortByActivity([{ ...res.data, unreadCount: isActive ? 0 : 1 }, ...list]);
            });
          })
          .catch(err => console.error('Error fetching new conversation:', err));
        return prev;
      }

      return sortByActivity(prev.map(c => {
        if (c._id !== conversationId) return c;
        // Sending a message means the sender has read everything before it
        const updated = withLastRead(c, senderId, message.createdAt);
        return {
          ...updated,
          lastMessage: { text: getMessagePreview(message), sender: senderId, createdAt: message.createdAt },
          unreadCount: isOwn || isActive ? 0 : (c.unreadCount || 0) + 1
        };
      }));
    });

    if (!isOwn) {
      // They sent a message, so they've stopped typing
      setTypingUser(conversationId, { userId: senderId }, false);
      if (isActive) {
        markConversationRead(conversationId);
      }
    }
  }, [updateMessageCache, setTypingUser, markConversationRead]);

  const handleNewMessageRef = useRef(handleNewMessage);
  useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
  }, [handleNewMessage]);

  // Messages are sent with the REST API (validation, rate limit, clear errors).
  // The server then pushes them to everyone in the chat over the socket.
  const sendMessage = useCallback(async (conversationId, data) => {
    const res = await api.post('/messages', { conversationId, ...data });
    handleNewMessage(res.data); // show it right away, even if the socket event is slow
    return res.data;
  }, [handleNewMessage]);

  const createConversation = useCallback(async (participants, type, name = '') => {
    const res = await api.post('/conversations', { participants, type, name });
    addConversation(res.data);
    return res.data;
  }, [addConversation]);

  const openConversation = useCallback((conversationId) => {
    activeIdRef.current = conversationId;
    setActiveConversationId(conversationId);
    setReplyingTo(null);
  }, []);

  const closeConversation = useCallback(() => {
    activeIdRef.current = null;
    setActiveConversationId(null);
    setReplyingTo(null);
  }, []);

  // Opening a chat marks it as read
  useEffect(() => {
    activeIdRef.current = activeConversationId;
    if (activeConversationId) {
      markConversationRead(activeConversationId);
    }
  }, [activeConversationId, markConversationRead]);

  // Socket listeners — registered once per connection
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => handleNewMessageRef.current(msg);
    const onTypingStart = ({ conversationId, userId, userName }) => {
      setTypingUser(conversationId, { userId, userName }, true);
    };
    const onTypingStop = ({ conversationId, userId }) => {
      setTypingUser(conversationId, { userId }, false);
    };
    const onReadUpdate = ({ conversationId, userId, readAt }) => {
      updateConversation(conversationId, c => withLastRead(c, userId, readAt));
    };
    const onRemoved = ({ conversationId }) => {
      removeConversation(conversationId);
    };
    // After a reconnect we may have missed messages: refresh the list,
    // and reload each chat's messages the next time it's shown
    const onReconnect = () => {
      fetchConversations();
      setMessageCache(prev => {
        const next = {};
        Object.keys(prev).forEach(id => { next[id] = { ...prev[id], loaded: false }; });
        return next;
      });
    };

    socket.on(MESSAGE_RECEIVE, onMessage);
    socket.on(TYPING_START, onTypingStart);
    socket.on(TYPING_STOP, onTypingStop);
    socket.on(MESSAGE_READ_UPDATE, onReadUpdate);
    socket.on(CONVERSATION_CREATED, addConversation);
    socket.on(CONVERSATION_UPDATED, replaceConversation);
    socket.on(CONVERSATION_REMOVED, onRemoved);
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off(MESSAGE_RECEIVE, onMessage);
      socket.off(TYPING_START, onTypingStart);
      socket.off(TYPING_STOP, onTypingStop);
      socket.off(MESSAGE_READ_UPDATE, onReadUpdate);
      socket.off(CONVERSATION_CREATED, addConversation);
      socket.off(CONVERSATION_UPDATED, replaceConversation);
      socket.off(CONVERSATION_REMOVED, onRemoved);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket, setTypingUser, updateConversation, addConversation, replaceConversation, removeConversation, fetchConversations]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      // Logged out: forget everything from the previous user
      setConversations([]);
      setActiveConversationId(null);
      setMessageCache({});
      setTypingUsers({});
      setReplyingTo(null);
    }
  }, [isAuthenticated, fetchConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      openConversation,
      closeConversation,
      replyingTo,
      setReplyingTo,
      messageCache,
      updateMessageCache,
      typingUsers,
      sendMessage,
      createConversation,
      replaceConversation,
      removeConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
