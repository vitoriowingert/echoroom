interface MediaControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onLeave: () => void;
}

export function MediaControls({
  isMuted,
  isDeafened,
  isVideoEnabled,
  isScreenSharing,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
}: MediaControlsProps) {
  return (
    <div className="h-20 bg-discord-dark border-t border-discord-gray-light flex items-center justify-center gap-2 px-4">
      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-colors ${
          isMuted || isDeafened
            ? 'bg-discord-red hover:bg-red-600 text-white'
            : 'bg-discord-gray-light hover:bg-discord-gray-lighter text-white'
        }`}
        title={isMuted || isDeafened ? 'Unmute' : 'Mute'}
      >
        {isMuted || isDeafened ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 017.367 7.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Deafen button */}
      <button
        onClick={onToggleDeafen}
        className={`p-3 rounded-full transition-colors ${
          isDeafened
            ? 'bg-discord-red hover:bg-red-600 text-white'
            : 'bg-discord-gray-light hover:bg-discord-gray-lighter text-white'
        }`}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Video button */}
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition-colors ${
          isVideoEnabled
            ? 'bg-discord-gray-light hover:bg-discord-gray-lighter text-white'
            : 'bg-discord-red hover:bg-red-600 text-white'
        }`}
        title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </button>

      {/* Screen share button */}
      {!isScreenSharing ? (
        <button
          onClick={onStartScreenShare}
          className="p-3 rounded-full bg-discord-gray-light hover:bg-discord-gray-lighter text-white transition-colors"
          title="Share screen"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onStopScreenShare}
          className="p-3 rounded-full bg-discord-red hover:bg-red-600 text-white transition-colors"
          title="Stop sharing"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="p-3 rounded-full bg-discord-red hover:bg-red-600 text-white transition-colors ml-auto"
        title="Leave voice channel"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

