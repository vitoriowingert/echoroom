import { useState, useEffect, useRef } from 'react';
import { Message, User } from '../../types';
import { HighlightedText } from './HighlightedText';
import { useTranslation } from '../../i18n/useTranslation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  token: string | null;
  users: Map<string, User>;
  currentUserId: string;
  onMessageClick?: (messageId: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  roomId,
  token,
  users,
  currentUserId: _currentUserId,
  onMessageClick,
}: SearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchMessages = async () => {
      if (!query.trim() || !roomId || !token) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/rooms/${roomId}/messages/search?q=${encodeURIComponent(query)}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search messages');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search messages');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, roomId, token, API_URL]);

  const handleMessageClick = (message: Message) => {
    if (onMessageClick) {
      onMessageClick(message.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-discord-gray rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-discord-gray-light">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">{t.search.searchMessages}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors"
            >
              <svg
                className="w-5 h-5 text-discord-gray-lighter"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.searchMessages}
              className="w-full px-4 py-2 pl-10 bg-discord-dark border border-discord-gray-light rounded-lg text-white placeholder-discord-gray-lighter focus:outline-none focus:ring-2 focus:ring-discord-blue"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-discord-gray-lighter"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loading && (
            <div className="text-center text-discord-gray-lighter py-8">{t.search.searching}</div>
          )}

          {error && (
            <div className="text-center text-red-400 py-8">{error}</div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="text-center text-discord-gray-lighter py-8">
              {t.search.noResults} "{query}"
            </div>
          )}

          {!loading && !error && !query.trim() && (
            <div className="text-center text-discord-gray-lighter py-8">
              {t.search.typeToSearch}
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-1">
              <div className="text-discord-gray-lighter text-xs font-semibold mb-2 px-2">
                {results.length} {results.length === 1 ? t.search.result : t.search.resultsFound}
              </div>
              {results.map((message) => {
                const user = users.get(message.user_id);
                const formatTime = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                  }) + ' ' + date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                };

                const getInitials = () => {
                  const name = user?.username || user?.email?.split('@')[0] || 'U';
                  return name.charAt(0).toUpperCase();
                };

                const getAvatarColor = () => {
                  if (!user) return 'bg-gray-500';
                  const colors = [
                    'bg-red-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-indigo-500',
                    'bg-teal-500',
                  ];
                  const index = user.id.charCodeAt(0) % colors.length;
                  return colors[index];
                };

                return (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className="cursor-pointer hover:bg-discord-dark/40 rounded p-3 transition-colors border-b border-discord-gray/30 last:border-0"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username || 'User'}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor()}`}
                          >
                            {getInitials()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white font-semibold text-sm">
                            {user?.username || user?.email || 'Unknown User'}
                          </span>
                          <span className="text-discord-gray-lighter text-xs">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <div className="text-gray-100 text-sm whitespace-pre-wrap break-words">
                          <HighlightedText text={message.content} query={query} />
                        </div>
                      </div>
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

