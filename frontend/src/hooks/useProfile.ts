import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../config/supabase';
import { User } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  soundEnabled?: boolean;
  showOnlineStatus?: boolean;
  language?: string;
  timezone?: string;
}

export interface UserProfile extends User {
  preferences?: UserPreferences;
}

export function useProfile() {
  const { user, getToken, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (currentToken?: string | null) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = currentToken ?? await getToken();
      if (!token) {
        setError('Not authenticated');
        setProfile(null);
        setLoading(false);
        return;
      }

      let response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If token expired, try to get a fresh one and retry once
      if (response.status === 401) {
        const freshToken = await getToken();
        if (freshToken && freshToken !== token) {
          // Retry with fresh token
          response = await fetch(`${API_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
          });
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          setProfile(null);
        } else {
          throw new Error('Failed to fetch profile');
        }
        return;
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    username?: string;
    avatar?: string;
    preferences?: UserPreferences;
  }) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    setUpdating(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      let response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      // If token expired, try to get a fresh one and retry once
      if (response.status === 401) {
        const freshToken = await getToken();
        if (freshToken && freshToken !== token) {
          // Retry with fresh token
          response = await fetch(`${API_URL}/api/users/me`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${freshToken}`,
            },
            body: JSON.stringify(updates),
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);

      // Refresh the user session to get updated metadata
      await supabase.auth.refreshSession();
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to avoid unnecessary re-fetches

  return {
    profile,
    loading,
    updating,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}

