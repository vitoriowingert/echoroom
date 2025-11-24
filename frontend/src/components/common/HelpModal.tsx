interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-discord-dark rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-discord-gray-light flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Help & Support</h2>
          <button
            onClick={onClose}
            className="text-discord-gray-lighter hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-discord-gray-lighter">
                <div className="flex items-center justify-between">
                  <span>Open search</span>
                  <kbd className="px-2 py-1 bg-discord-gray rounded text-xs">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Send message</span>
                  <kbd className="px-2 py-1 bg-discord-gray rounded text-xs">Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>New line in message</span>
                  <kbd className="px-2 py-1 bg-discord-gray rounded text-xs">Shift+Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Close modals</span>
                  <kbd className="px-2 py-1 bg-discord-gray rounded text-xs">Esc</kbd>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Features</h3>
              <ul className="space-y-2 text-discord-gray-lighter list-disc list-inside">
                <li>Create servers and channels</li>
                <li>Send messages with file attachments</li>
                <li>React to messages with emojis</li>
                <li>Pin important messages</li>
                <li>Voice and video channels</li>
                <li>Real-time notifications</li>
                <li>Search messages</li>
                <li>User presence indicators</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Getting Started</h3>
              <ol className="space-y-2 text-discord-gray-lighter list-decimal list-inside">
                <li>Create or join a server</li>
                <li>Select a channel to start chatting</li>
                <li>Type your message and press Enter to send</li>
                <li>Click on user avatars to view profiles</li>
                <li>Use the search button (Ctrl+K) to find messages</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Need More Help?</h3>
              <p className="text-discord-gray-lighter">
                For additional support, please check the documentation or contact the support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

