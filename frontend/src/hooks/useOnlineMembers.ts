import { useState, useEffect } from 'react';
import { User } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useOnlineMembers(roomId: string | null, token: string | null) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !token) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/users/rooms/${roomId}/online`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

    fetchMembers();

    // Refresh members every 30 seconds
    const interval = setInterval(fetchMembers, 30000);

    return () => clearInterval(interval);
  }, [roomId, token]);

  return { members, loading };
}

