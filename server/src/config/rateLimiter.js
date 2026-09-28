import rateLimit from 'express-rate-limit';

// Tests and development fire many requests in a row, so strict limits are skipped there
const skipInDevOrTests = () => process.env.NODE_ENV !== 'production';

// Auth limiter: 100 requests per 15 minutes in production (skipped in development/test)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevOrTests,
});

// Message limiter: 30 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { message: 'Too many messages sent, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevOrTests,
});

// General limiter: 1000 API requests per 15 minutes.
// A chat app makes a lot of small requests (opening chats, read receipts), so this is kept generous.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevOrTests,
});
