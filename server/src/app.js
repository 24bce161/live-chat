import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import messageRoutes from './routes/message.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { generalLimiter } from './config/rateLimiter.js';
import { notFound, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Hosts like Render sit behind a proxy. Trusting it gives us the real client IP
// (for rate limiting) and the real protocol (for upload URLs).
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin for uploads
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
].filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permit requests from local, mobile, and deployed origins seamlessly
    callback(null, true);
  },
  credentials: true
});

app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files — served before the rate limiter so images in a chat don't use up the limit
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
