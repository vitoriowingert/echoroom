import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

export function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, updateProfile, updating } = useProfile();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'light' | 'dark' | 'auto',
    notifications: true,
    soundEnabled: true,
    showOnlineStatus: true,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatar(profile.avatar || '');
      if (profile.preferences) {
        setPreferences((prev) => ({ ...prev, ...profile.preferences }));
      }
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        username: username.trim() || undefined,
        avatar: avatar.trim() || undefined,
        preferences,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const getInitials = () => {
    const name = username || user?.email?.split('@')[0] || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = () => {
    if (!user) return 'bg-gray-500';
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-discord-darkest">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">User Settings</h1>
          <p className="text-discord-gray-lighter">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="bg-discord-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">My Account</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username || 'User'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-semibold ${getAvatarColor()}`}
                    >
                      {getInitials()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    id="avatar"
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white placeholder-discord-gray-lighter focus:outline-none focus:ring-2 focus:ring-discord-blue"
                  />
                  <p className="text-xs text-discord-gray-lighter mt-1">
                    Enter a URL to your avatar image
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white placeholder-discord-gray-lighter focus:outline-none focus:ring-2 focus:ring-discord-blue"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-discord-dark/50 border border-discord-gray-light rounded-lg text-discord-gray-lighter cursor-not-allowed"
                />
                <p className="text-xs text-discord-gray-lighter mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-discord-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  id="theme"
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences({ ...preferences, theme: e.target.value as any })
                  }
                  className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
                >
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="notifications" className="text-sm font-medium text-gray-300">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-discord-gray-lighter">
                      Receive notifications for new messages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="notifications"
                      checked={preferences.notifications}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notifications: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-discord-gray-light peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-discord-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-blue"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="soundEnabled" className="text-sm font-medium text-gray-300">
                      Sound Effects
                    </label>
                    <p className="text-xs text-discord-gray-lighter">
                      Play sounds for new messages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="soundEnabled"
                      checked={preferences.soundEnabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, soundEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-discord-gray-light peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-discord-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-blue"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="showOnlineStatus" className="text-sm font-medium text-gray-300">
                      Show Online Status
                    </label>
                    <p className="text-xs text-discord-gray-lighter">
                      Let others see when you're online
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="showOnlineStatus"
                      checked={preferences.showOnlineStatus}
                      onChange={(e) =>
                        setPreferences({ ...preferences, showOnlineStatus: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-discord-gray-light peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-discord-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-blue"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="px-6 py-2 bg-discord-gray-light hover:bg-discord-gray-lighter text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

