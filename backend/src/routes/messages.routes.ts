import { Router } from 'express';
import {
  getMessagesByRoom,
  searchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  getMessagesByRooms,
} from '../controllers/messages.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Bulk message fetching (supports both GET and POST)
router.get('/messages/bulk', getMessagesByRooms);
router.post('/messages/bulk', getMessagesByRooms);

// Room-specific message routes
router.get('/rooms/:roomId/messages/search', searchMessages);
router.get('/rooms/:roomId/messages', getMessagesByRoom);
router.post('/rooms/:roomId/messages', createMessage);

// Message-specific routes
router.put('/messages/:messageId', updateMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;

