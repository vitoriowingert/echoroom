import { supabaseAdminClient } from '../config/supabase';
import { parseDatabaseError } from '../utils/errors';

export type NotificationType = 'mention' | 'message' | 'server_invite' | 'friend_request' | 'reaction';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  room_id?: string;
  server_id?: string;
  message_id?: string;
  read: boolean;
  created_at: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  roomId?: string;
  serverId?: string;
  messageId?: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .insert({
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        room_id: dto.roomId,
        server_id: dto.serverId,
        message_id: dto.messageId,
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to create notification');
    }

    if (!data) {
      throw new Error('Notification creation succeeded but no data returned');
    }

    return data as Notification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw parseDatabaseError(error, 'Failed to get notifications');
    }

    return (data || []) as Notification[];
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw parseDatabaseError(error, 'Failed to get unread count');
    }

    return data?.length || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to mark notification as read');
    }

    if (!data) {
      throw new Error('Notification not found');
    }

    return data as Notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw parseDatabaseError(error, 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to delete notification');
    }
  }

  /**
   * Create mention notification
   */
  async createMentionNotification(
    userId: string,
    roomId: string,
    messageId: string,
    mentionedBy: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'mention',
      title: 'You were mentioned',
      content: `You were mentioned in a message`,
      roomId,
      messageId,
    });
  }
}

export const notificationService = new NotificationService();

