import rateLimit from 'express-rate-limit';

// Tests fire many requests in a row, so limits are switched off there
const skipInTests = () => process.env.NODE_ENV === 'test';

// Auth limiter: 10 requests per 15 minutes (for login/signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});

// Message limiter: 30 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { message: 'Too many messages sent, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});

// General limiter: 1000 API requests per 15 minutes.
// A chat app makes a lot of small requests (opening chats, read receipts), so this is kept generous.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});
