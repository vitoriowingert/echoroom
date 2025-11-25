import { useState, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useOnlineMembers(roomId: string | null, token: string | null) {
  const { getToken } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !token) {
      setMembers([]);
      return;
    }

    const fetchMembers = async (currentToken: string = token) => {
      setLoading(true);
      try {
        let response = await fetch(`${API_URL}/api/users/rooms/${roomId}/online`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        // If token expired, try to get a fresh one and retry once
        if (response.status === 401) {
          const freshToken = await getToken();
          if (freshToken && freshToken !== currentToken) {
            response = await fetch(`${API_URL}/api/users/rooms/${roomId}/online`, {
              headers: {
                Authorization: `Bearer ${freshToken}`,
              },
            });
          }
        }

        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        }
      } catch (error) {
        console.error('Failed to fetch online members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers(token);

    // Refresh members every 30 seconds
    const interval = setInterval(() => fetchMembers(token), 30000);

    return () => clearInterval(interval);
  }, [roomId, token, getToken]);

  return { members, loading };
}

