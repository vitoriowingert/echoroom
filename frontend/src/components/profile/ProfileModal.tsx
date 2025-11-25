import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { notificationService } from '../../services/notification.service';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, updating } = useProfile();
  const { t, setLanguage } = useTranslation();
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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermission()
  );

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatar(profile.avatar || '');
      if (profile.preferences && Object.keys(profile.preferences).length > 0) {
        // Merge saved preferences with defaults, preserving all fields
        setPreferences((prev) => ({
          theme: profile.preferences?.theme || prev.theme,
          notifications: profile.preferences?.notifications ?? prev.notifications,
          soundEnabled: profile.preferences?.soundEnabled ?? prev.soundEnabled,
          showOnlineStatus: profile.preferences?.showOnlineStatus ?? prev.showOnlineStatus,
          language: profile.preferences?.language || prev.language,
          timezone: profile.preferences?.timezone || prev.timezone,
        }));
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(false);
    } else {
      // Update notification permission when modal opens
      setNotificationPermission(notificationService.getPermission());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // Always send preferences object to ensure it's saved
      const updates: {
        username?: string;
        avatar?: string;
        preferences: typeof preferences;
      } = {
        preferences,
      };

      if (username.trim()) {
        updates.username = username.trim();
      }

      if (avatar.trim()) {
        updates.avatar = avatar.trim();
      }

      await updateProfile(updates);
      // Update language immediately when changed
      if (updates.preferences?.language) {
        setLanguage(updates.preferences.language as any);
      }
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-discord-gray rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-discord-gray-light flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t.profile.userSettings}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-discord-gray-light rounded transition-colors"
          >
            <svg
              className="w-6 h-6 text-discord-gray-lighter"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {loading ? (
            <div className="text-center text-discord-gray-lighter py-8">{t.common.loading}</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                  {t.profile.profileUpdated}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Section */}
                <div className="bg-discord-dark rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t.profile.myAccount}</h3>

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
                        <label
                          htmlFor="avatar"
                          className="block text-sm font-medium text-gray-300 mb-2"
                        >
                          {t.profile.avatarUrl}
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
                          {t.profile.enterAvatarUrl}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {t.auth.username}
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white placeholder-discord-gray-lighter focus:outline-none focus:ring-2 focus:ring-discord-blue"
                        placeholder={t.auth.username}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {t.auth.email}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 bg-discord-dark/50 border border-discord-gray-light rounded-lg text-discord-gray-lighter cursor-not-allowed"
                      />
                      <p className="text-xs text-discord-gray-lighter mt-1">{t.profile.emailCannotChange}</p>
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="bg-discord-dark rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t.profile.preferences}</h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="theme"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {t.profile.theme}
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
                      <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {t.profile.language}
                      </label>
                      <select
                        id="language"
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({ ...preferences, language: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
                      >
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {t.profile.timezone}
                      </label>
                      <select
                        id="timezone"
                        value={preferences.timezone}
                        onChange={(e) =>
                          setPreferences({ ...preferences, timezone: e.target.value })
                        }
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label
                              htmlFor="notifications"
                              className="text-sm font-medium text-gray-300"
                            >
                              {t.profile.enableNotifications}
                            </label>
                            <p className="text-xs text-discord-gray-lighter">
                              {t.profile.notificationsDescription}
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
                        {preferences.notifications && notificationPermission !== 'granted' && (
                          <div className="flex items-center gap-2">
                            {notificationPermission === 'default' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const permission = await notificationService.requestPermission();
                                  setNotificationPermission(permission);
                                  if (permission === 'granted') {
                                    setSuccess(true);
                                    setTimeout(() => setSuccess(false), 3000);
                                  } else if (permission === 'denied') {
                                    setError('Notification permission denied. Please enable it in your browser settings.');
                                  }
                                }}
                                className="text-xs bg-discord-blue hover:bg-discord-blue-hover text-white px-3 py-1.5 rounded transition-colors"
                              >
                                {t.profile.requestNotificationPermission}
                              </button>
                            ) : (
                              <p className="text-xs text-yellow-400">
                                {t.profile.notificationsBlocked}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label htmlFor="soundEnabled" className="text-sm font-medium text-gray-300">
                            {t.profile.soundEffects}
                          </label>
                          <p className="text-xs text-discord-gray-lighter">
                            {t.profile.soundDescription}
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
                          <label
                            htmlFor="showOnlineStatus"
                            className="text-sm font-medium text-gray-300"
                          >
                            {t.profile.showOnlineStatus}
                          </label>
                          <p className="text-xs text-discord-gray-lighter">
                            {t.profile.onlineStatusDescription}
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
                <div className="space-y-4 pt-4 border-t border-discord-gray-light">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 bg-discord-gray-light hover:bg-discord-gray-lighter text-white rounded-lg transition-colors"
                    >
                      {t.profile.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-2 bg-discord-blue hover:bg-discord-blue-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? t.profile.saving : t.profile.saveChanges}
                    </button>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="pt-4 border-t border-discord-gray-light">
                    <div className="bg-discord-dark rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-white mb-2">{t.profile.myAccount}</h3>
                      <p className="text-xs text-discord-gray-lighter mb-4">
                        Sign out of your account. You'll need to sign in again to access your account.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await signOut();
                            navigate('/login');
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to sign out');
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                      >
                        {t.auth.signOut}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

