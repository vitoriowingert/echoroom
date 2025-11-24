import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';

interface ReactionCount {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  socket: Socket | null;
  token: string | null;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export function MessageReactions({ messageId, socket, token }: MessageReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!messageId || !token) return;

    const fetchReactions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reactions/messages/${messageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReactions(data.counts || []);
        }
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
      }
    };

    fetchReactions();

    // Listen for reaction updates
    const handleReactionAdded = (data: { messageId: string; counts: ReactionCount[] }) => {
      if (data.messageId === messageId) {
        setReactions(data.counts);
      }
    };

    const handleReactionRemoved = (data: { messageId: string; counts: ReactionCount[] }) => {
      if (data.messageId === messageId) {
        setReactions(data.counts);
      }
    };

    if (socket) {
      socket.on('reaction_added', handleReactionAdded);
      socket.on('reaction_removed', handleReactionRemoved);
    }

    return () => {
      if (socket) {
        socket.off('reaction_added', handleReactionAdded);
        socket.off('reaction_removed', handleReactionRemoved);
      }
    };
  }, [messageId, token, socket]);

  const handleToggleReaction = async (emoji: string) => {
    if (!socket || !token || !user) return;

    try {
      const response = await fetch(`${API_URL}/api/reactions/messages/${messageId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        setReactions(data.counts || []);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const hasUserReacted = (emoji: string): boolean => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction ? reaction.users.includes(user?.id || '') : false;
  };

  if (reactions.length === 0 && !showPicker) {
    return (
      <div className="mt-1">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-discord-gray-lighter hover:text-white px-1.5 py-0.5 rounded hover:bg-discord-gray-light transition-colors"
        >
          <span className="mr-1">😀</span>
          Add Reaction
        </button>
        {showPicker && (
          <div className="absolute z-10 mt-1 bg-discord-gray-light rounded-lg p-2 shadow-lg border border-discord-gray">
            <div className="flex flex-wrap gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleToggleReaction(emoji);
                    setShowPicker(false);
                  }}
                  className="text-xl hover:bg-discord-gray rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1 items-center">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction.emoji)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            hasUserReacted(reaction.emoji)
              ? 'bg-discord-blue/30 text-white border border-discord-blue'
              : 'bg-discord-gray-light text-discord-gray-lighter hover:bg-discord-gray hover:text-white'
          }`}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-xs text-discord-gray-lighter hover:text-white px-1.5 py-0.5 rounded hover:bg-discord-gray-light transition-colors"
      >
        <span className="mr-1">😀</span>
      </button>
      {showPicker && (
        <div className="absolute z-10 mt-1 bg-discord-gray-light rounded-lg p-2 shadow-lg border border-discord-gray">
          <div className="flex flex-wrap gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleToggleReaction(emoji);
                  setShowPicker(false);
                }}
                className="text-xl hover:bg-discord-gray rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

