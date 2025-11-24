import request from 'supertest';
import express, { Express } from 'express';
import roomsRoutes from '../../routes/rooms.routes';
import { authenticateToken } from '../../middleware/auth.middleware';
import { roomService } from '../../services/room.service';

jest.mock('../../middleware/auth.middleware');
jest.mock('../../services/room.service');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

describe('Rooms Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockAuthenticateToken.mockImplementation((req, res, next) => {
      (req as any).user = { id: 'user-1' };
      next();
    });
    app.use('/api/rooms', roomsRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/rooms', () => {
    it('should create a room', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (roomService.createRoom as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send({ name: 'Test Room', description: 'Test Description' })
        .expect(201);

      expect(response.body).toEqual(mockRoom);
      expect(roomService.createRoom).toHaveBeenCalledWith({
        name: 'Test Room',
        description: 'Test Description',
        createdBy: 'user-1',
      });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ description: 'Test Description' })
        .expect(400);

      expect(response.body.error).toBe('Room name is required');
    });
  });

  describe('GET /api/rooms', () => {
    it('should get all rooms', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          name: 'Room 1',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'room-2',
          name: 'Room 2',
          created_by: 'user-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (roomService.getAllRooms as jest.Mock).mockResolvedValue(mockRooms);

      const response = await request(app).get('/api/rooms').expect(200);

      expect(response.body).toEqual(mockRooms);
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should get a room by id', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (roomService.getRoomById as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app).get('/api/rooms/room-1').expect(200);

      expect(response.body).toEqual(mockRoom);
    });

    it('should return 404 if room not found', async () => {
      (roomService.getRoomById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/rooms/non-existent').expect(404);

      expect(response.body.error).toBe('Room not found');
    });
  });

  describe('PUT /api/rooms/:id', () => {
    it('should update a room', async () => {
      const updatedRoom = {
        id: 'room-1',
        name: 'Updated Room',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (roomService.updateRoom as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room-1')
        .send({ name: 'Updated Room' })
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should delete a room', async () => {
      (roomService.deleteRoom as jest.Mock).mockResolvedValue(undefined);

      await request(app).delete('/api/rooms/room-1').expect(204);

      expect(roomService.deleteRoom).toHaveBeenCalledWith('room-1', 'user-1');
    });
  });
});

