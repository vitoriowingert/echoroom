import { Request, Response } from 'express';
import { pinService } from '../services/pin.service';
import {
  NotFoundError,
  ValidationError,
  DatabaseError,
  parseDatabaseError,
} from '../utils/errors';

export async function pinMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id: messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      res.status(400).json({ error: 'Invalid message ID format' });
      return;
    }

    // Get message to find room_id
    const { supabaseAdminClient } = await import('../config/supabase');
    const { data: message, error: messageError } = await supabaseAdminClient
      .from('messages')
      .select('room_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const pinned = await pinService.pinMessage(messageId, message.room_id, userId);
    res.status(201).json(pinned);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in pinMessage:', { messageId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in pinMessage:', { messageId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to pin message';
    res.status(500).json({ error: message });
  }
}

export async function unpinMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id: messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      res.status(400).json({ error: 'Invalid message ID format' });
      return;
    }

    await pinService.unpinMessage(messageId, userId);
    res.status(200).json({ message: 'Message unpinned successfully' });
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
      console.error('Error in unpinMessage:', { messageId: req.params.id, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in unpinMessage:', { messageId: req.params.id, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to unpin message';
    res.status(500).json({ error: message });
  }
}

export async function getPinnedMessages(req: Request, res: Response): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      res.status(400).json({ error: 'Invalid room ID format' });
      return;
    }

    const pinnedMessages = await pinService.getPinnedMessages(roomId);
    res.json(pinnedMessages);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getPinnedMessages:', { roomId: req.params.roomId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getPinnedMessages:', { roomId: req.params.roomId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get pinned messages';
    res.status(500).json({ error: message });
  }
}

