import { io, Socket } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function createSocket(token: string): Socket {
  return io(backendUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });
}

