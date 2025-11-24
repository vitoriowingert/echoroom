import { useState, FormEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface AuthFormProps {
  onSubmit: (email: string, password: string, username?: string) => void;
  isSignUp: boolean;
  error: string | null;
}

export function AuthForm({ onSubmit, isSignUp, error }: AuthFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, isSignUp ? username : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignUp && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300">
            {t.auth.username}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
            placeholder={t.auth.username}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
          {t.auth.email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
          placeholder={t.auth.email}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
          {t.auth.password}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-2 bg-discord-dark border border-discord-gray-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-discord-blue"
          placeholder="********"
        />
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-discord-blue hover:bg-discord-blue-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {isSignUp ? t.auth.signUp : t.auth.signIn}
      </button>
    </form>
  );
}

