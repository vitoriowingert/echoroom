import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notifications.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread', getUnreadCount);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

export default router;

