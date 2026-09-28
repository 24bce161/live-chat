import express from 'express';
import { getProfile, searchUsers, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validateProfile, handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.get('/profile/:id', protect, getProfile);
router.get('/search', protect, searchUsers);
router.put('/profile', protect, validateProfile, handleValidationErrors, updateProfile);

export default router;
