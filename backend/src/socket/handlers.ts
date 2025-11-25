import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from './middleware';
import { socketAuthMiddleware } from './middleware';
import { messageService } from '../services/message.service';
import { roomService } from '../services/room.service';
import { presenceService } from '../services/presence.service';
import { reactionService } from '../services/reaction.service';
import { unreadService } from '../services/unread.service';
import { registerVoiceEvents } from './voice.handlers';
import { supabaseService } from '../services/supabase.service';

export function setupSocketIO(io: SocketIOServer): void {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User ${userId} connected`);

    // Set user as online
    presenceService.setOnline(userId).catch((err) => {
      console.error(`Failed to set user ${userId} online:`, err);
    });

    // Broadcast presence update
    socket.broadcast.emit('presence_update', {
      userId,
      status: 'online',
    });

    // Join room
    socket.on('join_room', async (roomId: string) => {
      try {
        // Verify user can access the room
        const room = await roomService.getRoomById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to this room
        let hasAccess = false;
        
        // Check if user is an explicit room member
        const roomMember = await supabaseService.getRoomMember(roomId, userId);
        if (roomMember) {
          hasAccess = true;
        }
        
        // If room belongs to a server, check if user is a server member
        if (!hasAccess && room.server_id) {
          const serverMember = await supabaseService.getServerMember(room.server_id, userId);
          if (serverMember) {
            hasAccess = true;
            // Add user to room_members for consistency (idempotent)
            try {
              await roomService.joinRoom(roomId, userId);
            } catch (error) {
              // Ignore errors - user can still join Socket.IO room as server member
              console.log(`Note: Could not add user ${userId} to room_members for room ${roomId}, but allowing Socket.IO join as server member`);
            }
          }
        }

        if (!hasAccess) {
          socket.emit('error', { message: 'You do not have access to this room' });
          return;
        }

        // Join socket room
        socket.join(roomId);

        // Load message history
        const messages = await messageService.getMessagesByRoom(roomId, 100, 0);
        socket.emit('room_messages', messages);

        // Mark room as read
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          unreadService.markRoomAsRead(userId, roomId, lastMessage.id).catch((err) => {
            console.error(`Failed to mark room ${roomId} as read:`, err);
          });
        }

        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });

        socket.emit('joined_room', { roomId });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join room';
        socket.emit('error', { message });
      }
    });

    // Leave room
    socket.on('leave_room', async (roomId: string) => {
      try {
        socket.leave(roomId);

        socket.to(roomId).emit('user_left', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });

        socket.emit('left_room', { roomId });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to leave room';
        socket.emit('error', { message });
      }
    });

    // Send message
    socket.on('send_message', async (data: { 
      roomId: string; 
      content: string; 
      messageType?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      thumbnailUrl?: string;
    }) => {
      try {
        const { roomId, content, messageType, fileUrl, fileName, fileSize, fileType, thumbnailUrl } = data;

        if ((!content || content.trim().length === 0) && !fileUrl) {
          socket.emit('error', { message: 'Message content or file is required' });
          return;
        }

        // Create message in database
        const message = await messageService.createMessage({
          roomId,
          userId,
          content: content?.trim() || '',
          messageType: messageType || (fileUrl ? 'file' : 'text'),
          fileUrl,
          fileName,
          fileSize,
          fileType,
          thumbnailUrl,
        });

        // Broadcast to all users in the room
        io.to(roomId).emit('new_message', message);

        socket.emit('message_sent', { messageId: message.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send message';
        socket.emit('error', { message });
      }
    });

    // Update message
    socket.on('update_message', async (data: { messageId: string; content: string }) => {
      try {
        const { messageId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        const message = await messageService.updateMessage(messageId, { content: content.trim() }, userId);

        // Get room ID from message
        const roomId = message.room_id;

        // Broadcast update to all users in the room
        io.to(roomId).emit('message_updated', message);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update message';
        socket.emit('error', { message });
      }
    });

    // Delete message
    socket.on('delete_message', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;

        // Get message before deleting to get room ID
        const message = await messageService.getMessageById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await messageService.deleteMessage(messageId, userId);

        const roomId = message.room_id;

        // Broadcast deletion to all users in the room
        io.to(roomId).emit('message_deleted', { messageId, roomId });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete message';
        socket.emit('error', { message });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user_typing', {
        userId,
        roomId: data.roomId,
      });
    });

    socket.on('typing_stop', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user_stopped_typing', {
        userId,
        roomId: data.roomId,
      });
    });

    // Add reaction
    socket.on('add_reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const { messageId, emoji } = data;
        const reaction = await reactionService.addReaction(messageId, userId, emoji);
        const counts = await reactionService.getReactionCounts(messageId);

        // Get message to find room
        const message = await messageService.getMessageById(messageId);
        if (message) {
          io.to(message.room_id).emit('reaction_added', {
            messageId,
            reaction,
            counts,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add reaction';
        socket.emit('error', { message });
      }
    });

    // Remove reaction
    socket.on('remove_reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const { messageId, emoji } = data;
        await reactionService.removeReaction(messageId, userId, emoji);
        const counts = await reactionService.getReactionCounts(messageId);

        // Get message to find room
        const message = await messageService.getMessageById(messageId);
        if (message) {
          io.to(message.room_id).emit('reaction_removed', {
            messageId,
            emoji,
            counts,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove reaction';
        socket.emit('error', { message });
      }
    });

    // Update presence status
    socket.on('update_presence', async (data: { status: 'online' | 'offline' | 'away' | 'busy' }) => {
      try {
        await presenceService.updatePresence(userId, data.status);
        socket.broadcast.emit('presence_update', {
          userId,
          status: data.status,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update presence';
        socket.emit('error', { message });
      }
    });

    // Register voice events
    registerVoiceEvents(socket, userId);

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected`);

      // Set user as offline
      try {
        await presenceService.setOffline(userId);
        socket.broadcast.emit('presence_update', {
          userId,
          status: 'offline',
        });
      } catch (err) {
        console.error(`Failed to set user ${userId} offline:`, err);
      }
    });
  });
}

