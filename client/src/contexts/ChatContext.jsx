import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
import {
  MESSAGE_RECEIVE,
  MESSAGE_READ,
  MESSAGE_READ_UPDATE,
  TYPING_START,
  TYPING_STOP,
  CONVERSATION_CREATED
} from '../utils/socketEvents';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { isAuthenticated } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (conversationId, before) => {
    try {
      const params = before ? { before } : {};
      const res = await api.get(`/messages/${conversationId}`, { params });
      return res.data;
    } catch (error) {
      console.error('Failed to fetch messages', error);
      return { messages: [], hasMore: false };
    }
  }, []);

  const addMessage = useCallback((message) => {
    const convId = message.conversationId;
    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), message]
    }));
  }, []);

  const updateUnreadCount = useCallback((conversationId, count) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: count
    }));
  }, []);

  const setTypingUser = useCallback((conversationId, user, isTyping) => {
    setTypingUsers(prev => {
      const currentTyping = prev[conversationId] || [];
      if (isTyping) {
        if (!currentTyping.find(u => u.userId === user.userId)) {
          return { ...prev, [conversationId]: [...currentTyping, user] };
        }
        return prev;
      } else {
        return { ...prev, [conversationId]: currentTyping.filter(u => u.userId !== user.userId) };
      }
    });
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    try {
      // Use REST API endpoint
      await api.put(`/messages/read/${conversationId}`);
      updateUnreadCount(conversationId, 0);
      // Also emit socket event for real-time read receipt broadcast
      if (socket) {
        socket.emit(MESSAGE_READ, { conversationId });
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  }, [updateUnreadCount, socket]);

  const createConversation = useCallback(async (participants, type, name = '') => {
    try {
      const res = await api.post('/conversations', { participants, type, name });
      fetchConversations();
      return res.data;
    } catch (error) {
      console.error('Failed to create conversation', error);
      throw error;
    }
  }, [fetchConversations]);

  // Socket event listeners — using correct colon-separated event names
  useEffect(() => {
    if (socket) {
      socket.on(MESSAGE_RECEIVE, (message) => {
        addMessage(message);
        
        // Update conversation's lastMessage and re-sort
        setConversations(prev => {
          const idx = prev.findIndex(c => c._id === message.conversationId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], lastMessage: { text: message.text, sender: message.senderId, createdAt: message.createdAt } };
            return updated.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
          }
          return prev;
        });

        // Increment unread if not the active conversation
        if (activeConversation?._id !== message.conversationId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.conversationId]: (prev[message.conversationId] || 0) + 1
          }));
        } else {
          // Auto-mark as read if conversation is active
          markConversationRead(message.conversationId);
        }
      });

      socket.on(TYPING_START, ({ conversationId, userId, userName }) => {
        setTypingUser(conversationId, { userId, userName }, true);
      });

      socket.on(TYPING_STOP, ({ conversationId, userId }) => {
        setTypingUser(conversationId, { userId }, false);
      });

      socket.on(MESSAGE_READ_UPDATE, ({ conversationId, userId, readAt }) => {
        // Update all messages in this conversation to include the new reader
        setMessages(prev => {
          const convMsgs = prev[conversationId];
          if (!convMsgs) return prev;
          return {
            ...prev,
            [conversationId]: convMsgs.map(msg => {
              const alreadyRead = msg.readBy?.some(r => r.user === userId || r.user?._id === userId);
              if (alreadyRead) return msg;
              return { ...msg, readBy: [...(msg.readBy || []), { user: userId, readAt }] };
            })
          };
        });
      });

      socket.on(CONVERSATION_CREATED, (conversation) => {
        setConversations(prev => [conversation, ...prev]);
      });

      return () => {
        socket.off(MESSAGE_RECEIVE);
        socket.off(TYPING_START);
        socket.off(TYPING_STOP);
        socket.off(MESSAGE_READ_UPDATE);
        socket.off(CONVERSATION_CREATED);
      };
    }
  }, [socket, activeConversation, addMessage, markConversationRead, setTypingUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      setActiveConversation,
      replyingTo,
      setReplyingTo,
      messages,
      setMessages,
      unreadCounts,
      typingUsers,
      fetchConversations,
      fetchMessages,
      addMessage,
      updateUnreadCount,
      setTypingUser,
      markConversationRead,
      createConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
