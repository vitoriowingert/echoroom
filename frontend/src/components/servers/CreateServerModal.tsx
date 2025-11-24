import { useState, FormEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateServer: (name: string, description?: string, iconUrl?: string) => Promise<void>;
}

export function CreateServerModal({ isOpen, onClose, onCreateServer }: CreateServerModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onCreateServer(name.trim(), description.trim() || undefined, iconUrl.trim() || undefined);
      setName('');
      setDescription('');
      setIconUrl('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-gray rounded-lg p-6 w-full max-w-md">
        <h2 className="text-white text-xl font-semibold mb-4">{t.servers.createServer}</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-discord-gray-lighter text-sm font-medium mb-2">
              {t.servers.serverName} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-discord-dark border border-discord-gray-light rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
              placeholder={t.servers.serverName}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-discord-gray-lighter text-sm font-medium mb-2">
              {t.servers.serverDescription}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-discord-dark border border-discord-gray-light rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-blue resize-none"
              placeholder={t.servers.serverDescription}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-discord-gray-lighter text-sm font-medium mb-2">
              {t.servers.iconUrl}
            </label>
            <input
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="w-full bg-discord-dark border border-discord-gray-light rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
              placeholder="https://example.com/icon.png"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-discord-gray-light hover:bg-discord-gray-lighter text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.chat.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.servers.creating : t.servers.createServer}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

