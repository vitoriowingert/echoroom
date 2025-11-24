import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  uploadMessageAttachment,
  uploadAvatar,
  uploadServerIcon,
  uploadMiddleware,
} from '../controllers/upload.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Message attachment upload
router.post('/rooms/:roomId/attachments', uploadMiddleware, uploadMessageAttachment);

// Avatar upload
router.post('/users/avatar', uploadMiddleware, uploadAvatar);

// Server icon upload
router.post('/servers/:serverId/icon', uploadMiddleware, uploadServerIcon);

export default router;

