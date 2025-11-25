import { supabaseAdminClient } from '../config/supabase';
import { DatabaseError, NotFoundError, ConflictError, parseDatabaseError } from '../utils/errors';

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  server_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type?: string;
  metadata?: Record<string, unknown>;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export class SupabaseService {
  // Server operations
  async createServer(name: string, description: string | null, iconUrl: string | null, createdBy: string): Promise<Server> {
    const { data, error } = await supabaseAdminClient
      .from('servers')
      .insert({
        name,
        description,
        icon_url: iconUrl,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to create server');
    }

    if (!data) {
      throw new DatabaseError('Server creation succeeded but no data returned');
    }

    return data as Server;
  }

  async getServerById(serverId: string): Promise<Server | null> {
    const { data, error } = await supabaseAdminClient
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get server');
    }

    return data as Server | null;
  }

  async getAllServers(): Promise<Server[]> {
    const { data, error } = await supabaseAdminClient
      .from('servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get servers');
    }

    return (data || []) as Server[];
  }

  async getUserServers(userId: string): Promise<Server[]> {
    const { data, error } = await supabaseAdminClient
      .from('server_members')
      .select('servers(*)')
      .eq('user_id', userId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to get user servers');
    }

    return (data?.map((item: { servers: Server }) => item.servers) || []) as Server[];
  }

  async addServerMember(serverId: string, userId: string, role: string = 'member'): Promise<ServerMember> {
    const { data, error } = await supabaseAdminClient
      .from('server_members')
      .insert({
        server_id: serverId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      // If member already exists, return the existing member
      if (error.code === '23505') {
        const existing = await this.getServerMember(serverId, userId);
        if (existing) {
          return existing;
        }
      }
      throw parseDatabaseError(error, 'Failed to add server member');
    }

    if (!data) {
      throw new DatabaseError('Server member creation succeeded but no data returned');
    }

    return data as ServerMember;
  }

  async getServerMember(serverId: string, userId: string): Promise<ServerMember | null> {
    const { data, error } = await supabaseAdminClient
      .from('server_members')
      .select('*')
      .eq('server_id', serverId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get server member');
    }

    return data as ServerMember | null;
  }

  async removeServerMember(serverId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('server_members')
      .delete()
      .eq('server_id', serverId)
      .eq('user_id', userId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to remove server member');
    }
  }

  async getServerMembers(serverId: string): Promise<ServerMember[]> {
    const { data, error } = await supabaseAdminClient
      .from('server_members')
      .select('*')
      .eq('server_id', serverId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to get server members');
    }

    return (data || []) as ServerMember[];
  }

  async updateServer(serverId: string, updates: { name?: string; description?: string | null; icon_url?: string | null }): Promise<Server> {
    const { data, error } = await supabaseAdminClient
      .from('servers')
      .update(updates)
      .eq('id', serverId)
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to update server');
    }

    if (!data) {
      throw new DatabaseError('Server update succeeded but no data returned');
    }

    return data as Server;
  }

  async deleteServer(serverId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('servers')
      .delete()
      .eq('id', serverId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to delete server');
    }
  }

  // Room operations
  async createRoom(name: string, description: string | null, createdBy: string, serverId?: string): Promise<Room> {
    const { data, error } = await supabaseAdminClient
      .from('rooms')
      .insert({
        name,
        description,
        created_by: createdBy,
        server_id: serverId || null,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to create room');
    }

    if (!data) {
      throw new DatabaseError('Room creation succeeded but no data returned');
    }

    return data as Room;
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    const { data, error } = await supabaseAdminClient
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, `Failed to get room ${roomId}`);
    }

    return data as Room;
  }

  async getAllRooms(): Promise<Room[]> {
    const { data, error } = await supabaseAdminClient
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get rooms');
    }

    return (data || []) as Room[];
  }

  async getRoomsByServer(serverId: string): Promise<Room[]> {
    const { data, error } = await supabaseAdminClient
      .from('rooms')
      .select('*')
      .eq('server_id', serverId)
      .order('created_at', { ascending: true });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get rooms for server');
    }

    return (data || []) as Room[];
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room> {
    const { data, error } = await supabaseAdminClient
      .from('rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Room ${roomId} not found`, 'room');
      }
      throw parseDatabaseError(error, `Failed to update room ${roomId}`);
    }

    if (!data) {
      throw new NotFoundError(`Room ${roomId} not found`, 'room');
    }

    return data as Room;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      throw parseDatabaseError(error, `Failed to delete room ${roomId}`);
    }
  }

  // Message operations
  async createMessage(
    roomId: string,
    userId: string,
    content: string,
    messageType = 'text',
    metadata?: Record<string, unknown>,
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    fileType?: string,
    thumbnailUrl?: string
  ): Promise<Message> {
    const { data, error } = await supabaseAdminClient
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content,
        message_type: messageType,
        metadata,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, `Failed to create message in room ${roomId}`);
    }

    if (!data) {
      throw new DatabaseError('Message creation succeeded but no data returned');
    }

    return data as Message;
  }

  async getMessagesByRoom(roomId: string, limit = 100, offset = 0): Promise<Message[]> {
    const { data, error } = await supabaseAdminClient
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw parseDatabaseError(error, `Failed to get messages for room ${roomId}`);
    }

    return (data || []) as Message[];
  }

  async getMessagesByRooms(roomIds: string[], since?: Date): Promise<Message[]> {
    if (roomIds.length === 0) {
      return [];
    }

    let query = supabaseAdminClient
      .from('messages')
      .select('*')
      .in('room_id', roomIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gt('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw parseDatabaseError(error, `Failed to get messages for rooms ${roomIds.join(', ')}`);
    }

    return (data || []) as Message[];
  }

  async searchMessages(roomId: string, query: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabaseAdminClient
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw parseDatabaseError(error, `Failed to search messages in room ${roomId}`);
    }

    return (data || []) as Message[];
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabaseAdminClient
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, `Failed to get message ${messageId}`);
    }

    return data as Message;
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabaseAdminClient
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Message ${messageId} not found`, 'message');
      }
      throw parseDatabaseError(error, `Failed to update message ${messageId}`);
    }

    if (!data) {
      throw new NotFoundError(`Message ${messageId} not found`, 'message');
    }

    return data as Message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      throw parseDatabaseError(error, `Failed to delete message ${messageId}`);
    }
  }

  // Room member operations
  async addRoomMember(roomId: string, userId: string): Promise<RoomMember> {
    // First check if member already exists
    const existing = await this.getRoomMember(roomId, userId);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabaseAdminClient
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') {
        // Member was added between check and insert, fetch it
        const member = await this.getRoomMember(roomId, userId);
        if (member) {
          return member;
        }
        throw new ConflictError(
          `User ${userId} is already a member of room ${roomId}`,
          'room_member'
        );
      }
      throw parseDatabaseError(error, `Failed to add member ${userId} to room ${roomId}`);
    }

    if (!data) {
      throw new DatabaseError('Room member addition succeeded but no data returned');
    }

    return data as RoomMember;
  }

  async getRoomMember(roomId: string, userId: string): Promise<RoomMember | null> {
    const { data, error } = await supabaseAdminClient
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, `Failed to get room member ${userId} in room ${roomId}`);
    }

    return data as RoomMember;
  }

  async removeRoomMember(roomId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      throw parseDatabaseError(error, `Failed to remove member ${userId} from room ${roomId}`);
    }
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const { data, error } = await supabaseAdminClient
      .from('room_members')
      .select('*')
      .eq('room_id', roomId);

    if (error) {
      throw parseDatabaseError(error, `Failed to get members for room ${roomId}`);
    }

    return (data || []) as RoomMember[];
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    // Get rooms where user is an explicit member
    const { data: memberRooms, error: memberError } = await supabaseAdminClient
      .from('room_members')
      .select('rooms(*)')
      .eq('user_id', userId);

    if (memberError) {
      throw parseDatabaseError(memberError, `Failed to get rooms for user ${userId}`);
    }

    // Get server IDs where user is a member
    const { data: serverMembers, error: serverError } = await supabaseAdminClient
      .from('server_members')
      .select('server_id')
      .eq('user_id', userId);

    if (serverError) {
      throw parseDatabaseError(serverError, `Failed to get server memberships for user ${userId}`);
    }

    const serverIds = serverMembers?.map((m: { server_id: string }) => m.server_id) || [];

    // Get rooms from those servers
    let serverRoomsList: Room[] = [];
    if (serverIds.length > 0) {
      const { data: serverRooms, error: roomsError } = await supabaseAdminClient
        .from('rooms')
        .select('*')
        .in('server_id', serverIds);

      if (roomsError) {
        throw parseDatabaseError(roomsError, `Failed to get server rooms for user ${userId}`);
      }

      serverRoomsList = (serverRooms || []) as Room[];
    }

    // Combine both sources
    const explicitRooms = (memberRooms?.map((item: { rooms: Room }) => item.rooms).filter(Boolean) || []) as Room[];

    // Remove duplicates by room ID
    const roomMap = new Map<string, Room>();
    [...explicitRooms, ...serverRoomsList].forEach((room) => {
      if (room && room.id) {
        roomMap.set(room.id, room);
      }
    });

    return Array.from(roomMap.values());
  }
}

export const supabaseService = new SupabaseService();

