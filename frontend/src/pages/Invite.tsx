import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInvites } from '../hooks/useInvites';
import { ServerInvite } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const { acceptInvite } = useInvites(null, null);
  const [invite, setInvite] = useState<ServerInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('Invalid invite code');
      setLoading(false);
      return;
    }

    const fetchInvite = async () => {
      try {
        const response = await fetch(`${API_URL}/api/invites/${code}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Invite code not found');
          } else {
            setError('Failed to load invite');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInvite(data);
      } catch (err) {
        setError('Failed to load invite');
        console.error('Error fetching invite:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [code]);

  const handleAccept = async () => {
    if (!code || !user) {
      setError('You must be logged in to accept an invite');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('You must be logged in to accept an invite');
        return;
      }

      const response = await fetch(`${API_URL}/api/invites/${code}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invite');
      }

      // Redirect to the server
      if (invite) {
        navigate(`/chat?server=${invite.server_id}`);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="text-white text-xl">Loading invite...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded"
          >
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
      <div className="bg-discord-dark rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Server Invite</h1>
        
        {invite && (
          <div className="mb-6">
            <div className="text-discord-gray-lighter mb-2">
              You've been invited to join a server
            </div>
            <div className="text-white font-semibold">
              Server ID: {invite.server_id.substring(0, 8)}...
            </div>
            {invite.expires_at && (
              <div className="text-discord-gray-lighter text-sm mt-1">
                Expires: {new Date(invite.expires_at).toLocaleDateString()}
              </div>
            )}
            {invite.max_uses && (
              <div className="text-discord-gray-lighter text-sm mt-1">
                Uses: {invite.use_count} / {invite.max_uses}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-400 text-sm">{error}</div>
        )}

        {!user ? (
          <div>
            <div className="text-discord-gray-lighter mb-4">
              You need to be logged in to accept this invite.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded transition-colors"
            >
              Log In
            </button>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Invite'}
          </button>
        )}
      </div>
    </div>
  );
}

