import rateLimit from 'express-rate-limit';

// Auth limiter: 10 requests per 15 minutes (for login/signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message limiter: 30 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { message: 'Too many messages sent, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
