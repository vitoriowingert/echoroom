import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { useSocket } from '../hooks/useSocket';
import { useRooms } from '../hooks/useRooms';
import { useServers } from '../hooks/useServers';
import { useMessages } from '../hooks/useMessages';
import { useMessageUsers } from '../hooks/useMessageUsers';
import { useOnlineMembers } from '../hooks/useOnlineMembers';
import { useProfile } from '../hooks/useProfile';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import { soundService } from '../services/sound.service';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MembersSidebar } from '../components/layout/MembersSidebar';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { SearchModal } from '../components/chat/SearchModal';
import { PinnedMessagesModal } from '../components/chat/PinnedMessagesModal';
import { HelpModal } from '../components/common/HelpModal';
import { VoiceChannel } from '../components/voice/VoiceChannel';
import { Room, Message } from '../types';

export function Chat() {
  const { user, loading: authLoading, getToken } = useAuth();
  const { t } = useTranslation();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { servers, loading: serversLoading, fetchServers } = useServers(token);
  
  // Wrap all server operations to always get fresh tokens
  const createServer = useCallback(async (name: string, description?: string, iconUrl?: string) => {
    const freshToken = await getToken();
    if (!freshToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
      },
      body: JSON.stringify({ name, description, iconUrl }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create server';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const newServer = await response.json();
    // Refresh servers list to show the newly created server
    await fetchServers(freshToken);
    return newServer;
  }, [getToken, fetchServers]);

  const joinServer = useCallback(async (serverId: string) => {
    const freshToken = await getToken();
    if (!freshToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/${serverId}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${freshToken}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to join server';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Refresh servers list to show the newly joined server
    await fetchServers(freshToken);
  }, [getToken, fetchServers]);
  
  // Wrap discoverServers to always get a fresh token
  const discoverServers = useCallback(async () => {
    const freshToken = await getToken();
    if (!freshToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/discover`, {
      headers: {
        Authorization: `Bearer ${freshToken}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to discover servers';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }, [getToken]);
  
  const { rooms, loading: roomsLoading, fetchRooms } = useRooms(token, selectedServerId);
  
  // Wrap createRoom to always get a fresh token
  const createRoom = useCallback(async (name: string, description?: string, serverId?: string) => {
    const freshToken = await getToken();
    if (!freshToken) {
      throw new Error('Not authenticated');
    }
    
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const url = serverId 
      ? `${API_URL}/api/servers/${serverId}/rooms`
      : `${API_URL}/api/rooms`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create room';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const newRoom = await response.json();
    // Refresh rooms list to show the newly created room
    await fetchRooms(freshToken);
    return newRoom;
  }, [getToken, fetchRooms]);
  const { profile } = useProfile();
  
  // Initialize notifications hook
  const { notifications, unreadCount, unreadCountsByRoom, addNotification, markAllAsRead } = useNotifications(
    user?.id,
    selectedRoomId
  );
  
  // Stable callback for onNewMessage to avoid recreating on every render
  const handleNewMessageFromHook = useCallback(
    (message: Message, username: string) => {
      // Add to notifications when a new message arrives
      // Get room name from rooms list, not selectedRoom (message might be from a different room)
      const messageRoom = rooms.find((r) => r.id === message.room_id);
      addNotification(message, username, messageRoom?.name);
    },
    [rooms, addNotification]
  );

  // Initialize messages hook first
  const { messages, sendMessage, updateMessage, deleteMessage } = useMessages(
    selectedRoomId,
    socket,
    token,
    {
      currentUserId: user?.id,
      soundEnabled: profile?.preferences?.soundEnabled ?? true,
      notificationsEnabled: profile?.preferences?.notifications ?? true,
      currentRoomName: selectedRoom?.name,
      onNewMessage: handleNewMessageFromHook,
    }
  );
  
  // Get message users after messages are available
  const { users: messageUsers } = useMessageUsers(messages, token);
  const { members: onlineMembers, loading: membersLoading } = useOnlineMembers(
    selectedRoomId,
    token
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPinnedMessagesOpen, setIsPinnedMessagesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(true);
  const [pinnedMessagesRefreshTrigger, setPinnedMessagesRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (selectedRoomId) {
          setIsSearchOpen(true);
        }
      }
      // Escape to close search
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomId, isSearchOpen]);

  // Token management with periodic refresh to prevent expiration
  useEffect(() => {
    if (!user) {
      setToken(null);
      return;
    }

    const fetchToken = async () => {
      try {
        const t = await getToken();
        if (t) {
          setToken(t);
        } else {
          // If token is null, user might be logged out or session expired
          console.warn('No token available, user might need to re-authenticate');
          setToken(null);
        }
      } catch (error) {
        console.error('Error fetching token:', error);
        setToken(null);
      }
    };

    // Fetch immediately
    fetchToken();

    // Refresh token every 4 minutes to prevent expiration
    // Tokens typically last 1 hour, refreshing every 4 min ensures freshness
    const interval = setInterval(fetchToken, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, getToken]);

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      setSelectedRoom(room || null);
    } else {
      setSelectedRoom(null);
    }
  }, [selectedRoomId, rooms]);

  // Request notification permission when user enables notifications
  useEffect(() => {
    if (profile?.preferences?.notifications && notificationService.getPermission() === 'default') {
      notificationService.requestPermission().catch((error) => {
        console.warn('Failed to request notification permission:', error);
      });
    }
  }, [profile?.preferences?.notifications]);

 // Track joined rooms to avoid re-joining
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const roomsRef = useRef<Room[]>([]);
  const allUserRoomsRef = useRef<Room[]>([]); // All rooms user has access to (for Socket.IO joining)
  const messageUsersRef = useRef<Map<string, { username?: string; email?: string }>>(new Map());
  const profileRef = useRef(profile);
  const selectedRoomIdRef = useRef(selectedRoomId);

  // Update refs when values change
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    messageUsersRef.current = messageUsers;
  }, [messageUsers]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Stable callback for adding notifications
  const handleAddNotification = useCallback(
    (message: Message, username: string) => {
      // Check both server-specific rooms and all user rooms for room name
      const messageRoom = roomsRef.current.find((r) => r.id === message.room_id) 
        || allUserRoomsRef.current.find((r) => r.id === message.room_id);
      console.log('handleAddNotification called:', { roomId: message.room_id, username, roomName: messageRoom?.name });
      addNotification(message, username, messageRoom?.name);
    },
    [addNotification]
  );

  // Fetch all user rooms (for Socket.IO joining) - separate from server-specific rooms
  // This ensures users receive notifications from all rooms they have access to, regardless of which server they're viewing
  useEffect(() => {
    if (!token || !socket) return;

    // Set up error handlers once
    const handleJoinedRoom = (data: { roomId: string }) => {
      console.log('✅ Successfully joined Socket.IO room:', data.roomId);
    };
    
    const handleJoinError = (error: { message: string }) => {
      console.error('❌ Socket.IO error:', error.message);
    };
    
    socket.on('joined_room', handleJoinedRoom);
    socket.on('error', handleJoinError);

    const fetchAllUserRooms = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/rooms/my-rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allRooms: Room[] = await response.json();
          allUserRoomsRef.current = allRooms;
          console.log('📥 Fetched all user rooms:', allRooms.length, 'Room IDs:', allRooms.map(r => r.id));
          
          // Join all rooms in Socket.IO
          const roomsToJoin = allRooms.filter((room) => !joinedRoomsRef.current.has(room.id));
          roomsToJoin.forEach((room) => {
            socket.emit('join_room', room.id);
            joinedRoomsRef.current.add(room.id);
            console.log('📤 Attempting to join Socket.IO room:', room.id, room.name);
          });
        } else {
          console.warn('Failed to fetch all user rooms:', response.status);
        }
      } catch (error) {
        console.error('Error fetching all user rooms:', error);
      }
    };

    fetchAllUserRooms();
    
    // Cleanup listeners when component unmounts or effect re-runs
    return () => {
      socket.off('joined_room', handleJoinedRoom);
      socket.off('error', handleJoinError);
    };
  }, [socket, token, servers]); // Also refresh when servers change (e.g., user joins a new server)

  // Separate effect to handle room joining for server-specific rooms (for display)
  // This ensures we also join rooms when they're added to the current server view
  useEffect(() => {
    if (!socket || !token || rooms.length === 0) return;

    // Join rooms that haven't been joined yet
    const roomsToJoin = rooms.filter((room) => !joinedRoomsRef.current.has(room.id));
    roomsToJoin.forEach((room) => {
      socket.emit('join_room', room.id);
      joinedRoomsRef.current.add(room.id);
      console.log('✅ Joined Socket.IO room (from server view):', room.id, room.name);
    });

    // Note: We don't leave rooms when they're removed from server view
    // because the user might still have access to them from other servers
  }, [socket, token, rooms]);

  // Global listener for messages from all rooms (register once, not on every rooms change)
  useEffect(() => {
    if (!socket || !token || !user?.id) return;

    // Global listener for messages from all rooms
    const handleGlobalNewMessage = async (message: Message) => {
      console.log('🔔 Global listener received message:', { 
        roomId: message.room_id, 
        userId: message.user_id, 
        currentUserId: user?.id,
        content: message.content.substring(0, 50)
      });
      
      // Only process messages from other users
      const currentUserId = user?.id;
      if (currentUserId && message.user_id !== currentUserId) {
        // Get username - use ref to avoid dependency issues
        let username = 'Unknown User';
        const userInMap = messageUsersRef.current.get(message.user_id);
        if (userInMap) {
          username = userInMap.username || userInMap.email || 'Unknown User';
        } else {
          // Fetch user if not in map
          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/users/${message.user_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const userData = await response.json();
              username = userData.username || userData.email || 'Unknown User';
            }
          } catch (error) {
            console.warn('Failed to fetch user for notification:', error);
          }
        }

        // Get room name - check both server-specific rooms and all user rooms
        const messageRoom = roomsRef.current.find((r) => r.id === message.room_id) 
          || allUserRoomsRef.current.find((r) => r.id === message.room_id);

        // Add to notifications (this will handle filtering if we're viewing that room)
        console.log('Global listener: Adding notification for room:', message.room_id, 'Current selectedRoomId:', selectedRoomIdRef.current);
        handleAddNotification(message, username);

        // Get current values from refs
        const currentProfile = profileRef.current;
        const currentSelectedRoomId = selectedRoomIdRef.current;

        // Show browser notification if enabled and not viewing that room
        if (
          currentProfile?.preferences?.notifications &&
          currentSelectedRoomId !== message.room_id
        ) {
          notificationService.setNotificationsEnabled(true);
          await notificationService.showMessageNotification(
            username,
            message.content,
            messageRoom?.name
          );
        }

        // Play sound if enabled and not viewing that room
        if (
          currentProfile?.preferences?.soundEnabled &&
          currentSelectedRoomId !== message.room_id
        ) {
          soundService.setSoundEnabled(true);
          await soundService.playNotificationSound();
        }
      }
    };

    socket.on('new_message', handleGlobalNewMessage);

    return () => {
      socket.off('new_message', handleGlobalNewMessage);
    };
  }, [socket, token, user?.id, handleAddNotification]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
        <div className="text-white">{t.common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreateServer = async (name: string, description?: string, iconUrl?: string) => {
    const server = await createServer(name, description, iconUrl);
    setSelectedServerId(server.id);
    setSelectedRoomId(null); // Clear room selection when switching servers
  };

  const handleCreateRoom = async (name: string, description?: string, serverId?: string) => {
    try {
      console.log('Creating room:', { name, description, serverId, selectedServerId });
      const room = await createRoom(name, description, serverId || selectedServerId || undefined);
      console.log('Room created successfully:', room);
      setSelectedRoomId(room.id);
      // Refresh rooms list to show the new room
      // The useRooms hook should automatically update, but we can force a refresh
    } catch (error) {
      console.error('Error creating room:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleSelectServer = (serverId: string | null) => {
    setSelectedServerId(serverId);
    setSelectedRoomId(null); // Clear room selection when switching servers
  };

  const handleSendMessage = (content: string, fileUrl?: string, fileName?: string, fileSize?: number, fileType?: string) => {
    try {
      sendMessage(content, fileUrl, fileName, fileSize, fileType);
    } catch (error) {
      console.error('Falha ao enviar mensagem:', error);
    }
  };

  const handleUpdateMessage = (messageId: string, content: string) => {
    try {
      updateMessage(messageId, content);
    } catch (error) {
      console.error('Falha ao atualizar mensagem:', error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    try {
      deleteMessage(messageId);
    } catch (error) {
      console.error('Falha ao deletar mensagem:', error);
    }
  };

  return (
    <div className="h-screen flex bg-discord-darkest overflow-hidden">
      <Sidebar
        servers={servers}
        rooms={rooms}
        selectedServerId={selectedServerId}
        selectedRoomId={selectedRoomId}
        onSelectServer={handleSelectServer}
        onSelectRoom={setSelectedRoomId}
        onCreateServer={handleCreateServer}
        onCreateRoom={handleCreateRoom}
        onJoinServer={joinServer}
        discoverServers={discoverServers}
        loading={roomsLoading || serversLoading}
        unreadCountsByRoom={unreadCountsByRoom}
        onToggleMembers={() => setIsMembersSidebarOpen(!isMembersSidebarOpen)}
      />

      <div className="flex-1 flex flex-col bg-discord-gray min-w-0">
        <Header
          room={selectedRoom}
          onSearchClick={() => setIsSearchOpen(true)}
          onPinClick={() => setIsPinnedMessagesOpen(true)}
          onPhoneCallClick={() => {
            if (selectedRoom) {
              // Convert to voice channel or show voice call
              alert('Voice call feature - Coming soon!');
            }
          }}
          onVideoCallClick={() => {
            if (selectedRoom) {
              // Convert to video call or show video call
              alert('Video call feature - Coming soon!');
            }
          }}
          onAddUserClick={() => {
            if (selectedServerId) {
              // Show invite modal or add user modal
              alert('Add user feature - Use server invite!');
            }
          }}
          onMembersClick={() => setIsMembersSidebarOpen(!isMembersSidebarOpen)}
          onHelpClick={() => setIsHelpOpen(true)}
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={(roomId, messageId) => {
            // Switch to the room and scroll to the message
            setSelectedRoomId(roomId);
            // Scroll to message after a short delay to allow room to load
            setTimeout(() => {
              const element = document.querySelector(`[data-message-id="${messageId}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-message');
                setTimeout(() => {
                  element.classList.remove('highlight-message');
                }, 2000);
              }
            }, 500);
          }}
        />

        {selectedRoomId ? (
          selectedRoom?.channel_type === 'voice' ? (
            <VoiceChannel
              roomId={selectedRoomId}
              socket={socket}
              onClose={() => setSelectedRoomId(null)}
            />
          ) : (
            <>
              <MessageList
                messages={messages}
                users={messageUsers}
                currentUserId={user.id}
                roomId={selectedRoomId || undefined}
                onEditMessage={handleUpdateMessage}
                onDeleteMessage={handleDeleteMessage}
                onPinMessage={(_messageId) => {
                  // Trigger refresh of pinned messages modal if it's open
                  // _messageId is provided by MessageItem but not needed here
                  if (isPinnedMessagesOpen) {
                    setPinnedMessagesRefreshTrigger((prev) => prev + 1);
                  }
                }}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                roomId={selectedRoomId || undefined}
                disabled={!connected || !selectedRoomId}
              />
            </>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-discord-gray-lighter bg-discord-gray">
            <div className="text-center">
              <p className="text-xl mb-2 font-semibold">{t.chat.welcome}</p>
              <p className="text-sm">
                {t.chat.selectOrCreateRoom}
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedRoomId && isMembersSidebarOpen && (
        <MembersSidebar members={onlineMembers} loading={membersLoading} />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        roomId={selectedRoomId}
        token={token}
        users={messageUsers}
        currentUserId={user.id}
        onMessageClick={(messageId) => {
          // Scroll to message in chat
          const element = document.querySelector(`[data-message-id="${messageId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-message');
            setTimeout(() => {
              element.classList.remove('highlight-message');
            }, 2000);
          }
        }}
      />

      <PinnedMessagesModal
        isOpen={isPinnedMessagesOpen}
        onClose={() => setIsPinnedMessagesOpen(false)}
        roomId={selectedRoomId}
        users={messageUsers}
        refreshTrigger={pinnedMessagesRefreshTrigger}
        onMessageClick={(messageId) => {
          // Scroll to message in chat
          const element = document.querySelector(`[data-message-id="${messageId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-message');
            setTimeout(() => {
              element.classList.remove('highlight-message');
            }, 2000);
          }
        }}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

