import { supabaseAdminClient } from '../config/supabase';
import { parseDatabaseError } from '../utils/errors';

export interface UserRoomRead {
  id: string;
  user_id: string;
  room_id: string;
  last_read_message_id?: string;
  last_read_at: string;
  updated_at: string;
}

export class UnreadService {
  /**
   * Mark room as read for user
   */
  async markRoomAsRead(userId: string, roomId: string, messageId?: string): Promise<UserRoomRead> {
    const { data, error } = await supabaseAdminClient
      .from('user_room_reads')
      .upsert(
        {
          user_id: userId,
          room_id: roomId,
          last_read_message_id: messageId,
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,room_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to mark room as read');
    }

    if (!data) {
      throw new Error('Mark as read succeeded but no data returned');
    }

    return data as UserRoomRead;
  }

  /**
   * Get unread count for a room
   */
  async getUnreadCount(userId: string, roomId: string): Promise<number> {
    const { data, error } = await supabaseAdminClient.rpc('get_unread_count', {
      p_user_id: userId,
      p_room_id: roomId,
    });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get unread count');
    }

    return (data as number) || 0;
  }

  /**
   * Get unread counts for multiple rooms
   */
  async getUnreadCounts(userId: string, roomIds: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    // Get counts in parallel
    const promises = roomIds.map(async (roomId) => {
      try {
        const count = await this.getUnreadCount(userId, roomId);
        return { roomId, count };
      } catch (error) {
        console.error(`Failed to get unread count for room ${roomId}:`, error);
        return { roomId, count: 0 };
      }
    });

    const results = await Promise.all(promises);
    for (const { roomId, count } of results) {
      counts[roomId] = count;
    }

    return counts;
  }

  /**
   * Get last read timestamp for a room
   */
  async getLastRead(userId: string, roomId: string): Promise<string | null> {
    const { data, error } = await supabaseAdminClient
      .from('user_room_reads')
      .select('last_read_at')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get last read');
    }

    return data?.last_read_at || null;
  }
}

export const unreadService = new UnreadService();

