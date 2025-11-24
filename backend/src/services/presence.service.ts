import { supabaseAdminClient } from '../config/supabase';
import { parseDatabaseError } from '../utils/errors';

export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy';

export interface UserPresence {
  id: string;
  user_id: string;
  status: PresenceStatus;
  last_seen: string;
  updated_at: string;
}

export class PresenceService {
  /**
   * Update user presence status
   */
  async updatePresence(userId: string, status: PresenceStatus): Promise<UserPresence> {
    const { data, error } = await supabaseAdminClient
      .from('user_presence')
      .upsert(
        {
          user_id: userId,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to update presence');
    }

    if (!data) {
      throw new Error('Presence update succeeded but no data returned');
    }

    return data as UserPresence;
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<UserPresence | null> {
    const { data, error } = await supabaseAdminClient
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get presence');
    }

    return data as UserPresence | null;
  }

  /**
   * Get multiple users' presence
   */
  async getPresences(userIds: string[]): Promise<UserPresence[]> {
    if (userIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseAdminClient
      .from('user_presence')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      throw parseDatabaseError(error, 'Failed to get presences');
    }

    return (data || []) as UserPresence[];
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<UserPresence[]> {
    const { data, error } = await supabaseAdminClient
      .from('user_presence')
      .select('*')
      .eq('status', 'online')
      .order('updated_at', { ascending: false });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get online users');
    }

    return (data || []) as UserPresence[];
  }

  /**
   * Mark user as offline (called on disconnect)
   */
  async setOffline(userId: string): Promise<void> {
    await this.updatePresence(userId, 'offline');
  }

  /**
   * Mark user as online (called on connect)
   */
  async setOnline(userId: string): Promise<void> {
    await this.updatePresence(userId, 'online');
  }
}

export const presenceService = new PresenceService();

