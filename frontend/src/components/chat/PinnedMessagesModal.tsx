import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Message, User } from '../../types';
import { MessageContent } from './MessageContent';

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  users: Map<string, User>;
  onMessageClick?: (messageId: string) => void;
  refreshTrigger?: number;
}

interface PinnedMessage extends Message {
  pinned_at: string;
  pinned_by: string;
}

export function PinnedMessagesModal({
  isOpen,
  onClose,
  roomId,
  users,
  onMessageClick,
  refreshTrigger,
}: PinnedMessagesModalProps) {
  const { getToken } = useAuth();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (isOpen && roomId) {
      fetchPinnedMessages();
    }
  }, [isOpen, roomId, refreshTrigger]);

  const fetchPinnedMessages = async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      // Always get a fresh token before making the request
      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/pins/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pinned messages');
      }

      const data = await response.json();
      setPinnedMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pinned messages');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    try {
      // Always get a fresh token before making the request
      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/pins/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unpin message');
      }

      // Remove from list
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unpin message');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-discord-dark rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-discord-gray-light flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Pinned Messages</h2>
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
          {loading ? (
            <div className="text-discord-gray-lighter text-center py-8">Loading pinned messages...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-discord-gray-lighter text-center py-8">
              No pinned messages in this channel.
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedMessages.map((message) => {
                const user = users.get(message.user_id);
                const username = user?.username || user?.email || 'Unknown User';

                return (
                  <div
                    key={message.id}
                    className="bg-discord-gray rounded-lg p-4 hover:bg-discord-gray-light transition-colors cursor-pointer"
                    onClick={() => {
                      onMessageClick?.(message.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={username}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-discord-blue flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold text-sm">{username}</span>
                          <span className="text-discord-gray-lighter text-xs">
                            {formatDate(message.created_at)}
                          </span>
                          <span className="text-discord-gray-lighter text-xs">•</span>
                          <span className="text-discord-gray-lighter text-xs">
                            Pinned {formatDate(message.pinned_at)}
                          </span>
                        </div>
                        <div className="text-gray-100 text-sm">
                          <MessageContent content={message.content} />
                        </div>
                        {message.file_url && (
                          <div className="mt-2">
                            {message.file_type?.startsWith('image/') ? (
                              <img
                                src={message.file_url}
                                alt={message.file_name || 'Image'}
                                className="max-w-xs rounded-lg"
                              />
                            ) : (
                              <a
                                href={message.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-discord-blue hover:underline text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {message.file_name || 'File'}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Unpin this message?')) {
                            handleUnpin(message.id);
                          }
                        }}
                        className="text-discord-gray-lighter hover:text-white transition-colors p-1"
                        title="Unpin message"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

