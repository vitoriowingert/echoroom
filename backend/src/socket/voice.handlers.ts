import { AuthenticatedSocket } from './middleware';
import { webrtcService } from '../services/webrtc.service';
import { roomService } from '../services/room.service';

// Global map to track active voice connections per user
// This persists across socket reconnections
const activeVoiceConnections = new Map<string, string>(); // userId -> roomId

// Register voice events on an authenticated socket
export function registerVoiceEvents(socket: AuthenticatedSocket, userId: string): void {
  // Join voice channel
  socket.on('join_voice_channel', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Verify user can access the room
      const room = await roomService.getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Leave previous voice channel if any
      const previousRoomId = activeVoiceConnections.get(userId);
      if (previousRoomId && previousRoomId !== roomId) {
        await webrtcService.leaveVoiceChannel(previousRoomId, userId);
        socket.leave(`voice:${previousRoomId}`);
        socket.to(`voice:${previousRoomId}`).emit('user_left_voice', {
          userId,
          roomId: previousRoomId,
        });
      }

      // Join new voice channel
      await webrtcService.joinVoiceChannel(roomId, userId);
      activeVoiceConnections.set(userId, roomId);

      // Join socket room for voice channel
      socket.join(`voice:${roomId}`);

      // Get all participants
      const participants = await webrtcService.getVoiceChannelParticipants(roomId);

      // Notify others in the voice channel
      socket.to(`voice:${roomId}`).emit('user_joined_voice', {
        userId,
        roomId,
        participant: participants.find((p) => p.user_id === userId),
      });

      // Send current participants to the joining user
      socket.emit('voice_channel_joined', {
        roomId,
        participants,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join voice channel';
      socket.emit('error', { message });
      console.error('Error in join_voice_channel:', error);
    }
  });

  // Leave voice channel
  socket.on('leave_voice_channel', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      await webrtcService.leaveVoiceChannel(roomId, userId);
      activeVoiceConnections.delete(userId);

      socket.leave(`voice:${roomId}`);

      // Notify others
      socket.to(`voice:${roomId}`).emit('user_left_voice', {
        userId,
        roomId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave voice channel';
      socket.emit('error', { message });
      console.error('Error in leave_voice_channel:', error);
    }
  });

  // WebRTC signaling: Offer
  socket.on('voice_offer', (data: { roomId: string; targetUserId: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { roomId, targetUserId, offer } = data;

      // Forward offer to target user
      socket.to(`voice:${roomId}`).emit('voice_offer_received', {
        fromUserId: userId,
        offer,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send offer';
      socket.emit('error', { message });
      console.error('Error in voice_offer:', error);
    }
  });

  // WebRTC signaling: Answer
  socket.on('voice_answer', (data: { roomId: string; targetUserId: string; answer: RTCSessionDescriptionInit }) => {
    try {
      const { roomId, targetUserId, answer } = data;

      // Forward answer to target user
      socket.to(`voice:${roomId}`).emit('voice_answer_received', {
        fromUserId: userId,
        answer,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send answer';
      socket.emit('error', { message });
      console.error('Error in voice_answer:', error);
    }
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice_candidate', (data: { roomId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => {
    try {
      const { roomId, targetUserId, candidate } = data;

      // Forward ICE candidate to target user
      socket.to(`voice:${roomId}`).emit('ice_candidate_received', {
        fromUserId: userId,
        candidate,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send ICE candidate';
      socket.emit('error', { message });
      console.error('Error in ice_candidate:', error);
    }
  });

  // Toggle mute
  socket.on('toggle_mute', async (data: { roomId: string; isMuted: boolean }) => {
    try {
      const { roomId, isMuted } = data;

      const participant = await webrtcService.updateParticipantState(roomId, userId, {
        is_muted: isMuted,
      });

      // Broadcast to others in voice channel
      socket.to(`voice:${roomId}`).emit('participant_state_updated', {
        userId,
        roomId,
        participant,
      });

      socket.emit('mute_toggled', {
        roomId,
        isMuted,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle mute';
      socket.emit('error', { message });
      console.error('Error in toggle_mute:', error);
    }
  });

  // Toggle deafen
  socket.on('toggle_deafen', async (data: { roomId: string; isDeafened: boolean }) => {
    try {
      const { roomId, isDeafened } = data;

      const participant = await webrtcService.updateParticipantState(roomId, userId, {
        is_deafened: isDeafened,
        // When deafened, also mute
        is_muted: isDeafened,
      });

      // Broadcast to others in voice channel
      socket.to(`voice:${roomId}`).emit('participant_state_updated', {
        userId,
        roomId,
        participant,
      });

      socket.emit('deafen_toggled', {
        roomId,
        isDeafened,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle deafen';
      socket.emit('error', { message });
      console.error('Error in toggle_deafen:', error);
    }
  });

  // Toggle video
  socket.on('toggle_video', async (data: { roomId: string; isVideoEnabled: boolean }) => {
    try {
      const { roomId, isVideoEnabled } = data;

      const participant = await webrtcService.updateParticipantState(roomId, userId, {
        is_video_enabled: isVideoEnabled,
      });

      // Broadcast to others in voice channel
      socket.to(`voice:${roomId}`).emit('participant_state_updated', {
        userId,
        roomId,
        participant,
      });

      socket.emit('video_toggled', {
        roomId,
        isVideoEnabled,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle video';
      socket.emit('error', { message });
      console.error('Error in toggle_video:', error);
    }
  });

  // Start screen share
  socket.on('start_screen_share', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;

      const participant = await webrtcService.updateParticipantState(roomId, userId, {
        is_screen_sharing: true,
      });

      // Broadcast to others in voice channel
      socket.to(`voice:${roomId}`).emit('participant_state_updated', {
        userId,
        roomId,
        participant,
      });

      socket.emit('screen_share_started', {
        roomId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start screen share';
      socket.emit('error', { message });
      console.error('Error in start_screen_share:', error);
    }
  });

  // Stop screen share
  socket.on('stop_screen_share', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;

      const participant = await webrtcService.updateParticipantState(roomId, userId, {
        is_screen_sharing: false,
      });

      // Broadcast to others in voice channel
      socket.to(`voice:${roomId}`).emit('participant_state_updated', {
        userId,
        roomId,
        participant,
      });

      socket.emit('screen_share_stopped', {
        roomId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop screen share';
      socket.emit('error', { message });
      console.error('Error in stop_screen_share:', error);
    }
  });

  // Handle disconnect - leave voice channels
  socket.on('disconnect', async () => {
    const roomId = activeVoiceConnections.get(userId);
    if (roomId) {
      try {
        await webrtcService.leaveVoiceChannel(roomId, userId);
        socket.to(`voice:${roomId}`).emit('user_left_voice', {
          userId,
          roomId,
        });
        activeVoiceConnections.delete(userId);
      } catch (error) {
        console.error(`Failed to leave voice channel on disconnect:`, error);
      }
    }
  });
}
