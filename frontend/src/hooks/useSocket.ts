import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket } from '../config/socket';
import { useAuth } from './useAuth';

export function useSocket() {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        tokenRef.current = token;
        socketInstance = createSocket(token);

        socketInstance.on('connect', () => {
          console.log('Socket conectado');
          setConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket desconectado');
          setConnected(false);
        });

        socketInstance.on('error', (error) => {
          console.error('Erro do Socket:', error);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Falha ao inicializar o Socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [getToken]);

  return { socket, connected };
}

