import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { pinMessage, unpinMessage, getPinnedMessages } from '../controllers/pin.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/messages/:id/pin', pinMessage);
router.delete('/messages/:id/pin', unpinMessage);
router.get('/rooms/:roomId/pinned', getPinnedMessages);

export default router;

