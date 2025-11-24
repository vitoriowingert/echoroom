import { useState, FormEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, description?: string) => Promise<void>;
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onCreateRoom(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-gray rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">{t.rooms.createRoom}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className="block text-sm font-medium mb-2 text-gray-300">
              {t.rooms.roomName}
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
              placeholder={t.rooms.roomName}
            />
          </div>

          <div>
            <label
              htmlFor="room-description"
              className="block text-sm font-medium mb-2 text-gray-300"
            >
              {t.rooms.roomDescription}
            </label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue resize-none"
              placeholder={t.rooms.roomDescription}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-discord-gray-light hover:bg-discord-gray-lighter text-white py-2 px-4 rounded-lg transition-colors"
            >
              {t.chat.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-discord-blue hover:bg-discord-blue-hover text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.rooms.creating : t.rooms.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

