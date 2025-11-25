import { useState, useEffect, useRef } from 'react';
import { Room } from '../types';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useRooms(token: string | null, serverId?: string | null) {
  const { getToken } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchRooms = async (currentToken: string | null = token) => {
    if (!currentToken) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let url = `${API_URL}/api/rooms`;
      if (serverId) {
        // Fetch rooms for a specific server
        url = `${API_URL}/api/servers/${serverId}/rooms`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        // If token expired, try to get a fresh one and retry once
        if (response.status === 401) {
          const freshToken = await getToken();
          if (freshToken && freshToken !== currentToken) {
            // Retry with fresh token - await to ensure finally executes after retry completes
            isFetchingRef.current = false;
            await fetchRooms(freshToken);
            return;
          }
          setError('Sessão expirada. Por favor, faça login novamente.');
          setRooms([]);
        } else {
          throw new Error('Falha ao buscar salas');
        }
        return;
      }

      const data = await response.json();
      // Remove duplicates by ID before setting
      const uniqueRooms = Array.from(
        new Map(data.map((room: Room) => [room.id, room])).values()
      );
      console.log('🔍 fetchRooms - Received rooms:', data.length, 'Unique:', uniqueRooms.length);
      console.log('🔍 Room IDs:', uniqueRooms.map(r => r.id));
      setRooms(uniqueRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar salas');
      setRooms([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchRooms(token);
    }
  }, [token, serverId]);

  const createRoom = async (name: string, description?: string, serverId?: string) => {
    if (!token) throw new Error('Não autenticado');

    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, serverId }),
      });

      if (!response.ok) {
        let errorMessage = 'Falha ao criar sala';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const room = await response.json();
      // Refetch rooms to ensure consistency with server and avoid duplicates
      // This is better than manually adding to prevent race conditions
      await fetchRooms(token);
      return room;
    } catch (err) {
      // Handle network errors and other fetch failures
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      throw err;
    }
  };

  return { rooms, loading, error, fetchRooms, createRoom };
}

