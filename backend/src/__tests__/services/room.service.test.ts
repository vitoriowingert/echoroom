import { RoomService } from '../../services/room.service';
import { supabaseService } from '../../services/supabase.service';

jest.mock('../../services/supabase.service');

describe('RoomService', () => {
  let roomService: RoomService;
  const mockSupabaseService = supabaseService as jest.Mocked<typeof supabaseService>;

  beforeEach(() => {
    roomService = new RoomService();
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room and add creator as member', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.createRoom.mockResolvedValue(mockRoom);
      mockSupabaseService.addRoomMember.mockResolvedValue({
        id: 'member-1',
        room_id: 'room-1',
        user_id: 'user-1',
        joined_at: new Date().toISOString(),
      });

      const result = await roomService.createRoom({
        name: 'Test Room',
        description: 'Test Description',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockRoom);
      expect(mockSupabaseService.createRoom).toHaveBeenCalledWith(
        'Test Room',
        'Test Description',
        'user-1'
      );
      expect(mockSupabaseService.addRoomMember).toHaveBeenCalledWith('room-1', 'user-1');
    });
  });

  describe('getRoomById', () => {
    it('should return a room by id', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);

      const result = await roomService.getRoomById('room-1');

      expect(result).toEqual(mockRoom);
      expect(mockSupabaseService.getRoomById).toHaveBeenCalledWith('room-1');
    });

    it('should return null if room not found', async () => {
      mockSupabaseService.getRoomById.mockResolvedValue(null);

      const result = await roomService.getRoomById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateRoom', () => {
    it('should update room if user is creator', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedRoom = { ...mockRoom, name: 'Updated Room' };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);
      mockSupabaseService.updateRoom.mockResolvedValue(updatedRoom);

      const result = await roomService.updateRoom('room-1', { name: 'Updated Room' }, 'user-1');

      expect(result).toEqual(updatedRoom);
      expect(mockSupabaseService.updateRoom).toHaveBeenCalledWith('room-1', {
        name: 'Updated Room',
      });
    });

    it('should throw error if user is not creator', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);

      await expect(
        roomService.updateRoom('room-1', { name: 'Updated Room' }, 'user-2')
      ).rejects.toThrow('Unauthorized: Only room creator can update the room');
    });

    it('should throw error if room not found', async () => {
      mockSupabaseService.getRoomById.mockResolvedValue(null);

      await expect(
        roomService.updateRoom('non-existent', { name: 'Updated Room' }, 'user-1')
      ).rejects.toThrow('Room not found');
    });
  });

  describe('deleteRoom', () => {
    it('should delete room if user is creator', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);
      mockSupabaseService.deleteRoom.mockResolvedValue();

      await roomService.deleteRoom('room-1', 'user-1');

      expect(mockSupabaseService.deleteRoom).toHaveBeenCalledWith('room-1');
    });

    it('should throw error if user is not creator', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);

      await expect(roomService.deleteRoom('room-1', 'user-2')).rejects.toThrow(
        'Unauthorized: Only room creator can delete the room'
      );
    });
  });

  describe('joinRoom', () => {
    it('should add user to room if not already a member', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);
      mockSupabaseService.getRoomMembers.mockResolvedValue([]);
      mockSupabaseService.addRoomMember.mockResolvedValue({
        id: 'member-1',
        room_id: 'room-1',
        user_id: 'user-2',
        joined_at: new Date().toISOString(),
      });

      await roomService.joinRoom('room-1', 'user-2');

      expect(mockSupabaseService.addRoomMember).toHaveBeenCalledWith('room-1', 'user-2');
    });

    it('should not add user if already a member', async () => {
      const mockRoom = {
        id: 'room-1',
        name: 'Test Room',
        description: 'Test Description',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomById.mockResolvedValue(mockRoom);
      mockSupabaseService.getRoomMembers.mockResolvedValue([
        {
          id: 'member-1',
          room_id: 'room-1',
          user_id: 'user-2',
          joined_at: new Date().toISOString(),
        },
      ]);

      await roomService.joinRoom('room-1', 'user-2');

      expect(mockSupabaseService.addRoomMember).not.toHaveBeenCalled();
    });
  });
});

