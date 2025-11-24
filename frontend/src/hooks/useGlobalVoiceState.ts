import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

interface GlobalVoiceState {
  currentVoiceRoomId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
}

export function useGlobalVoiceState() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<GlobalVoiceState>({
    currentVoiceRoomId: null,
    isMuted: false,
    isDeafened: false,
  });
  // Track muted state before deafening, so we can restore it when undeafening
  const mutedBeforeDeafenRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleVoiceChannelJoined = (data: { roomId: string; participants?: any[] }) => {
      mutedBeforeDeafenRef.current = null; // Reset saved state
      setState((prev) => ({
        ...prev,
        currentVoiceRoomId: data.roomId,
        // Reset mute/deafen when joining a new channel
        isMuted: false,
        isDeafened: false,
      }));
    };

    const handleUserLeftVoice = (data: { userId: string; roomId: string }) => {
      // Only update if it's the current user leaving
      if (data.userId === user.id) {
        mutedBeforeDeafenRef.current = null; // Reset saved state
        setState({
          currentVoiceRoomId: null,
          isMuted: false,
          isDeafened: false,
        });
      }
    };

    const handleMuteToggled = (data: { roomId: string; isMuted: boolean }) => {
      setState((prev) => {
        if (prev.currentVoiceRoomId === data.roomId) {
          // Only update mute state if not deafened (when deafened, mute is controlled by deafen)
          // But we still track the mute state for when undeafening
          if (!prev.isDeafened) {
            return { ...prev, isMuted: data.isMuted };
          } else {
            // When deafened, save the mute state for restoration later
            mutedBeforeDeafenRef.current = data.isMuted;
            return prev;
          }
        }
        return prev;
      });
    };

    const handleDeafenToggled = (data: { roomId: string; isDeafened: boolean }) => {
      setState((prev) => {
        if (prev.currentVoiceRoomId === data.roomId) {
          if (data.isDeafened) {
            // When deafening: save current mute state and force mute
            mutedBeforeDeafenRef.current = prev.isMuted;
            return { 
              ...prev, 
              isDeafened: true,
              isMuted: true, // Deafening always mutes
            };
          } else {
            // When undeafening: restore previous mute state if it was saved
            const restoredMuted = mutedBeforeDeafenRef.current !== null 
              ? mutedBeforeDeafenRef.current 
              : false;
            mutedBeforeDeafenRef.current = null; // Clear the saved state
            
            // If we need to restore mute, emit toggle_mute after a brief delay
            // to let the backend process the undeafen first
            if (restoredMuted && socket && prev.currentVoiceRoomId) {
              setTimeout(() => {
                socket.emit('toggle_mute', { 
                  roomId: prev.currentVoiceRoomId!, 
                  isMuted: true 
                });
              }, 100);
            }
            
            return { 
              ...prev, 
              isDeafened: false,
              isMuted: restoredMuted, // Restore previous mute state
            };
          }
        }
        return prev;
      });
    };

    socket.on('voice_channel_joined', handleVoiceChannelJoined);
    socket.on('user_left_voice', handleUserLeftVoice);
    socket.on('mute_toggled', handleMuteToggled);
    socket.on('deafen_toggled', handleDeafenToggled);

    return () => {
      socket.off('voice_channel_joined', handleVoiceChannelJoined);
      socket.off('user_left_voice', handleUserLeftVoice);
      socket.off('mute_toggled', handleMuteToggled);
      socket.off('deafen_toggled', handleDeafenToggled);
    };
  }, [socket, user]);

  const toggleMute = useCallback(() => {
    if (!socket || !state.currentVoiceRoomId) {
      alert('You are not in a voice channel');
      return;
    }

    const newMuted = !state.isMuted;
    socket.emit('toggle_mute', { roomId: state.currentVoiceRoomId, isMuted: newMuted });
  }, [socket, state.currentVoiceRoomId, state.isMuted]);

  const toggleDeafen = useCallback(() => {
    if (!socket || !state.currentVoiceRoomId) {
      alert('You are not in a voice channel');
      return;
    }

    const newDeafened = !state.isDeafened;
    socket.emit('toggle_deafen', { roomId: state.currentVoiceRoomId, isDeafened: newDeafened });
  }, [socket, state.currentVoiceRoomId, state.isDeafened]);

  return {
    ...state,
    toggleMute,
    toggleDeafen,
    isInVoiceChannel: state.currentVoiceRoomId !== null,
  };
}

