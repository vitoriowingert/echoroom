import { useState, useEffect } from 'react';
import { Room } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onUpdate?: () => void;
}

export function ChannelSettingsModal({
  isOpen,
  onClose,
  room,
  onUpdate,
}: ChannelSettingsModalProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    if (isOpen && room) {
      setName(room.name);
      setDescription(room.description || '');
    }
  }, [isOpen, room]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      // Always get a fresh token before making the request
      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update channel');
      }

      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Always get a fresh token before making the request
      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/rooms/${room.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete channel');
      }

      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-discord-dark rounded-lg w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-discord-gray-light flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Channel Settings</h2>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-discord-gray-lighter mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-discord-gray border border-discord-gray-light rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-gray-lighter mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-discord-gray border border-discord-gray-light rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blue resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Channel
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-discord-gray-light hover:bg-discord-gray-lighter text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

