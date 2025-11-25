import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types';
import { Socket } from 'socket.io-client';
import { soundService } from '../services/sound.service';
import { notificationService } from '../services/notification.service';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface UseMessagesOptions {
  currentUserId?: string;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  currentRoomName?: string;
  messageUsers?: Map<string, { username?: string; email?: string }>;
  onNewMessage?: (message: Message, username: string) => void;
}

export function useMessages(
  roomId: string | null,
  socket: Socket | null,
  token: string | null,
  options: UseMessagesOptions = {}
) {
  const { getToken } = useAuth();
  const { currentUserId, soundEnabled = true, notificationsEnabled = true, currentRoomName, messageUsers, onNewMessage } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid dependency issues
  const messageUsersRef = useRef(messageUsers);
  const soundEnabledRef = useRef(soundEnabled);
  const notificationsEnabledRef = useRef(notificationsEnabled);
  const currentRoomNameRef = useRef(currentRoomName);
  const onNewMessageRef = useRef(onNewMessage);
  
  // Update refs when values change
  useEffect(() => {
    messageUsersRef.current = messageUsers;
  }, [messageUsers]);
  
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  
  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);
  
  useEffect(() => {
    currentRoomNameRef.current = currentRoomName;
  }, [currentRoomName]);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  const fetchMessages = useCallback(async (currentToken: string | null = token) => {
    if (!roomId || !currentToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        // If token expired, try to get a fresh one and retry once
        if (response.status === 401) {
          const freshToken = await getToken();
          if (freshToken && freshToken !== currentToken) {
            // Retry with fresh token - await to ensure finally executes after retry completes
            await fetchMessages(freshToken);
            return;
          }
        }
        throw new Error('Falha ao buscar mensagens');
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar mensagens');
    } finally {
      setLoading(false);
    }
  }, [roomId, token, getToken]);

  const sendMessage = useCallback(
    async (content: string, fileUrl?: string, fileName?: string, fileSize?: number, fileType?: string) => {
      if (!socket || !roomId) {
        throw new Error('Socket não conectado ou sala não selecionada');
      }

      socket.emit('send_message', {
        roomId,
        content,
        messageType: fileUrl ? 'file' : 'text',
        fileUrl,
        fileName,
        fileSize,
        fileType,
      });

      // Play sent sound if enabled (for user's own messages)
      const currentSoundEnabled = soundEnabledRef.current;
      if (currentSoundEnabled) {
        soundService.setSoundEnabled(currentSoundEnabled);
        await soundService.playMessageSentSound();
      }
    },
    [socket, roomId]
  );

  const updateMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socket) {
        throw new Error('Socket não conectado');
      }

      socket.emit('update_message', {
        messageId,
        content,
      });
    },
    [socket]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket) {
        throw new Error('Socket não conectado');
      }

      socket.emit('delete_message', {
        messageId,
      });
    },
    [socket]
  );

  useEffect(() => {
    if (socket && roomId) {
      // Join room
      socket.emit('join_room', roomId);

      // Listen for room messages (initial load)
      const handleRoomMessages = (roomMessages: Message[]) => {
        setMessages(roomMessages);
        setLoading(false);
      };

      // Listen for new messages
      const handleNewMessage = async (message: Message) => {
        setMessages((prev) => [...prev, message]);

        // Only trigger sounds/notifications for messages from other users
        if (currentUserId && message.user_id !== currentUserId) {
          // Get username for notifications - use ref to avoid dependency issues
          const user = messageUsersRef.current?.get(message.user_id);
          const username = user?.username || user?.email || 'Unknown User';

          // Get current values from refs
          const currentSoundEnabled = soundEnabledRef.current;
          const currentNotificationsEnabled = notificationsEnabledRef.current;
          const currentRoomName = currentRoomNameRef.current;
          const currentOnNewMessage = onNewMessageRef.current;

          // Update service preferences
          soundService.setSoundEnabled(currentSoundEnabled ?? true);
          notificationService.setNotificationsEnabled(currentNotificationsEnabled ?? true);

          // Play sound if enabled
          if (currentSoundEnabled) {
            await soundService.playNotificationSound();
          }

          // Show browser notification if enabled
          if (currentNotificationsEnabled) {
            console.log('Attempting to show notification:', {
              username,
              message: message.content.substring(0, 50),
              roomName: currentRoomName,
              permission: notificationService.getPermission(),
            });
            
            const notification = await notificationService.showMessageNotification(
              username,
              message.content,
              currentRoomName
            );
            
            if (!notification) {
              console.log('Notification was not shown. Check permission and settings.');
            }
          }

          // Add to in-app notifications (for bell icon)
          if (currentOnNewMessage) {
            currentOnNewMessage(message, username);
          }
        }
      };

      // Listen for message updates
      const handleMessageUpdated = (message: Message) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? message : msg))
        );
      };

      // Listen for message deletions
      const handleMessageDeleted = (data: { messageId: string }) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      };

      socket.on('room_messages', handleRoomMessages);
      socket.on('new_message', handleNewMessage);
      socket.on('message_updated', handleMessageUpdated);
      socket.on('message_deleted', handleMessageDeleted);

      // Fetch messages as fallback
      fetchMessages();

      return () => {
        socket.off('room_messages', handleRoomMessages);
        socket.off('new_message', handleNewMessage);
        socket.off('message_updated', handleMessageUpdated);
        socket.off('message_deleted', handleMessageDeleted);
        socket.emit('leave_room', roomId);
      };
    }
  }, [socket, roomId, fetchMessages, currentUserId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    updateMessage,
    deleteMessage,
    fetchMessages,
  };
}

