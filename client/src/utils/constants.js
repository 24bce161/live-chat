export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
export const TYPING_TIMEOUT = 3000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — same limit as the server
