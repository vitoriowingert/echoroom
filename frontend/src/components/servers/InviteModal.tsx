import { useState, useEffect } from 'react';
import { useInvites } from '../../hooks/useInvites';
import { useAuth } from '../../hooks/useAuth';
import { ServerInvite } from '../../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  onInviteCreated?: (invite: ServerInvite) => void;
}

export function InviteModal({ isOpen, onClose, serverId, onInviteCreated }: InviteModalProps) {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { invites, loading, createInvite, deleteInvite } = useInvites(token, serverId);
  const [expiresIn, setExpiresIn] = useState<number>(7); // days
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getToken().then(setToken).catch(console.error);
    }
  }, [isOpen, getToken]);

  if (!isOpen) return null;

  const handleCreateInvite = async () => {
    setError(null);
    setCreating(true);

    try {
      const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined;
      const invite = await createInvite(serverId, expiresAt, maxUses);
      onInviteCreated?.(invite);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar convite');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja deletar este convite?')) {
      return;
    }

    try {
      await deleteInvite(inviteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao deletar convite');
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      // Show toast or feedback
    });
  };

  const formatExpiresAt = (expiresAt?: string) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-discord-gray-light flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Server Invites</h2>
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
          {/* Create new invite */}
          <div className="mb-6 p-4 bg-discord-gray rounded-lg">
            <h3 className="text-white font-semibold mb-4">Create New Invite</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-gray-lighter mb-2">
                  Expires in (days, 0 for never)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-discord-dark border border-discord-gray-light rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-gray-lighter mb-2">
                  Max uses (leave empty for unlimited)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxUses || ''}
                  onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-3 py-2 bg-discord-dark border border-discord-gray-light rounded text-white"
                  placeholder="Unlimited"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                onClick={handleCreateInvite}
                disabled={creating}
                className="w-full px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </button>
            </div>
          </div>

          {/* Existing invites */}
          <div>
            <h3 className="text-white font-semibold mb-4">Active Invites</h3>
            
            {loading ? (
              <div className="text-discord-gray-lighter text-center py-4">Loading...</div>
            ) : invites.length === 0 ? (
              <div className="text-discord-gray-lighter text-center py-4">No invites created yet</div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 bg-discord-gray rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-discord-blue font-mono text-sm">{invite.code}</code>
                        <button
                          onClick={() => copyInviteLink(invite.code)}
                          className="text-discord-gray-lighter hover:text-white transition-colors"
                          title="Copy invite link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-discord-gray-lighter">
                        Uses: {invite.use_count} / {invite.max_uses || '∞'} • Expires: {formatExpiresAt(invite.expires_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete invite"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

