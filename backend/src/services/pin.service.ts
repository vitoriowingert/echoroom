import { supabaseAdminClient } from '../config/supabase';
import { DatabaseError, NotFoundError, ValidationError, parseDatabaseError } from '../utils/errors';
import { Message } from './supabase.service';

export interface PinnedMessage {
  id: string;
  message_id: string;
  room_id: string;
  pinned_by: string;
  pinned_at: string;
}

export class PinService {
  // Pin a message
  async pinMessage(messageId: string, roomId: string, userId: string): Promise<PinnedMessage> {
    // Verify message exists and is in the room
    const { data: message, error: messageError } = await supabaseAdminClient
      .from('messages')
      .select('id, room_id')
      .eq('id', messageId)
      .eq('room_id', roomId)
      .single();

    if (messageError || !message) {
      throw new NotFoundError(`Message ${messageId} not found in room ${roomId}`, 'message');
    }

    // Check if already pinned
    const { data: existing } = await supabaseAdminClient
      .from('pinned_messages')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existing) {
      throw new ValidationError('Message is already pinned');
    }

    // Pin the message
    const { data, error } = await supabaseAdminClient
      .from('pinned_messages')
      .insert({
        message_id: messageId,
        room_id: roomId,
        pinned_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to pin message');
    }

    if (!data) {
      throw new DatabaseError('Message pinning succeeded but no data returned');
    }

    return data as PinnedMessage;
  }

  // Unpin a message
  async unpinMessage(messageId: string, userId: string): Promise<void> {
    // Get pinned message
    const { data: pinned, error: pinnedError } = await supabaseAdminClient
      .from('pinned_messages')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (pinnedError || !pinned) {
      throw new NotFoundError('Pinned message not found', 'pinned_message');
    }

    // Check if user can unpin (they pinned it or are admin/owner)
    const { data: room } = await supabaseAdminClient
      .from('rooms')
      .select('server_id')
      .eq('id', pinned.room_id)
      .single();

    let canUnpin = pinned.pinned_by === userId;

    if (!canUnpin && room?.server_id) {
      // Check if user is admin or owner
      const { data: member } = await supabaseAdminClient
        .from('server_members')
        .select('role')
        .eq('server_id', room.server_id)
        .eq('user_id', userId)
        .single();

      canUnpin = member?.role === 'admin' || member?.role === 'owner';
    }

    if (!canUnpin) {
      throw new ValidationError('You do not have permission to unpin this message');
    }

    // Unpin
    const { error } = await supabaseAdminClient
      .from('pinned_messages')
      .delete()
      .eq('message_id', messageId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to unpin message');
    }
  }

  // Get pinned messages for a room
  async getPinnedMessages(roomId: string): Promise<Array<Message & { pinned_at: string; pinned_by: string }>> {
    const { data, error } = await supabaseAdminClient
      .from('pinned_messages')
      .select(`
        *,
        messages (
          id,
          room_id,
          user_id,
          content,
          message_type,
          metadata,
          file_url,
          file_name,
          file_size,
          file_type,
          thumbnail_url,
          created_at,
          updated_at,
          deleted_at
        )
      `)
      .eq('room_id', roomId)
      .order('pinned_at', { ascending: false });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get pinned messages');
    }

    if (!data) {
      return [];
    }

    // Transform the data
    return data.map((item: any) => ({
      ...item.messages,
      pinned_at: item.pinned_at,
      pinned_by: item.pinned_by,
    })) as Array<Message & { pinned_at: string; pinned_by: string }>;
  }

  // Check if a message is pinned
  async isMessagePinned(messageId: string): Promise<boolean> {
    const { data, error } = await supabaseAdminClient
      .from('pinned_messages')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw parseDatabaseError(error, 'Failed to check if message is pinned');
    }

    return !!data;
  }
}

export const pinService = new PinService();

