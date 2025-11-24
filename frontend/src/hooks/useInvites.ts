import { useState, useEffect } from 'react';
import { ServerInvite } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useInvites(token: string | null, serverId?: string | null) {
  const [invites, setInvites] = useState<ServerInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = async () => {
    if (!token || !serverId) {
      setInvites([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/invites/servers/${serverId}/invites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          setInvites([]);
        } else {
          throw new Error('Falha ao buscar convites');
        }
        return;
      }

      const data = await response.json();
      setInvites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar convites');
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && serverId) {
      fetchInvites();
    }
  }, [token, serverId]);

  const createInvite = async (
    serverId: string,
    expiresAt?: Date,
    maxUses?: number
  ): Promise<ServerInvite> => {
    if (!token) throw new Error('Não autenticado');

    try {
      const response = await fetch(`${API_URL}/api/invites/servers/${serverId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresAt: expiresAt?.toISOString(),
          maxUses,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Falha ao criar convite';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const invite = await response.json();
      await fetchInvites(); // Refresh list
      return invite;
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      throw err;
    }
  };

  const deleteInvite = async (inviteId: string): Promise<void> => {
    if (!token) throw new Error('Não autenticado');

    try {
      const response = await fetch(`${API_URL}/api/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Falha ao deletar convite';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await fetchInvites(); // Refresh list
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      throw err;
    }
  };

  const acceptInvite = async (code: string): Promise<void> => {
    if (!token) throw new Error('Não autenticado');

    try {
      const response = await fetch(`${API_URL}/api/invites/${code}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Falha ao aceitar convite';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      throw err;
    }
  };

  return { invites, loading, error, createInvite, deleteInvite, acceptInvite, fetchInvites };
}

