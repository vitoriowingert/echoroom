import { useState, useEffect } from 'react';
import { Server } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';

interface DiscoverServersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinServer: (serverId: string) => Promise<void>;
  discoverServers: () => Promise<Array<Server & { isMember: boolean }>>;
}

export function DiscoverServersModal({
  isOpen,
  onClose,
  onJoinServer,
  discoverServers,
}: DiscoverServersModalProps) {
  const { t } = useTranslation();
  const [servers, setServers] = useState<Array<Server & { isMember: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningServerId, setJoiningServerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadServers();
    }
  }, [isOpen]);

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const discovered = await discoverServers();
      setServers(discovered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
      console.error('Error discovering servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (serverId: string) => {
    if (joiningServerId) return; // Prevent multiple simultaneous joins

    setJoiningServerId(serverId);
    try {
      await onJoinServer(serverId);
      // Update the server's isMember status
      setServers((prev) =>
        prev.map((server) =>
          server.id === serverId ? { ...server, isMember: true } : server
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join server');
      console.error('Error joining server:', err);
    } finally {
      setJoiningServerId(null);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-discord-gray rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {t.servers.discoverServers || 'Discover Servers'}
          </h2>
          <button
            onClick={onClose}
            className="text-discord-gray-lighter hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-discord-gray-lighter">
            {t.common.loading || 'Loading servers...'}
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-8 text-discord-gray-lighter">
            {t.servers.noServersFound || 'No servers found'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-discord-dark rounded-lg p-4 hover:bg-discord-gray-light transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  {server.icon_url ? (
                    <img
                      src={server.icon_url}
                      alt={server.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getServerColor(
                        server.id
                      )}`}
                    >
                      {getServerInitials(server.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{server.name}</h3>
                    {server.description && (
                      <p className="text-discord-gray-lighter text-sm truncate">
                        {server.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(server.id)}
                  disabled={server.isMember || joiningServerId === server.id}
                  className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                    server.isMember
                      ? 'bg-discord-gray-light text-discord-gray-lighter cursor-not-allowed'
                      : joiningServerId === server.id
                      ? 'bg-discord-blue/50 text-white cursor-wait'
                      : 'bg-discord-blue hover:bg-discord-blue-hover text-white'
                  }`}
                >
                  {joiningServerId === server.id
                    ? t.servers.joining || 'Joining...'
                    : server.isMember
                    ? t.servers.joined || 'Joined'
                    : t.servers.join || 'Join Server'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

