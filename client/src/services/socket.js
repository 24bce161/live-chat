import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

export const createSocket = (token) => {
  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
};
