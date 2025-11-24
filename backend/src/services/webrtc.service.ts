import { supabaseAdminClient } from '../config/supabase';
import { DatabaseError, NotFoundError, parseDatabaseError } from '../utils/errors';

export interface VoiceParticipant {
  id: string;
  room_id: string;
  user_id: string;
  is_muted: boolean;
  is_deafened: boolean;
  is_video_enabled: boolean;
  is_screen_sharing: boolean;
  joined_at: string;
  updated_at: string;
}

export interface VoiceChannelState {
  id: string;
  room_id: string;
  created_at: string;
  updated_at: string;
}

export class WebRTCService {
  // Get or create voice channel state
  async getOrCreateVoiceChannelState(roomId: string): Promise<VoiceChannelState> {
    // Check if state exists
    const { data: existing, error: selectError } = await supabaseAdminClient
      .from('voice_channel_state')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (existing) {
      return existing as VoiceChannelState;
    }

    // Create new state
    const { data, error } = await supabaseAdminClient
      .from('voice_channel_state')
      .insert({
        room_id: roomId,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to create voice channel state');
    }

    if (!data) {
      throw new DatabaseError('Voice channel state creation succeeded but no data returned');
    }

    return data as VoiceChannelState;
  }

  // Join voice channel
  async joinVoiceChannel(roomId: string, userId: string): Promise<VoiceParticipant> {
    // Verify room exists and is a voice channel
    const { data: room, error: roomError } = await supabaseAdminClient
      .from('rooms')
      .select('id, channel_type')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      throw new NotFoundError(`Room ${roomId} not found`, 'room');
    }

    if (room.channel_type !== 'voice') {
      throw new DatabaseError('Room is not a voice channel');
    }

    // Check if user is already in voice channel
    const { data: existing } = await supabaseAdminClient
      .from('voice_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return existing as VoiceParticipant;
    }

    // Create voice channel state if it doesn't exist
    await this.getOrCreateVoiceChannelState(roomId);

    // Add participant
    const { data, error } = await supabaseAdminClient
      .from('voice_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        is_muted: false,
        is_deafened: false,
        is_video_enabled: false,
        is_screen_sharing: false,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to join voice channel');
    }

    if (!data) {
      throw new DatabaseError('Voice participant creation succeeded but no data returned');
    }

    return data as VoiceParticipant;
  }

  // Leave voice channel
  async leaveVoiceChannel(roomId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('voice_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to leave voice channel');
    }

    // Check if channel is empty, remove state if so
    const { data: participants } = await supabaseAdminClient
      .from('voice_participants')
      .select('id')
      .eq('room_id', roomId)
      .limit(1);

    if (!participants || participants.length === 0) {
      await supabaseAdminClient
        .from('voice_channel_state')
        .delete()
        .eq('room_id', roomId);
    }
  }

  // Get voice channel participants
  async getVoiceChannelParticipants(roomId: string): Promise<VoiceParticipant[]> {
    const { data, error } = await supabaseAdminClient
      .from('voice_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get voice channel participants');
    }

    return (data || []) as VoiceParticipant[];
  }

  // Update participant state (mute, deafen, video, screen share)
  async updateParticipantState(
    roomId: string,
    userId: string,
    updates: {
      is_muted?: boolean;
      is_deafened?: boolean;
      is_video_enabled?: boolean;
      is_screen_sharing?: boolean;
    }
  ): Promise<VoiceParticipant> {
    const { data, error } = await supabaseAdminClient
      .from('voice_participants')
      .update(updates)
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to update participant state');
    }

    if (!data) {
      throw new NotFoundError('Voice participant not found', 'voice_participant');
    }

    return data as VoiceParticipant;
  }

  // Get participant by room and user
  async getParticipant(roomId: string, userId: string): Promise<VoiceParticipant | null> {
    const { data, error } = await supabaseAdminClient
      .from('voice_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get participant');
    }

    return data as VoiceParticipant;
  }
}

export const webrtcService = new WebRTCService();

