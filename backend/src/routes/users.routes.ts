import { Router } from 'express';
import {
  getCurrentUser,
  getUserById,
  getOnlineUsersInRoom,
  updateUserProfile,
} from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, getCurrentUser);
router.put('/me', authenticateToken, updateUserProfile);
router.get('/rooms/:roomId/online', authenticateToken, getOnlineUsersInRoom);
router.get('/:id', authenticateToken, getUserById);

export default router;

