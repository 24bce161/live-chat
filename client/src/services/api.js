import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A wrong password on the login form is also a 401 — that must NOT reload the page,
    // otherwise the "Invalid username or password" message disappears before it can be read.
    const isAuthForm = ['/auth/login', '/auth/signup'].includes(error.config?.url);

    // Otherwise a 401 means the saved token expired or is invalid: sign out
    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
