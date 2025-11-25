import { useState, useEffect, useMemo } from 'react';
import { Message, User } from '../types';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useMessageUsers(messages: Message[], token: string | null) {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);

  const userIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((msg) => ids.add(msg.user_id));
    return Array.from(ids);
  }, [messages]);

  useEffect(() => {
    if (userIds.length === 0 || !token) {
      setUsers(new Map());
      return;
    }

    const fetchUsers = async (currentToken: string) => {
      setLoading(true);
      try {
        const userPromises = userIds.map(async (userId) => {
          try {
            let response = await fetch(`${API_URL}/api/users/${userId}`, {
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
            });

            // If token expired, try to get a fresh one and retry once
            if (response.status === 401) {
              const freshToken = await getToken();
              if (freshToken && freshToken !== currentToken) {
                response = await fetch(`${API_URL}/api/users/${userId}`, {
                  headers: {
                    Authorization: `Bearer ${freshToken}`,
                  },
                });
              }
            }

            if (response.ok) {
              const userData = await response.json();
              return { id: userId, user: userData };
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
          return null;
        });

        const results = await Promise.all(userPromises);
        const usersMap = new Map<string, User>();

        results.forEach((result) => {
          if (result) {
            usersMap.set(result.id, result.user);
          }
        });

        setUsers(usersMap);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers(token);
  }, [userIds, token, getToken]);

  return { users, loading };
}

