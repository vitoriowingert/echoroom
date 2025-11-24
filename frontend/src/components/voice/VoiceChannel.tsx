import { useEffect, useState } from 'react';
import { useVoiceChannel } from '../../hooks/useVoiceChannel';
import { MediaControls } from './MediaControls';
import { VideoCall } from './VideoCall';
import { useAuth } from '../../hooks/useAuth';
import { useVoiceParticipants } from '../../hooks/useVoiceParticipants';

interface VoiceChannelProps {
  roomId: string;
  socket: any;
  onClose?: () => void;
}

export function VoiceChannel({ roomId, socket, onClose }: VoiceChannelProps) {
  const { user, getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    getToken().then(setToken).catch(console.error);
  }, [getToken]);

  const {
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
  } = useVoiceChannel({
    socket,
    roomId,
    currentUserId: user?.id || null,
  });

  // Auto-join on mount
  useEffect(() => {
    if (roomId && socket && !isConnected) {
      joinVoiceChannel();
    }

    return () => {
      if (isConnected) {
        leaveVoiceChannel();
      }
    };
  }, [roomId, socket]);

  // Get user info for participants
  const { users } = useVoiceParticipants(participants, token);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-discord-gray">
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">{error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-discord-gray">
      {/* Video call area */}
      {isVideoEnabled && (
        <VideoCall
          localStream={localStream}
          remoteStreams={remoteStreams}
          participants={participants}
          isScreenSharing={isScreenSharing}
        />
      )}

      {/* Participants list (when not in video mode) */}
      {!isVideoEnabled && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="text-white font-semibold mb-4">
            Participants ({participants.length})
          </div>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 bg-discord-dark rounded-lg"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-discord-blue flex items-center justify-center text-white font-semibold">
                    {participant.user_id.charAt(0).toUpperCase()}
                  </div>
                  {!participant.is_muted && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green border-2 border-discord-dark rounded-full"></div>
                  )}
                  {participant.is_muted && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-red border-2 border-discord-dark rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {users.get(participant.user_id)?.username || 
                     users.get(participant.user_id)?.email || 
                     `User ${participant.user_id.substring(0, 8)}`}
                  </div>
                  <div className="text-discord-gray-lighter text-xs">
                    {participant.is_deafened ? 'Deafened' : participant.is_muted ? 'Muted' : 'Speaking'}
                  </div>
                </div>
                {participant.is_screen_sharing && (
                  <div className="text-discord-blue text-xs">Sharing screen</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media controls */}
      <MediaControls
        isMuted={isMuted}
        isDeafened={isDeafened}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleDeafen={toggleDeafen}
        onToggleVideo={toggleVideo}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onLeave={leaveVoiceChannel}
      />
    </div>
  );
}

