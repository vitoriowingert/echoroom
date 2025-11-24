import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { VoiceParticipant } from '../types';
import { WebRTCClient } from '../services/webrtc.client';

interface UseVoiceChannelOptions {
  socket: Socket | null;
  roomId: string | null;
  currentUserId: string | null;
  onParticipantsUpdate?: (participants: VoiceParticipant[]) => void;
}

export function useVoiceChannel({
  socket,
  roomId,
  currentUserId,
  onParticipantsUpdate,
}: UseVoiceChannelOptions) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const webrtcClientRef = useRef<WebRTCClient | null>(null);
  const participantsRef = useRef<VoiceParticipant[]>([]);

  // Initialize WebRTC client
  useEffect(() => {
    if (socket) {
      webrtcClientRef.current = new WebRTCClient(socket);

      // Setup remote stream handler
      webrtcClientRef.current.onRemoteStream = (userId: string, stream: MediaStream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(userId, stream);
          return next;
        });
      };

      // Setup peer disconnected handler
      webrtcClientRef.current.onPeerDisconnected = (userId: string) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      };
    }

    return () => {
      if (webrtcClientRef.current) {
        webrtcClientRef.current.cleanup();
        webrtcClientRef.current = null;
      }
    };
  }, [socket]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleVoiceChannelJoined = (data: { roomId: string; participants: VoiceParticipant[] }) => {
      if (data.roomId === roomId) {
        setParticipants(data.participants);
        participantsRef.current = data.participants;
        setIsConnected(true);
        onParticipantsUpdate?.(data.participants);

        // Create offers for existing participants
        if (currentUserId && webrtcClientRef.current) {
          data.participants.forEach((participant) => {
            if (participant.user_id !== currentUserId) {
              webrtcClientRef.current!.createOffer(participant.user_id, roomId).catch(console.error);
            }
          });
        }
      }
    };

    const handleUserJoinedVoice = (data: { userId: string; roomId: string; participant: VoiceParticipant }) => {
      if (data.roomId === roomId) {
        setParticipants((prev) => {
          const exists = prev.some((p) => p.user_id === data.userId);
          if (exists) {
            return prev.map((p) => (p.user_id === data.userId ? data.participant : p));
          }
          return [...prev, data.participant];
        });

        // Create offer for new participant
        if (currentUserId && data.userId !== currentUserId && webrtcClientRef.current) {
          webrtcClientRef.current.createOffer(data.userId, roomId).catch(console.error);
        }
      }
    };

    const handleUserLeftVoice = (data: { userId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setParticipants((prev) => prev.filter((p) => p.user_id !== data.userId));
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleParticipantStateUpdated = (data: {
      userId: string;
      roomId: string;
      participant: VoiceParticipant;
    }) => {
      if (data.roomId === roomId) {
        setParticipants((prev) =>
          prev.map((p) => (p.user_id === data.userId ? data.participant : p))
        );
      }
    };

    const handleMuteToggled = (data: { roomId: string; isMuted: boolean }) => {
      if (data.roomId === roomId) {
        setIsMuted(data.isMuted);
      }
    };

    const handleDeafenToggled = (data: { roomId: string; isDeafened: boolean }) => {
      if (data.roomId === roomId) {
        setIsDeafened(data.isDeafened);
      }
    };

    const handleVideoToggled = (data: { roomId: string; isVideoEnabled: boolean }) => {
      if (data.roomId === roomId) {
        setIsVideoEnabled(data.isVideoEnabled);
      }
    };

    const handleScreenShareStarted = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setIsScreenSharing(true);
      }
    };

    const handleScreenShareStopped = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setIsScreenSharing(false);
      }
    };

    socket.on('voice_channel_joined', handleVoiceChannelJoined);
    socket.on('user_joined_voice', handleUserJoinedVoice);
    socket.on('user_left_voice', handleUserLeftVoice);
    socket.on('participant_state_updated', handleParticipantStateUpdated);
    socket.on('mute_toggled', handleMuteToggled);
    socket.on('deafen_toggled', handleDeafenToggled);
    socket.on('video_toggled', handleVideoToggled);
    socket.on('screen_share_started', handleScreenShareStarted);
    socket.on('screen_share_stopped', handleScreenShareStopped);

    return () => {
      socket.off('voice_channel_joined', handleVoiceChannelJoined);
      socket.off('user_joined_voice', handleUserJoinedVoice);
      socket.off('user_left_voice', handleUserLeftVoice);
      socket.off('participant_state_updated', handleParticipantStateUpdated);
      socket.off('mute_toggled', handleMuteToggled);
      socket.off('deafen_toggled', handleDeafenToggled);
      socket.off('video_toggled', handleVideoToggled);
      socket.off('screen_share_started', handleScreenShareStarted);
      socket.off('screen_share_stopped', handleScreenShareStopped);
    };
  }, [socket, roomId, currentUserId, onParticipantsUpdate]);

  // Join voice channel
  const joinVoiceChannel = useCallback(async () => {
    if (!socket || !roomId || !webrtcClientRef.current) {
      setError('Socket, room ID, or WebRTC client not available');
      return;
    }

    try {
      setError(null);

      // Get user media (audio only for voice channel)
      const stream = await webrtcClientRef.current.getUserMedia(true, false);
      setLocalStream(stream);

      // Join voice channel via socket
      socket.emit('join_voice_channel', { roomId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join voice channel';
      setError(message);
      console.error('Error joining voice channel:', error);
    }
  }, [socket, roomId]);

  // Leave voice channel
  const leaveVoiceChannel = useCallback(async () => {
    if (!socket || !roomId) {
      return;
    }

    try {
      socket.emit('leave_voice_channel', { roomId });

      // Cleanup WebRTC
      if (webrtcClientRef.current) {
        webrtcClientRef.current.cleanup();
      }

      setLocalStream(null);
      setRemoteStreams(new Map());
      setParticipants([]);
      setIsConnected(false);
      setIsMuted(false);
      setIsDeafened(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error leaving voice channel:', error);
    }
  }, [socket, roomId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!socket || !roomId) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (webrtcClientRef.current) {
      webrtcClientRef.current.setMuted(newMuted);
    }

    socket.emit('toggle_mute', { roomId, isMuted: newMuted });
  }, [socket, roomId, isMuted]);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    if (!socket || !roomId) return;

    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);

    if (webrtcClientRef.current) {
      webrtcClientRef.current.setMuted(newDeafened);
    }

    socket.emit('toggle_deafen', { roomId, isDeafened: newDeafened });
  }, [socket, roomId, isDeafened]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!socket || !roomId || !webrtcClientRef.current) return;

    const newVideoEnabled = !isVideoEnabled;
    setIsVideoEnabled(newVideoEnabled);

    if (newVideoEnabled) {
      // Enable video - get video stream
      try {
        const stream = await webrtcClientRef.current.getUserMedia(true, true);
        setLocalStream(stream);
      } catch (error) {
        console.error('Error enabling video:', error);
        setIsVideoEnabled(false);
        return;
      }
    } else {
      // Disable video
      webrtcClientRef.current.setVideoEnabled(false);
    }

    socket.emit('toggle_video', { roomId, isVideoEnabled: newVideoEnabled });
  }, [socket, roomId, isVideoEnabled]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (!socket || !roomId || !webrtcClientRef.current) return;

    try {
      const stream = await webrtcClientRef.current.getScreenShare();
      setIsScreenSharing(true);
      socket.emit('start_screen_share', { roomId });
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [socket, roomId]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (!socket || !roomId || !webrtcClientRef.current) return;

    webrtcClientRef.current.stopScreenShare();
    setIsScreenSharing(false);
    socket.emit('stop_screen_share', { roomId });
  }, [socket, roomId]);

  // Cleanup on unmount or room change
  useEffect(() => {
    return () => {
      if (webrtcClientRef.current) {
        webrtcClientRef.current.cleanup();
      }
    };
  }, []);

  return {
    participants,
    isConnected,
    isMuted,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    remoteStreams,
    error,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}

