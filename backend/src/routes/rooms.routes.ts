import { Router } from 'express';
import {
  createRoom,
  getRoom,
  getAllRooms,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getUserRooms,
  getRoomsByServer,
} from '../controllers/rooms.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createRoom);
router.get('/', getAllRooms);
router.get('/my-rooms', getUserRooms);
router.get('/:id', getRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);

export default router;

