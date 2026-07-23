import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { USER_ONLINE, USER_OFFLINE } from '../utils/socketEvents';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = createSocket(token);
      
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('[Socket] Connected');
      });
      
      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('[Socket] Disconnected');
      });

      newSocket.on('reconnect', () => {
        console.log('[Socket] Reconnected — refetching data');
      });

      newSocket.on('INITIAL_USERS', (users) => {
        const usersMap = {};
        users.forEach(id => usersMap[id] = true);
        setOnlineUsers(usersMap);
      });

      // Presence events — server sends { userId, status } objects
      newSocket.on(USER_ONLINE, ({ userId }) => {
        setOnlineUsers(prev => ({ ...prev, [userId]: true }));
      });

      newSocket.on(USER_OFFLINE, ({ userId }) => {
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });

      newSocket.connect();
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
