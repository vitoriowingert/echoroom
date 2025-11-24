import { Request, Response } from 'express';
import { serverService, CreateServerDto, UpdateServerDto } from '../services/server.service';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  ConflictError,
} from '../utils/errors';

export async function createServer(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, iconUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Server name is required' });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({ error: 'Server name exceeds maximum length of 255 characters' });
      return;
    }

    if (description && typeof description === 'string' && description.length > 5000) {
      res.status(400).json({ error: 'Server description exceeds maximum length of 5000 characters' });
      return;
    }

    const dto: CreateServerDto = {
      name: name.trim(),
      description: description?.trim() || undefined,
      iconUrl: iconUrl?.trim() || undefined,
      createdBy: userId,
    };

    const server = await serverService.createServer(dto);
    res.status(201).json(server);
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
      console.error('Error in createServer:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in createServer:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to create server';
    res.status(500).json({ error: message });
  }
}

export async function getServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid server ID format' });
      return;
    }

    const server = await serverService.getServerById(id);

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    res.json(server);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getServer:', { serverId: req.params.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getServer:', { serverId: req.params.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get server';
    res.status(500).json({ error: message });
  }
}

export async function getUserServers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const servers = await serverService.getUserServers(userId);
    res.json(servers);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getUserServers:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getUserServers:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get user servers';
    res.status(500).json({ error: message });
  }
}

export async function getAllServers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all servers and check which ones the user is already a member of
    const allServers = await serverService.getAllServers();
    const userServers = await serverService.getUserServers(userId);
    const userServerIds = new Set(userServers.map(s => s.id));

    // Add a flag to indicate if user is already a member
    const serversWithMembership = allServers.map(server => ({
      ...server,
      isMember: userServerIds.has(server.id),
    }));

    res.json(serversWithMembership);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getAllServers:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getAllServers:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get servers';
    res.status(500).json({ error: message });
  }
}

export async function updateServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, iconUrl } = req.body;
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

    const dto: UpdateServerDto = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Server name must be a non-empty string' });
        return;
      }
      if (name.trim().length > 255) {
        res.status(400).json({ error: 'Server name exceeds maximum length of 255 characters' });
        return;
      }
      dto.name = name.trim();
    }
    if (description !== undefined) {
      if (description !== null && typeof description === 'string' && description.length > 5000) {
        res.status(400).json({ error: 'Server description exceeds maximum length of 5000 characters' });
        return;
      }
      dto.description = description?.trim() || undefined;
    }
    if (iconUrl !== undefined) {
      dto.iconUrl = iconUrl?.trim() || undefined;
    }

    const server = await serverService.updateServer(id, dto, userId);
    res.json(server);
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
      console.error('Error in updateServer:', { serverId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in updateServer:', { serverId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to update server';
    res.status(500).json({ error: message });
  }
}

export async function deleteServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
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

    await serverService.deleteServer(id, userId);
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
      console.error('Error in deleteServer:', { serverId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in deleteServer:', { serverId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to delete server';
    res.status(500).json({ error: message });
  }
}

export async function joinServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
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

    await serverService.joinServer(id, userId);
    res.status(200).json({ message: 'Successfully joined server' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(200).json({ message: 'Already a member of this server' });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in joinServer:', { serverId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in joinServer:', { serverId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to join server';
    res.status(500).json({ error: message });
  }
}

export async function leaveServer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
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

    await serverService.leaveServer(id, userId);
    res.status(200).json({ message: 'Successfully left server' });
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in leaveServer:', { serverId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in leaveServer:', { serverId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to leave server';
    res.status(500).json({ error: message });
  }
}

