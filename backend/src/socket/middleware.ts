import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { supabaseAdminClient } from '../config/supabase';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const { data, error } = await supabaseAdminClient.auth.getUser(token);

    if (error || !data.user) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    socket.userId = data.user.id;
    socket.userEmail = data.user.email;

    next();
  } catch (error) {
    next(new Error('Authentication error: Failed to verify token'));
  }
}

