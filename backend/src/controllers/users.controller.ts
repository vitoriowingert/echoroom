import { Request, Response } from 'express';
import { supabaseAdminClient } from '../config/supabase';
import { userService } from '../services/user.service';
import { supabaseService } from '../services/supabase.service';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '../utils/errors';

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await userService.getUserProfile(userId);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getCurrentUser:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getCurrentUser:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const profile = await userService.getUserProfile(id);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getUserById:', { userId: req.params.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getUserById:', { userId: req.params.id, error });
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
}

export async function getOnlineUsersInRoom(req: Request, res: Response): Promise<void> {
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

    // Check if user is a member of the room
    const member = await supabaseService.getRoomMember(roomId, userId);
    
    if (!member) {
      res.status(403).json({ error: 'You are not a member of this room' });
      return;
    }

    const users = await userService.getOnlineUsersInRoom(roomId);
    res.json(users);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in getOnlineUsersInRoom:', { roomId: req.params.roomId, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in getOnlineUsersInRoom:', { roomId: req.params.roomId, error });
    const message = error instanceof Error ? error.message : 'Failed to get online users';
    res.status(500).json({ error: message });
  }
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { username, avatar, preferences } = req.body;

    const updates: {
      username?: string;
      avatar?: string;
      preferences?: any;
    } = {};

    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        res.status(400).json({ error: 'Username must be a non-empty string' });
        return;
      }
      if (username.trim().length > 100) {
        res.status(400).json({ error: 'Username exceeds maximum length of 100 characters' });
        return;
      }
      updates.username = username.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        res.status(400).json({ error: 'Avatar must be a string' });
        return;
      }
      if (avatar.length > 500) {
        res.status(400).json({ error: 'Avatar URL exceeds maximum length of 500 characters' });
        return;
      }
      updates.avatar = avatar;
    }

    if (preferences !== undefined && preferences !== null) {
      // Validate preferences object structure
      if (typeof preferences === 'object' && !Array.isArray(preferences)) {
        updates.preferences = preferences;
      } else {
        res.status(400).json({ error: 'Preferences must be an object' });
        return;
      }
    }

    const updatedProfile = await userService.updateUserProfile(userId, updates);
    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof DatabaseError) {
      console.error('Error in updateUserProfile:', { userId: req.user?.id, error });
      res.status(500).json({ error: error.message });
      return;
    }
    console.error('Error in updateUserProfile:', { userId: req.user?.id, error });
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: message });
  }
}
