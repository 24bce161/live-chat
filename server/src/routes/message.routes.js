import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.js';
import { validateMessage, handleValidationErrors } from '../middleware/validate.js';
import { messageLimiter } from '../config/rateLimiter.js';

const router = express.Router();

router.post('/', protect, messageLimiter, validateMessage, handleValidationErrors, sendMessage);
router.get('/:conversationId', protect, getMessages);
router.put('/read/:conversationId', protect, markAsRead);

export default router;
