import { createContext, useContext, useEffect, useState } from 'react';
import { createSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { ONLINE_USERS, USER_ONLINE, USER_OFFLINE } from '../utils/socketEvents';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: true }
  const [lastSeen, setLastSeen] = useState({});       // { userId: date } — updated live when someone goes offline

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const newSocket = createSocket(token);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on(ONLINE_USERS, (userIds) => {
      const usersMap = {};
      userIds.forEach(id => { usersMap[id] = true; });
      setOnlineUsers(usersMap);
    });

    newSocket.on(USER_ONLINE, ({ userId }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: true }));
    });

    newSocket.on(USER_OFFLINE, ({ userId, lastSeen: seenAt }) => {
      setOnlineUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setLastSeen(prev => ({ ...prev, [userId]: seenAt }));
    });

    newSocket.connect();
    setSocket(newSocket);

    // Runs on logout (or token change): close the connection and reset everything
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers({});
      setLastSeen({});
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, lastSeen }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
