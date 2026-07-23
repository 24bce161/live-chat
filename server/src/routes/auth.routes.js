import express from 'express';
import { signup, login, logout, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validateSignup, validateLogin, handleValidationErrors } from '../middleware/validate.js';
import { authLimiter } from '../config/rateLimiter.js';

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, handleValidationErrors, signup);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
