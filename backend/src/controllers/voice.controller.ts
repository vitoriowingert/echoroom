import { Request, Response } from 'express';
import { webrtcService } from '../services/webrtc.service';
import {
  NotFoundError,
  DatabaseError,
  parseDatabaseError,
} from '../utils/errors';

export async function getVoiceChannelParticipants(req: Request, res: Response): Promise<void> {
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

    const participants = await webrtcService.getVoiceChannelParticipants(roomId);
    res.json(participants);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getVoiceChannelParticipants:', { roomId: req.params.roomId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getVoiceChannelParticipants:', { roomId: req.params.roomId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get voice channel participants';
    res.status(500).json({ error: message });
  }
}

export async function getVoiceChannelState(req: Request, res: Response): Promise<void> {
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

    const state = await webrtcService.getOrCreateVoiceChannelState(roomId);
    res.json(state);
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Error in getVoiceChannelState:', { roomId: req.params.roomId, userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getVoiceChannelState:', { roomId: req.params.roomId, userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get voice channel state';
    res.status(500).json({ error: message });
  }
}

