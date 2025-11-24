import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { AuthForm } from '../components/auth/AuthForm';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string, username?: string) => {
    try {
      setError(null);
      if (isSignUp) {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest p-4">
      <div className="w-full max-w-md">
        <div className="bg-discord-gray rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">EchoRoom</h1>
          <p className="text-center text-discord-gray-lighter mb-8">
            {isSignUp ? t.auth.createAccount : t.auth.welcome}
          </p>

          <AuthForm
            onSubmit={handleSubmit}
            isSignUp={isSignUp}
            error={error}
          />

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-discord-blue hover:text-discord-blue-hover text-sm"
            >
              {isSignUp ? t.auth.alreadyHaveAccount : t.auth.dontHaveAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

