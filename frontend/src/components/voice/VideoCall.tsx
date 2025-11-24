import { useRef, useEffect } from 'react';
import { VoiceParticipant } from '../../types';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: VoiceParticipant[];
  isScreenSharing: boolean;
}

export function VideoCall({
  localStream,
  remoteStreams,
  participants,
  isScreenSharing,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video streams
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const setRemoteVideoRef = (userId: string, element: HTMLVideoElement | null) => {
    if (element) {
      remoteVideoRefs.current.set(userId, element);
      const stream = remoteStreams.get(userId);
      if (stream) {
        element.srcObject = stream;
      }
    } else {
      remoteVideoRefs.current.delete(userId);
    }
  };

  const videoParticipants = participants.filter((p) => p.is_video_enabled || p.is_screen_sharing);

  return (
    <div className="flex-1 overflow-hidden bg-discord-darkest relative">
      {/* Remote videos grid */}
      <div
        className={`grid gap-2 p-4 h-full ${
          videoParticipants.length === 0
            ? 'grid-cols-1'
            : videoParticipants.length === 1
            ? 'grid-cols-1'
            : videoParticipants.length === 2
            ? 'grid-cols-2'
            : videoParticipants.length <= 4
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {videoParticipants.map((participant) => (
          <div
            key={participant.id}
            className="relative bg-discord-dark rounded-lg overflow-hidden aspect-video"
          >
            <video
              ref={(el) => setRemoteVideoRef(participant.user_id, el)}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
              {participant.user_id.substring(0, 8)}
              {participant.is_screen_sharing && ' (Sharing)'}
            </div>
            {participant.is_muted && (
              <div className="absolute top-2 right-2 bg-discord-red rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 017.367 7.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Local video (picture-in-picture) */}
      {localStream && (
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-discord-dark rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-white text-xs">
            You
          </div>
        </div>
      )}
    </div>
  );
}

