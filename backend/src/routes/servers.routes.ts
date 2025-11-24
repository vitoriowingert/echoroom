import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createServer,
  getServer,
  getUserServers,
  getAllServers,
  updateServer,
  deleteServer,
  joinServer,
  leaveServer,
} from '../controllers/servers.controller';
import { getRoomsByServer } from '../controllers/rooms.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createServer);
router.get('/user', getUserServers);
router.get('/discover', getAllServers);
router.get('/:id', getServer);
router.get('/:id/rooms', getRoomsByServer);
router.put('/:id', updateServer);
router.delete('/:id', deleteServer);
router.post('/:id/join', joinServer);
router.post('/:id/leave', leaveServer);

export default router;

