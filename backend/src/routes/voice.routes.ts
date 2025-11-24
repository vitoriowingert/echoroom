import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getVoiceChannelParticipants, getVoiceChannelState } from '../controllers/voice.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/rooms/:roomId/participants', getVoiceChannelParticipants);
router.get('/rooms/:roomId/state', getVoiceChannelState);

export default router;

