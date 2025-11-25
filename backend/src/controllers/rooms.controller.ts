import { Request, Response } from 'express';
import { roomService, CreateRoomDto, UpdateRoomDto } from '../services/room.service';
import { serverService } from '../services/server.service';
import { supabaseService } from '../services/supabase.service';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  ConflictError,
} from '../utils/errors';

export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({ error: 'Room name exceeds maximum length of 255 characters' });
      return;
    }

    if (description && typeof description === 'string' && description.length > 5000) {
      res.status(400).json({ error: 'Room description exceeds maximum length of 5000 characters' });
      return;
    }

    const { serverId } = req.body;

    const dto: CreateRoomDto = {
      name: name.trim(),
      description: description?.trim() || undefined,
      createdBy: userId,
      serverId: serverId || undefined,
    };

    const room = await roomService.createRoom(dto);
    res.status(201).json(room);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in createRoom:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in createRoom:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to create room';
    res.status(500).json({ error: message });
  }
}

export async function getRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const room = await roomService.getRoomById(id);

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(room);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getRoom:', { roomId: req.params.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getRoom:', { roomId: req.params.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get room';
    res.status(500).json({ error: message });
  }
}

export async function getAllRooms(req: Request, res: Response): Promise<void> {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getAllRooms:', error);
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getAllRooms:', error);
    const message = error instanceof Error ? error.message : 'Failed to get rooms';
    res.status(500).json({ error: message });
  }
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const dto: UpdateRoomDto = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Room name must be a non-empty string' });
        return;
      }
      if (name.trim().length > 255) {
        res.status(400).json({ error: 'Room name exceeds maximum length of 255 characters' });
        return;
      }
      dto.name = name.trim();
    }
    if (description !== undefined) {
      if (description !== null && typeof description === 'string' && description.length > 5000) {
        res.status(400).json({ error: 'Room description exceeds maximum length of 5000 characters' });
        return;
      }
      dto.description = description?.trim() || undefined;
    }

    const room = await roomService.updateRoom(id, dto, userId);
    res.json(room);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in updateRoom:', { roomId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in updateRoom:', { roomId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to update room';
    res.status(500).json({ error: message });
  }
}

export async function deleteRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    await roomService.deleteRoom(id, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in deleteRoom:', { roomId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in deleteRoom:', { roomId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to delete room';
    res.status(500).json({ error: message });
  }
}

export async function joinRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    await roomService.joinRoom(id, userId);
    res.status(200).json({ message: 'Successfully joined room' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      // Already a member - treat as success
      res.status(200).json({ message: 'Already a member of this room' });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in joinRoom:', { roomId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in joinRoom:', { roomId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to join room';
    res.status(500).json({ error: message });
  }
}

export async function leaveRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    await roomService.leaveRoom(id, userId);
    res.status(200).json({ message: 'Successfully left room' });
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in leaveRoom:', { roomId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in leaveRoom:', { roomId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to leave room';
    res.status(500).json({ error: message });
  }
}

export async function getUserRooms(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rooms = await roomService.getUserRooms(userId);
    res.json(rooms);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getUserRooms:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getUserRooms:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get user rooms';
    res.status(500).json({ error: message });
  }
}

export async function createRoomForServer(req: Request, res: Response): Promise<void> {
  try {
    const { id: serverId } = req.params; // Route parameter is 'id' from '/:id/rooms'
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate serverId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(serverId)) {
      res.status(400).json({ error: 'Invalid server ID format' });
      return;
    }

    // Validate room name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({ error: 'Room name exceeds maximum length of 255 characters' });
      return;
    }

    if (description && typeof description === 'string' && description.length > 5000) {
      res.status(400).json({ error: 'Room description exceeds maximum length of 5000 characters' });
      return;
    }

    // Check if server exists
    const server = await serverService.getServerById(serverId);
    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Check if user is a member of the server
    const member = await supabaseService.getServerMember(serverId, userId);
    
    if (!member) {
      res.status(403).json({ error: 'You are not a member of this server' });
      return;
    }

    const dto: CreateRoomDto = {
      name: name.trim(),
      description: description?.trim() || undefined,
      createdBy: userId,
      serverId: serverId,
    };

    const room = await roomService.createRoom(dto);
    res.status(201).json(room);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in createRoomForServer:', { serverId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in createRoomForServer:', { serverId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to create room for server';
    res.status(500).json({ error: message });
  }
}

export async function getRoomsByServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params; // Route parameter is 'id' from '/:id/rooms'
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid server ID format' });
      return;
    }

    // Check if server exists
    const server = await serverService.getServerById(id);
    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    // Check if user is a member of the server
    const member = await supabaseService.getServerMember(id, userId);
    
    if (!member) {
      res.status(403).json({ error: 'You are not a member of this server' });
      return;
    }

    const rooms = await roomService.getRoomsByServer(id);
    res.json(rooms);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getRoomsByServer:', { serverId: req.params.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getRoomsByServer:', { serverId: req.params.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get rooms by server';
    res.status(500).json({ error: message });
  }
}

