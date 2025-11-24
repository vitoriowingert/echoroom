import { useState, useEffect } from 'react';
import { Server } from '../types';

export function useServers(token: string | null) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setServers([]);
      setLoading(false);
      return;
    }

    const fetchServers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch servers');
        }

        const data = await response.json();
        setServers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch servers');
        console.error('Error fetching servers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [token]);

  const createServer = async (name: string, description?: string, iconUrl?: string): Promise<Server> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, iconUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create server');
    }

    const newServer = await response.json();
    setServers((prev) => [...prev, newServer]);
    return newServer;
  };

  const joinServer = async (serverId: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/${serverId}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join server');
    }

    // Refetch servers to get the updated list
    const fetchServers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch servers');
        }

        const data = await response.json();
        setServers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch servers');
        console.error('Error fetching servers:', err);
      } finally {
        setLoading(false);
      }
    };

    await fetchServers();
  };

  const discoverServers = async (): Promise<Array<Server & { isMember: boolean }>> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/servers/discover`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to discover servers');
    }

    return await response.json();
  };

  return { servers, loading, error, createServer, joinServer, discoverServers };
}

