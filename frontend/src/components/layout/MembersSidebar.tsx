import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';

interface MembersSidebarProps {
  members: User[];
  loading?: boolean;
}

export function MembersSidebar({ members, loading }: MembersSidebarProps) {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const getInitials = (username?: string, email?: string) => {
    const name = username || email?.split('@')[0] || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
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
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="w-60 bg-discord-dark flex flex-col h-full">
        <div className="p-4 border-b border-discord-gray">
          <h3 className="text-discord-gray-lighter text-xs font-semibold uppercase">
            {t.members.onlineMembers}
          </h3>
        </div>
        <div className="flex-1 p-4">
          <div className="text-discord-gray-lighter text-sm">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-discord-dark flex flex-col h-full select-none">
      <div className="px-4 py-3 border-b border-discord-gray-light">
        <h3 className="text-discord-gray-lighter text-xs font-semibold uppercase">
          {t.members.onlineMembers || "Membros"} — {members.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {members.length === 0 ? (
          <div className="text-discord-gray-lighter text-sm p-4 text-center">
            {t.members.noMembersOnline}
          </div>
        ) : (
          <div className="space-y-0.5">
            {members.map((member) => {
              const isCurrentUser = member.id === currentUser?.id;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-discord-gray transition-colors cursor-pointer group ${
                    isCurrentUser ? 'bg-discord-gray/50' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.username || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(
                          member.id
                        )}`}
                      >
                        {getInitials(member.username, member.email)}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green border-2 border-discord-dark rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {member.username || member.email || 'Unknown User'}
                      {isCurrentUser && (
                        <span className="text-discord-gray-lighter text-xs ml-1">({t.members.you || "você"})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

