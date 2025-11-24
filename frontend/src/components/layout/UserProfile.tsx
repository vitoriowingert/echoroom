import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { ProfileModal } from '../profile/ProfileModal';

export function UserProfile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!user) return null;

  const getInitials = () => {
    const name = user.username || user.email?.split('@')[0] || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = () => {
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
    <div className="h-14 bg-discord-dark border-t border-discord-gray-light flex items-center justify-between px-2 select-none">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username || 'User'}
              className="w-8 h-8 rounded-full cursor-pointer"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer ${getAvatarColor()}`}
            >
              {getInitials()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green border-2 border-discord-dark rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {user.username || user.email || 'Unknown User'}
          </div>
          <div className="text-discord-gray-lighter text-xs">{t.common.online || "Disponível"}</div>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {/* Microphone */}
        <button
          className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
          title="Microfone"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Headphones */}
        <button
          className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
          title="Fones de ouvido"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Settings */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="p-1.5 hover:bg-discord-gray-light rounded transition-colors text-discord-gray-lighter hover:text-white"
          title={t.profile.userSettings || "Configurações do usuário"}
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

