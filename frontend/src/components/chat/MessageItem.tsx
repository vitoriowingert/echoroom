import { Message, User } from '../../types';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { MessageContent } from './MessageContent';
import { MessageReactions } from './MessageReactions';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

interface MessageItemProps {
  message: Message;
  user?: User;
  isOwn: boolean;
  showAvatar: boolean;
  showUsername: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  roomId?: string;
}

export function MessageItem({
  message,
  user,
  isOwn,
  showAvatar,
  showUsername,
  onEdit,
  onDelete,
  onPin,
  roomId,
}: MessageItemProps) {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const formatFullTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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

  const handleEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(t.chat.confirmDelete)) {
      onDelete(message.id);
    }
  };

  const handlePin = async () => {
    if (!onPin || !roomId) return;
    
    try {
      // Always get a fresh token before making the request
      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }
      
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/pins/messages/${message.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pin message');
      }

      onPin(message.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to pin message');
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-3 px-4 py-0.5 hover:bg-discord-gray/30 group">
        {showAvatar ? (
          <div className="flex-shrink-0 w-10">
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
        ) : (
          <div className="flex-shrink-0 w-10"></div>
        )}
        <div className="flex-1 min-w-0">
          <div className="bg-discord-gray-light rounded-lg p-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-discord-gray border border-discord-gray-light rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-blue resize-none text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                className="text-sm bg-discord-blue hover:bg-discord-blue-hover text-white px-3 py-1 rounded transition-colors"
              >
                {t.chat.save}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                className="text-sm bg-discord-gray hover:bg-discord-gray-lighter text-white px-3 py-1 rounded transition-colors"
              >
                {t.chat.cancel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-1 hover:bg-discord-gray/30 group/message-item transition-colors" data-message-id={message.id}>
      {showAvatar ? (
        <div className="flex-shrink-0 w-10">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username || 'User'}
              className="w-10 h-10 rounded-full cursor-pointer"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor()}`}
            >
              {getInitials()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 w-10"></div>
      )}
      <div className="flex-1 min-w-0">
        {showUsername && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-white font-semibold text-sm hover:underline cursor-pointer">
              {user?.username || user?.email || 'Unknown User'}
            </span>
            <span className="text-discord-gray-lighter text-xs">
              {formatFullTime(message.created_at)}
            </span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="flex-1 text-gray-100 text-sm leading-relaxed break-words min-w-0 select-text">
            {message.content && <MessageContent content={message.content} />}
            {message.file_url && (
              <div className="mt-2">
                {message.file_type?.startsWith('image/') ? (
                  <div className="rounded-lg overflow-hidden max-w-md cursor-pointer group/image">
                    <img
                      src={message.file_url}
                      alt={message.file_name || 'Image'}
                      className="max-w-full h-auto rounded-lg group-hover/image:opacity-90 transition-opacity"
                      onClick={() => window.open(message.file_url, '_blank')}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-discord-gray-light hover:bg-discord-gray-lighter rounded transition-colors max-w-md"
                  >
                    <svg className="w-6 h-6 text-discord-gray-lighter flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {message.file_name || 'File'}
                      </div>
                      {message.file_size && (
                        <div className="text-discord-gray-lighter text-xs">
                          {(message.file_size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
          {socket && token && (
            <MessageReactions
              messageId={message.id}
              socket={socket}
              token={token}
            />
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover/message-item:opacity-100 transition-opacity flex-shrink-0">
            {onPin && roomId && token && (
              <button
                onClick={handlePin}
                className="p-1 text-discord-gray-lighter hover:text-white hover:bg-discord-gray-light rounded transition-colors"
                title="Pin message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isOwn && onEdit && onDelete && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-discord-gray-lighter hover:text-white hover:bg-discord-gray-light rounded transition-colors"
                  title={t.chat.edit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-discord-gray-lighter hover:text-red-400 hover:bg-discord-gray-light rounded transition-colors"
                  title={t.chat.delete}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
