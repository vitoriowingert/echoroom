import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createInvite,
  getServerInvites,
  getInviteByCode,
  acceptInvite,
  deleteInvite,
} from '../controllers/invite.controller';

const router = Router();

// All routes require authentication except getInviteByCode
router.get('/:code', getInviteByCode);

// Routes that require authentication
router.use(authenticateToken);

router.post('/servers/:serverId/invites', createInvite);
router.get('/servers/:serverId/invites', getServerInvites);
router.post('/:code/accept', acceptInvite);
router.delete('/:inviteId', deleteInvite);

export default router;

