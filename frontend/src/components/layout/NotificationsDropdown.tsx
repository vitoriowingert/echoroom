import { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface NotificationItem {
  id: string;
  messageId: string;
  roomId: string;
  roomName?: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onNotificationClick?: (roomId: string, messageId: string) => void;
  onClose?: () => void;
}

export function NotificationsDropdown({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onNotificationClick,
  onClose,
}: NotificationsDropdownProps) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t.common.now;
    if (minutes < 60) return `${minutes}${t.common.minutesAgo}`;
    if (hours < 24) return `${hours}${t.common.hoursAgo}`;
    if (days < 7) return `${days}${t.common.daysAgo}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (onNotificationClick) {
      onNotificationClick(notification.roomId, notification.messageId);
    }
    onClose?.();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-discord-dark rounded-lg shadow-xl border border-discord-gray-light z-50 max-h-96 flex flex-col"
    >
      <div className="p-4 border-b border-discord-gray-light flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">
          {t.notifications.notifications} {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-discord-blue hover:text-discord-blue-hover transition-colors"
          >
            {t.chat.markAllAsRead}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-discord-gray-lighter text-sm">
            {t.notifications.empty}
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-discord-gray transition-colors border-l-2 ${
                  notification.read
                    ? 'border-transparent'
                    : 'border-discord-blue bg-discord-gray/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white font-semibold text-sm truncate">
                        {notification.username}
                      </span>
                      {notification.roomName && (
                        <span className="text-discord-gray-lighter text-xs truncate">
                          in {notification.roomName}
                        </span>
                      )}
                    </div>
                    <p className="text-discord-gray-lighter text-sm line-clamp-2 mb-1">
                      {notification.content}
                    </p>
                    <span className="text-discord-gray-lighter text-xs">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-discord-blue rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

