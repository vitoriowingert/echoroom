import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await notificationService.getUserNotifications(userId, limit, offset);
    res.json(notifications);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error('Error in getNotifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to get notifications';
    res.status(500).json({ error: message });
  }
}

export async function getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    const message = error instanceof Error ? error.message : 'Failed to get unread count';
    res.status(500).json({ error: message });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);
    res.json(notification);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in markAsRead:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
    res.status(500).json({ error: message });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
    res.status(500).json({ error: message });
  }
}

export async function deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { notificationId } = req.params;

    await notificationService.deleteNotification(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in deleteNotification:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    res.status(500).json({ error: message });
  }
}

