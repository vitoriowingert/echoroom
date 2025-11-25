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
import { getRoomsByServer, createRoomForServer } from '../controllers/rooms.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createServer);
router.get('/user', getUserServers);
router.get('/discover', getAllServers);
// More specific routes must come before general /:id route
router.get('/:id/rooms', getRoomsByServer);
router.post('/:id/rooms', createRoomForServer);
router.post('/:id/join', joinServer);
router.post('/:id/leave', leaveServer);
router.get('/:id', getServer);
router.put('/:id', updateServer);
router.delete('/:id', deleteServer);

export default router;

