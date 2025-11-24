import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { reactionService } from '../services/reaction.service';
import { ValidationError, NotFoundError } from '../utils/errors';

export async function getMessageReactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const reactions = await reactionService.getMessageReactions(messageId);
    const counts = await reactionService.getReactionCounts(messageId);

    res.json({
      reactions,
      counts,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in getMessageReactions:', error);
    const message = error instanceof Error ? error.message : 'Failed to get reactions';
    res.status(500).json({ error: message });
  }
}

export async function addReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const reaction = await reactionService.addReaction(messageId, userId, emoji);
    const counts = await reactionService.getReactionCounts(messageId);

    res.json({
      reaction,
      counts,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in addReaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to add reaction';
    res.status(500).json({ error: message });
  }
}

export async function removeReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    await reactionService.removeReaction(messageId, userId, emoji);
    const counts = await reactionService.getReactionCounts(messageId);

    res.json({ counts });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in removeReaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove reaction';
    res.status(500).json({ error: message });
  }
}

export async function toggleReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const result = await reactionService.toggleReaction(messageId, userId, emoji);
    const counts = await reactionService.getReactionCounts(messageId);

    res.json({
      ...result,
      counts,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in toggleReaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to toggle reaction';
    res.status(500).json({ error: message });
  }
}

