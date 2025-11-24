import { Socket } from 'socket.io-client';

export interface PeerConnection {
  peer: RTCPeerConnection;
  userId: string;
  stream?: MediaStream;
  remoteStream?: MediaStream;
}

export class WebRTCClient {
  private socket: Socket | null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentRoomId: string | null = null;
  private stunServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(socket: Socket | null) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle incoming WebRTC offer
    this.socket.on('voice_offer_received', async (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const { fromUserId, offer } = data;
        await this.handleOffer(fromUserId, offer);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle incoming WebRTC answer
    this.socket.on('voice_answer_received', async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      try {
        const { fromUserId, answer } = data;
        await this.handleAnswer(fromUserId, answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    // Handle incoming ICE candidate
    this.socket.on('ice_candidate_received', async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const { fromUserId, candidate } = data;
        await this.handleIceCandidate(fromUserId, candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });
  }

  // Create peer connection for a user
  private createPeerConnection(userId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.stunServers);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.onRemoteStream?.(userId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.currentRoomId) {
        this.socket.emit('ice_candidate', {
          roomId: this.currentRoomId,
          targetUserId: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        this.onPeerDisconnected?.(userId);
      }
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  // Handle incoming offer
  private async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(userId);
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (this.socket && this.currentRoomId) {
      this.socket.emit('voice_answer', {
        roomId: this.currentRoomId,
        targetUserId: userId,
        answer: answer.toJSON(),
      });
    }
  }

  // Handle incoming answer
  private async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      console.error('No peer connection found for user:', userId);
      return;
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      console.error('No peer connection found for user:', userId);
      return;
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  // Get user media (audio/video)
  async getUserMedia(audio: boolean = true, video: boolean = false): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      });

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  // Get screen share stream
  async getScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.screenStream = stream;

      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('Error getting screen share:', error);
      throw error;
    }
  }

  // Stop screen share
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  // Create offer for a user
  async createOffer(userId: string, roomId: string): Promise<void> {
    this.currentRoomId = roomId;

    let peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(userId);
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    if (this.socket) {
      this.socket.emit('voice_offer', {
        roomId,
        targetUserId: userId,
        offer: offer.toJSON(),
      });
    }
  }

  // Mute/unmute audio
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  // Enable/disable video
  setVideoEnabled(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get screen share stream
  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  // Cleanup all connections
  cleanup(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
    this.currentRoomId = null;
  }

  // Callbacks
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onPeerDisconnected?: (userId: string) => void;
}

