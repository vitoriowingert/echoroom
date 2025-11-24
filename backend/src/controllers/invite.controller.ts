import { Request, Response } from 'express';
import { inviteService, CreateInviteDto } from '../services/invite.service';
import {
  NotFoundError,
  ValidationError,
  DatabaseError,
  parseDatabaseError,
} from '../utils/errors';

export async function createInvite(req: Request, res: Response): Promise<void> {
  try {
    const { serverId } = req.params;
    const { expiresAt, maxUses } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(serverId)) {
      res.status(400).json({ error: 'Invalid server ID format' });
      return;
    }

    const dto: CreateInviteDto = {
      serverId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
    };

    if (dto.maxUses && (dto.maxUses < 1 || dto.maxUses > 1000)) {
      res.status(400).json({ error: 'Max uses must be between 1 and 1000' });
      return;
    }

    const invite = await inviteService.createInvite(userId, dto);
    res.status(201).json(invite);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in createInvite:', { serverId: req.params.serverId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in createInvite:', { serverId: req.params.serverId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to create invite';
    res.status(500).json({ error: message });
  }
}

export async function getServerInvites(req: Request, res: Response): Promise<void> {
  try {
    const { serverId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(serverId)) {
      res.status(400).json({ error: 'Invalid server ID format' });
      return;
    }

    const invites = await inviteService.getServerInvites(serverId, userId);
    res.json(invites);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getServerInvites:', { serverId: req.params.serverId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getServerInvites:', { serverId: req.params.serverId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get server invites';
    res.status(500).json({ error: message });
  }
}

export async function getInviteByCode(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;

    if (!code || code.length < 4 || code.length > 20) {
      res.status(400).json({ error: 'Invalid invite code format' });
      return;
    }

    const invite = await inviteService.getInviteByCode(code);

    if (!invite) {
      res.status(404).json({ error: 'Invite code not found' });
      return;
    }

    // Validate invite
    const validation = await inviteService.validateInvite(code);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Invalid invite code' });
      return;
    }

    res.json(invite);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getInviteByCode:', { code: req.params.code, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getInviteByCode:', { code: req.params.code, error });
    const message = error instanceof Error ? error.message : 'Failed to get invite';
    res.status(500).json({ error: message });
  }
}

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!code || code.length < 4 || code.length > 20) {
      res.status(400).json({ error: 'Invalid invite code format' });
      return;
    }

    await inviteService.acceptInvite(code, userId);
    res.status(200).json({ message: 'Successfully joined server' });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in acceptInvite:', { code: req.params.code, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in acceptInvite:', { code: req.params.code, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to accept invite';
    res.status(500).json({ error: message });
  }
}

export async function deleteInvite(req: Request, res: Response): Promise<void> {
  try {
    const { inviteId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inviteId)) {
      res.status(400).json({ error: 'Invalid invite ID format' });
      return;
    }

    await inviteService.deleteInvite(inviteId, userId);
    res.status(200).json({ message: 'Invite deleted successfully' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in deleteInvite:', { inviteId: req.params.inviteId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in deleteInvite:', { inviteId: req.params.inviteId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to delete invite';
    res.status(500).json({ error: message });
  }
}

