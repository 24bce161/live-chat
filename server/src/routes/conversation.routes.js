import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  addParticipant,
  removeParticipant
} from '../controllers/conversation.controller.js';
import { protect } from '../middleware/auth.js';
import { validateConversation, validateParticipant, handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.post('/', protect, validateConversation, handleValidationErrors, createConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.put('/:id/participants', protect, validateParticipant, handleValidationErrors, addParticipant);
router.delete('/:id/participants/:userId', protect, removeParticipant);

export default router;
