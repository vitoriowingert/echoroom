import { Request, Response } from 'express';
import { messageService } from '../services/message.service';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
} from '../utils/errors';

export async function getMessagesByRoom(req: Request, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const messages = await messageService.getMessagesByRoom(roomId, limit, offset);
    res.json(messages);
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
    console.error('Error in getMessagesByRoom:', error);
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    res.status(500).json({ error: message });
  }
}

export async function searchMessages(req: Request, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const messages = await messageService.searchMessages(roomId, query, limit);
    res.json(messages);
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
    console.error('Error in searchMessages:', error);
    const message = error instanceof Error ? error.message : 'Failed to search messages';
    res.status(500).json({ error: message });
  }
}

export async function createMessage(req: Request, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate roomId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const { content, messageType, metadata } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const message = await messageService.createMessage({
      roomId,
      userId,
      content,
      messageType,
      metadata,
    });

    res.status(201).json(message);
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
    console.error('Error in createMessage:', { roomId: req.params.roomId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to create message';
    res.status(500).json({ error: message });
  }
}

export async function updateMessage(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate messageId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      res.status(400).json({ error: 'Invalid message ID format' });
      return;
    }

    const { content, metadata } = req.body;

    const message = await messageService.updateMessage(messageId, { content, metadata }, userId);
    res.json(message);
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
    console.error('Error in updateMessage:', { messageId: req.params.messageId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to update message';
    res.status(500).json({ error: message });
  }
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate messageId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      res.status(400).json({ error: 'Invalid message ID format' });
      return;
    }

    await messageService.deleteMessage(messageId, userId);
    res.status(204).send();
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
    console.error('Error in deleteMessage:', { messageId: req.params.messageId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to delete message';
    res.status(500).json({ error: message });
  }
}

export async function getMessagesByRooms(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let roomIds: string[] = [];
    let since: Date | undefined;

    // Support both GET (query params) and POST (body)
    if (req.method === 'POST') {
      const { roomIds: bodyRoomIds, since: bodySince } = req.body;
      roomIds = Array.isArray(bodyRoomIds) ? bodyRoomIds : [];
      if (bodySince) {
        since = new Date(bodySince);
        if (isNaN(since.getTime())) {
          res.status(400).json({ error: 'Invalid since timestamp format' });
          return;
        }
      }
    } else {
      // GET method
      const roomIdsParam = req.query.roomIds as string;
      if (roomIdsParam) {
        roomIds = roomIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
      }
      if (req.query.since) {
        since = new Date(req.query.since as string);
        if (isNaN(since.getTime())) {
          res.status(400).json({ error: 'Invalid since timestamp format' });
          return;
        }
      }
    }

    if (roomIds.length === 0) {
      res.status(400).json({ error: 'At least one room ID is required' });
      return;
    }

    const messages = await messageService.getMessagesByRooms(roomIds, since);
    res.json(messages);
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
    console.error('Error in getMessagesByRooms:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    res.status(500).json({ error: message });
  }
}

