import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { setupSocketIO } from './socket/handlers';
import roomsRoutes from './routes/rooms.routes';
import usersRoutes from './routes/users.routes';
import messagesRoutes from './routes/messages.routes';
import serversRoutes from './routes/servers.routes';
import notificationsRoutes from './routes/notifications.routes';
import reactionsRoutes from './routes/reactions.routes';
import uploadRoutes from './routes/upload.routes';
import voiceRoutes from './routes/voice.routes';
import inviteRoutes from './routes/invite.routes';
import pinRoutes from './routes/pin.routes';
import { generalRateLimit } from './middleware/rateLimit.middleware';

let ioInstance: SocketIOServer | null = null;

export function createApp(): { app: Express; httpServer: HttpServer; io: SocketIOServer } {
  const app = express();
  const httpServer = createServer(app);
  // Determine allowed origins - support multiple ports in development
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [frontendUrl]
    : [
        frontendUrl,
        'http://localhost:3000',
        'http://localhost:3003',
        'http://localhost:5173', // Vite default
        'http://localhost:5174',
      ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance = io;

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          callback(null, true);
          return;
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to all routes
  app.use(generalRateLimit);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/servers', serversRoutes);
  app.use('/api/rooms', roomsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api', messagesRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/reactions', reactionsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/voice', voiceRoutes);
  app.use('/api/invites', inviteRoutes);
  app.use('/api', pinRoutes);

  // Setup Socket.IO
  setupSocketIO(io);

  return { app, httpServer, io };
}

export function startServer(): void {
  const { httpServer } = createApp();
  const port = env.port;

  httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Environment: ${env.nodeEnv}`);
  });
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

