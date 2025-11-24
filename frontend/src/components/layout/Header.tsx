import { useState, useRef } from 'react';
import { Room } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { NotificationsDropdown } from './NotificationsDropdown';

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

interface HeaderProps {
  room: Room | null;
  onSearchClick?: () => void;
  unreadCount?: number;
  notifications?: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (roomId: string, messageId: string) => void;
}

export function Header({
  room,
  onSearchClick,
  unreadCount = 0,
  notifications = [],
  onMarkAllAsRead,
  onNotificationClick,
}: HeaderProps) {
  const { t } = useTranslation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="h-12 bg-discord-gray border-b border-discord-gray-light flex items-center justify-between px-4 shadow-sm select-none">
      {/* Left side - Room info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {room ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-discord-gray-lighter text-xl flex-shrink-0 font-light">#</span>
              <h1 className="text-white font-semibold text-base truncate">{room.name}</h1>
            </div>
            {room.description && (
              <div className="hidden lg:flex items-center">
                <div className="w-1 h-1 bg-discord-gray-lighter rounded-full mx-2"></div>
                <span className="text-discord-gray-lighter text-sm truncate">
                  {room.description}
                </span>
              </div>
            )}
          </>
        ) : (
          <h1 className="text-white font-semibold text-base">{t.chat.selectRoom || "Mensagens diretas"}</h1>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {room && (
          <>
            {/* Phone call */}
            <button
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
              title="Iniciar chamada de voz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
            
            {/* Video call */}
            <button
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
              title="Iniciar chamada de vídeo"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </button>
            
            {/* Pin */}
            <button
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
              title="Mensagens fixadas"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Add user */}
            <button
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
              title="Adicionar amigos ao grupo"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </button>
            
            {/* People/Group */}
            <button
              className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
              title="Membros do grupo"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </button>
          </>
        )}
        
        {/* Search */}
        {room && onSearchClick && (
          <button
            onClick={onSearchClick}
            className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
            title={t.searchButton || "Buscar"}
          >
            <svg
              className="w-5 h-5"
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
          </button>
        )}
        
        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationButtonRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 hover:bg-discord-gray-light rounded transition-colors relative text-discord-gray-lighter hover:text-white"
            title={t.notifications.notifications}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={() => {
                onMarkAllAsRead?.();
                setIsNotificationsOpen(false);
              }}
              onNotificationClick={onNotificationClick}
              onClose={() => setIsNotificationsOpen(false)}
            />
          )}
        </div>
        
        {/* Help/Question mark */}
        <button
          className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
          title="Ajuda"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

