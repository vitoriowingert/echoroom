import { supabaseAdminClient } from '../config/supabase';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  soundEnabled?: boolean;
  showOnlineStatus?: boolean;
  language?: string;
  timezone?: string;
}

export class UserService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdminClient.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return null;
    }

    const { id, email, user_metadata } = data.user;
    return {
      id,
      email,
      username: user_metadata?.username || email?.split('@')[0],
      avatar: user_metadata?.avatar_url,
      status: 'online', // Default status, can be enhanced with presence tracking
      preferences: user_metadata?.preferences || {},
    };
  }

  async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];

    for (const userId of userIds) {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        profiles.push(profile);
      }
    }

    return profiles;
  }

  async getOnlineUsersInRoom(roomId: string): Promise<UserProfile[]> {
    // Get all members of the room
    const { data: members, error } = await supabaseAdminClient
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId);

    if (error || !members) {
      return [];
    }

    const userIds = members.map((m) => m.user_id);
    return await this.getUsersByIds(userIds);
  }

  async updateUserProfile(
    userId: string,
    updates: {
      username?: string;
      avatar?: string;
      preferences?: UserPreferences;
    }
  ): Promise<UserProfile> {
    const { data: userData, error: getUserError } = await supabaseAdminClient.auth.admin.getUserById(
      userId
    );

    if (getUserError || !userData.user) {
      throw new Error('User not found');
    }

    const currentMetadata = userData.user.user_metadata || {};
    const newMetadata = { ...currentMetadata };

    if (updates.username !== undefined) {
      newMetadata.username = updates.username;
    }

    if (updates.avatar !== undefined) {
      newMetadata.avatar_url = updates.avatar;
    }

    if (updates.preferences !== undefined && updates.preferences !== null) {
      // Merge preferences, ensuring all fields are preserved
      const currentPreferences = currentMetadata.preferences || {};
      newMetadata.preferences = {
        ...currentPreferences,
        ...updates.preferences,
      };
    }

    const { data, error } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
      user_metadata: newMetadata,
    });

    if (error || !data.user) {
      throw new Error(`Failed to update user profile: ${error?.message || 'Unknown error'}`);
    }

    const { id, email, user_metadata } = data.user;
    return {
      id,
      email,
      username: user_metadata?.username || email?.split('@')[0],
      avatar: user_metadata?.avatar_url,
      status: 'online',
      preferences: user_metadata?.preferences || {},
    };
  }
}

export const userService = new UserService();

