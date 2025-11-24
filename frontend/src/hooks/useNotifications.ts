import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types';

interface NotificationItem {
  id: string;
  messageId: string;
  roomId: string;
  roomName?: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications(currentUserId: string | undefined, selectedRoomId: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCountsByRoom, setUnreadCountsByRoom] = useState<Record<string, number>>({});
  // Track unread message counts per room (not just notifications)
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<Record<string, number>>({});
  const selectedRoomIdRef = useRef(selectedRoomId);
  const currentUserIdRef = useRef(currentUserId);
  
  // Update refs when values change
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);
  
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Mark notifications as read and clear unread counts when viewing a room
  useEffect(() => {
    if (selectedRoomId) {
      // Mark notifications as read
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.roomId === selectedRoomId ? { ...notif, read: true } : notif
        )
      );
      // Clear unread message count for this room
      setUnreadMessageCounts((prev) => {
        const updated = { ...prev };
        delete updated[selectedRoomId];
        return updated;
      });
    }
  }, [selectedRoomId]);

  // Update unread counts (total and per room) - combine notifications and message counts
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);

    // Calculate unread counts per room from notifications
    const countsByRoomFromNotifications: Record<string, number> = {};
    notifications.forEach((notif) => {
      if (!notif.read) {
        countsByRoomFromNotifications[notif.roomId] = (countsByRoomFromNotifications[notif.roomId] || 0) + 1;
      }
    });
    
    // Merge with unread message counts (message counts take precedence as they're more accurate)
    const combinedCounts: Record<string, number> = { ...unreadMessageCounts };
    Object.keys(countsByRoomFromNotifications).forEach((roomId) => {
      // Use the higher count between notifications and message counts
      combinedCounts[roomId] = Math.max(
        combinedCounts[roomId] || 0,
        countsByRoomFromNotifications[roomId] || 0
      );
    });
    
    // Debug log
    if (Object.keys(combinedCounts).length > 0) {
      console.log('Unread counts by room:', combinedCounts);
    }
    
    setUnreadCountsByRoom(combinedCounts);
  }, [notifications, unreadMessageCounts]);

  const addNotification = useCallback(
    (message: Message, username: string, roomName?: string) => {
      // Use refs to get current values
      const currentSelectedRoomId = selectedRoomIdRef.current;
      const currentUserId = currentUserIdRef.current;
      
      console.log('addNotification called:', { 
        messageUserId: message.user_id, 
        currentUserId, 
        messageRoomId: message.room_id, 
        selectedRoomId: currentSelectedRoomId,
        willSkip: (currentUserId && message.user_id === currentUserId) || (currentSelectedRoomId === message.room_id)
      });
      
      // Don't add notification if it's from the current user
      if (currentUserId && message.user_id === currentUserId) {
        console.log('Skipping notification: message from current user');
        return;
      }

      // Don't add notification if we're currently viewing this room
      if (currentSelectedRoomId === message.room_id) {
        console.log('Skipping notification: currently viewing this room');
        return;
      }

      const notification: NotificationItem = {
        id: `notif-${message.id}-${Date.now()}`,
        messageId: message.id,
        roomId: message.room_id,
        roomName,
        userId: message.user_id,
        username,
        content: message.content,
        timestamp: new Date(message.created_at),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [notification, ...prev].slice(0, 50); // Keep last 50
        console.log('✅ Added notification for room:', message.room_id, 'Total notifications:', updated.length, 'Unread:', updated.filter(n => !n.read).length);
        return updated;
      });
      
      // Increment unread message count for this room
      setUnreadMessageCounts((prev) => {
        const currentCount = prev[message.room_id] || 0;
        const updated = { ...prev, [message.room_id]: currentCount + 1 };
        console.log('📊 Updated unread message count for room:', message.room_id, 'Count:', updated[message.room_id]);
        return updated;
      });
    },
    [] // No dependencies - using refs for current values
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    unreadCountsByRoom,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

