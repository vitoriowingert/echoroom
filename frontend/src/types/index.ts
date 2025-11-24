export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar?: string;
  custom_status?: string;
  status_emoji?: string;
  status_expires_at?: string;
  bio?: string;
  banner_url?: string;
  badges?: string[];
  pronouns?: string;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ChannelType = 'text' | 'voice' | 'category';

export interface Room {
  id: string;
  name: string;
  description?: string;
  server_id?: string;
  created_by: string;
  channel_type?: ChannelType;
  category_id?: string;
  position?: number;
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
  is_pinned?: boolean;
  thread_id?: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

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

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: string;
  role_id?: string;
  joined_at: string;
}

export interface ServerInvite {
  id: string;
  server_id: string;
  code: string;
  created_by: string;
  expires_at?: string;
  max_uses?: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}
