import { supabaseService, Room } from './supabase.service';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export interface CreateRoomDto {
  name: string;
  description?: string;
  createdBy: string;
  serverId?: string;
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
}

export class RoomService {
  async createRoom(dto: CreateRoomDto): Promise<Room> {
    // Create room first
    const room = await supabaseService.createRoom(
      dto.name,
      dto.description || null,
      dto.createdBy,
      dto.serverId
    );

    try {
      // Automatically add creator as room member
      // This is idempotent - if member already exists, it will return the existing member
      await supabaseService.addRoomMember(room.id, dto.createdBy);
    } catch (error) {
      // If adding member fails, rollback by deleting the room
      try {
        await supabaseService.deleteRoom(room.id);
      } catch (deleteError) {
        // Log the rollback failure but throw the original error
        console.error(`Failed to rollback room creation for room ${room.id}:`, deleteError);
      }
      throw error;
    }

    return room;
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return await supabaseService.getRoomById(roomId);
  }

  async getAllRooms(): Promise<Room[]> {
    return await supabaseService.getAllRooms();
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto, userId: string): Promise<Room> {
    const room = await supabaseService.getRoomById(roomId);

    if (!room) {
      throw new NotFoundError(`Room ${roomId} not found`, 'room');
    }

    if (room.created_by !== userId) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to update room ${roomId}`,
        'room'
      );
    }

    return await supabaseService.updateRoom(roomId, dto);
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await supabaseService.getRoomById(roomId);

    if (!room) {
      throw new NotFoundError(`Room ${roomId} not found`, 'room');
    }

    if (room.created_by !== userId) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to delete room ${roomId}`,
        'room'
      );
    }

    await supabaseService.deleteRoom(roomId);
  }

  async joinRoom(roomId: string, userId: string): Promise<void> {
    const room = await supabaseService.getRoomById(roomId);

    if (!room) {
      throw new NotFoundError(`Room ${roomId} not found`, 'room');
    }

    // addRoomMember is now idempotent - it will return existing member if already exists
    await supabaseService.addRoomMember(roomId, userId);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await supabaseService.removeRoomMember(roomId, userId);
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return await supabaseService.getUserRooms(userId);
  }

  async getRoomsByServer(serverId: string): Promise<Room[]> {
    return await supabaseService.getRoomsByServer(serverId);
  }
}

export const roomService = new RoomService();

