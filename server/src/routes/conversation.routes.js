import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  addParticipant,
  removeParticipant
} from '../controllers/conversation.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.put('/:id/participants', protect, addParticipant);
router.delete('/:id/participants/:userId', protect, removeParticipant);

export default router;
