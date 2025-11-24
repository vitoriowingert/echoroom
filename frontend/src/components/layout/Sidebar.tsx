import { Room, Server } from '../../types';
import { RoomList } from '../rooms/RoomList';
import { CreateRoomModal } from '../rooms/CreateRoomModal';
import { CreateServerModal } from '../servers/CreateServerModal';
import { DiscoverServersModal } from '../servers/DiscoverServersModal';
import { InviteModal } from '../servers/InviteModal';
import { UserProfile } from './UserProfile';
import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface SidebarProps {
  servers: Server[];
  rooms: Room[];
  selectedServerId: string | null;
  selectedRoomId: string | null;
  onSelectServer: (serverId: string | null) => void;
  onSelectRoom: (roomId: string) => void;
  onCreateServer: (name: string, description?: string, iconUrl?: string) => Promise<void>;
  onCreateRoom: (name: string, description?: string, serverId?: string) => Promise<void>;
  onJoinServer: (serverId: string) => Promise<void>;
  discoverServers: () => Promise<Array<Server & { isMember: boolean }>>;
  onToggleMembers?: () => void;
  loading?: boolean;
  unreadCountsByRoom?: Record<string, number>;
}

export function Sidebar({
  servers,
  rooms,
  selectedServerId,
  selectedRoomId,
  onSelectServer,
  onSelectRoom,
  onCreateServer,
  onCreateRoom,
  onJoinServer,
  discoverServers,
  onToggleMembers,
  loading,
  unreadCountsByRoom,
}: SidebarProps) {
  const { t } = useTranslation();
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isDiscoverServersModalOpen, setIsDiscoverServersModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const selectedServer = selectedServerId ? servers.find(s => s.id === selectedServerId) : null;

  const getServerInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getServerColor = (serverId: string) => {
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
    const index = serverId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex h-full bg-discord-dark">
      {/* Server Icons Column */}
      <div className="w-16 bg-discord-darkest flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-thin select-none">
        {/* Server icons */}
        {servers.map((server) => {
          const isSelected = selectedServerId === server.id;
          return (
            <button
              key={server.id}
              onClick={() => onSelectServer(server.id)}
              className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-white font-bold text-sm hover:bg-opacity-90 group relative ${
                isSelected ? 'rounded-xl' : ''
              } ${server.icon_url ? '' : getServerColor(server.id)}`}
              title={server.name}
              style={server.icon_url ? { backgroundImage: `url(${server.icon_url})`, backgroundSize: 'cover' } : {}}
            >
              {isSelected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></span>
              )}
              {!server.icon_url && (
                <span className="text-xs">{getServerInitials(server.name)}</span>
              )}
            </button>
          );
        })}
        
        {/* Divider */}
        {servers.length > 0 && (
          <div className="w-8 h-0.5 bg-discord-gray-light rounded-full my-1"></div>
        )}
        
        {/* Add server button */}
        <button
          onClick={() => setIsCreateServerModalOpen(true)}
          className="w-12 h-12 rounded-2xl bg-discord-gray hover:rounded-xl hover:bg-discord-green transition-all duration-200 flex items-center justify-center text-discord-green hover:text-white group relative"
          title="Adicionar um servidor"
        >
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full group-hover:h-8 transition-all duration-200"></span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        
        {/* Compass/Explore button at bottom */}
        <div className="mt-auto">
          <button
            onClick={() => setIsDiscoverServersModalOpen(true)}
            className="w-12 h-12 rounded-2xl bg-discord-gray hover:rounded-xl hover:bg-discord-green transition-all duration-200 flex items-center justify-center text-discord-green hover:text-white group relative"
            title="Explorar servidores públicos"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-full group-hover:h-8 transition-all duration-200"></span>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Sidebar */}
      <div className="w-60 bg-discord-dark flex flex-col h-full select-none">
        {/* Server Header */}
        {selectedServer ? (
          <div className="h-12 px-4 border-b border-discord-gray-light flex items-center justify-between shadow-sm hover:bg-discord-gray/50 transition-colors">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h2 className="text-white font-semibold text-base truncate">{selectedServer.name}</h2>
              <button className="flex-shrink-0 text-discord-gray-lighter hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex-shrink-0 text-discord-gray-lighter hover:text-white transition-colors p-1"
              title="Invite people"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="h-12 px-4 border-b border-discord-gray-light flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h2 className="text-discord-gray-lighter font-semibold text-base truncate">{t.servers.selectServer || "Select a server"}</h2>
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
        {!selectedServer ? (
          <div className="p-4 text-center text-discord-gray-lighter text-sm">
            {t.servers.selectServer || "Select a server to view channels"}
          </div>
          ) : loading ? (
            <div className="p-4 text-center text-discord-gray-lighter text-sm">
              {t.rooms.loading}
            </div>
          ) : (
            <div className="py-2">
              {rooms.length > 0 && (
                <>
                  {/* Add channel button - always visible when server is selected */}
                  <div className="px-2 py-1.5 flex items-center justify-between group">
                    <div className="flex items-center gap-1 text-discord-gray-lighter text-xs font-semibold uppercase select-none">
                      {t.rooms.textChannels || "Canais"}
                    </div>
                    <button
                      onClick={() => setIsCreateRoomModalOpen(true)}
                      className="opacity-100 text-discord-gray-lighter hover:text-white transition-all p-0.5 rounded hover:bg-discord-gray-light"
                      title={t.rooms.createRoom}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <RoomList
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={onSelectRoom}
                    onToggleMembers={onToggleMembers}
                    unreadCountsByRoom={unreadCountsByRoom}
                  />
                </>
              )}
              
              {rooms.length === 0 && !loading && selectedServer && (
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="text-discord-gray-lighter text-xs font-semibold uppercase">
                      {t.rooms.textChannels || "Canais de Texto"}
                    </div>
                    <button
                      onClick={() => setIsCreateRoomModalOpen(true)}
                      className="opacity-100 text-discord-gray-lighter hover:text-white transition-all p-0.5 rounded"
                      title={t.rooms.createRoom}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 text-center text-discord-gray-lighter text-sm mb-3">
                    {t.rooms.noRooms}
                  </div>
                  <button
                    onClick={() => setIsCreateRoomModalOpen(true)}
                    className="w-full px-3 py-2 bg-discord-gray-light hover:bg-discord-gray-lighter text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.rooms.createRoom || "Criar Canal"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <UserProfile />

        <CreateRoomModal
          isOpen={isCreateRoomModalOpen}
          onClose={() => setIsCreateRoomModalOpen(false)}
          onCreateRoom={(name, description) => onCreateRoom(name, description, selectedServerId || undefined)}
        />
        <CreateServerModal
          isOpen={isCreateServerModalOpen}
          onClose={() => setIsCreateServerModalOpen(false)}
          onCreateServer={onCreateServer}
        />
        <DiscoverServersModal
          isOpen={isDiscoverServersModalOpen}
          onClose={() => setIsDiscoverServersModalOpen(false)}
          onJoinServer={onJoinServer}
          discoverServers={discoverServers}
        />
        
        {selectedServerId && (
          <InviteModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            serverId={selectedServerId}
          />
        )}
      </div>
    </div>
  );
}

