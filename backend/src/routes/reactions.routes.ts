import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getMessageReactions,
  addReaction,
  removeReaction,
  toggleReaction,
} from '../controllers/reactions.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/messages/:messageId', getMessageReactions);
router.post('/messages/:messageId', addReaction);
router.delete('/messages/:messageId', removeReaction);
router.put('/messages/:messageId/toggle', toggleReaction);

export default router;

