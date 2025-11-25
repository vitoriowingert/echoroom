import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { User as AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Update user state based on session and event
      if (session?.user) {
        // Always update user when we have a valid session
        setUser(mapSupabaseUser(session.user));
      } else {
        // Only clear user on explicit sign out
        // This prevents logout when refresh temporarily fails or other transient errors
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        // For all other events without session, preserve current user state
        // This prevents accidental logout from refresh failures
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (supabaseUser: User): AppUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
      avatar: supabaseUser.user_metadata?.avatar_url,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      setUser(mapSupabaseUser(data.user));
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    if (data.user) {
      setUser(mapSupabaseUser(data.user));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      // First, try to get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        // Check if token is close to expiring (within 5 minutes)
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
          // Only refresh if token expires within 5 minutes
          if (expiresIn < 300) {
            // Token is close to expiring, try to refresh
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshData.session?.access_token) {
                return refreshData.session.access_token;
              }
            } catch (refreshError) {
              // If refresh fails, use current token
              console.warn('Failed to refresh session, using current token:', refreshError);
            }
          }
        }
        return session.access_token;
      }

      // No session available, try to refresh in case there's a refresh token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && refreshData.session?.access_token) {
        return refreshData.session.access_token;
      }

      // No valid session available
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      // Fallback: try to get current session even if refresh failed
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session?.access_token || null;
      } catch (fallbackError) {
        console.error('Error getting session as fallback:', fallbackError);
        return null;
      }
    }
  }, []);

  const refreshUser = async (): Promise<void> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(mapSupabaseUser(session.user));
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, getToken, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

