import { DEFAULT_RTC_CONFIG, DEFAULT_MEDIA_CONSTRAINTS } from '@studysync/shared-types';
import type { TypedSocket } from '../socket/socket-manager';

export type MediaTrackType = 'audio' | 'video' | 'screen';

interface PeerConnectionCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onTrackAdded?: (track: MediaStreamTrack, streams: MediaStream[]) => void;
}

export class WebRTCPeerConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: TypedSocket;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private callbacks: PeerConnectionCallbacks;
  private isInitiator: boolean;
  private makingOffer = false;
  private ignoreOffer = false;

  constructor(socket: TypedSocket, isInitiator: boolean, callbacks: PeerConnectionCallbacks = {}) {
    this.socket = socket;
    this.isInitiator = isInitiator;
    this.callbacks = callbacks;
    this.initializePeerConnection();
    this.setupSocketListeners();
  }

  private initializePeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(DEFAULT_RTC_CONFIG);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📡 Sending ICE candidate');
        this.socket.emit('webrtc:ice-candidate', {
          candidate: event.candidate.toJSON(),
          from: this.socket.id!,
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state:', state);
      this.callbacks.onConnectionStateChange?.(state!);
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      this.callbacks.onIceConnectionStateChange?.(state!);
      
      if (state === 'failed') {
        console.log('🔄 ICE failed, restarting...');
        this.peerConnection?.restartIce();
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Remote track added:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      this.remoteStream.addTrack(event.track);
      this.callbacks.onRemoteStream?.(this.remoteStream);
      this.callbacks.onTrackAdded?.(event.track, event.streams);
    };

    // Handle negotiation needed
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        console.log('🤝 Negotiation needed');
        this.makingOffer = true;
        await this.createAndSendOffer();
      } catch (error) {
        console.error('❌ Error during negotiation:', error);
      } finally {
        this.makingOffer = false;
      }
    };
  }

  private setupSocketListeners(): void {
    // Handle incoming offer
    this.socket.on('webrtc:offer', async (data) => {
      console.log('📥 Received offer from:', data.from);
      
      const offerCollision = this.makingOffer || this.peerConnection?.signalingState !== 'stable';
      
      this.ignoreOffer = !this.isInitiator && offerCollision;
      if (this.ignoreOffer) {
        console.log('⚠️ Ignoring offer due to collision');
        return;
      }

      try {
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await this.peerConnection?.createAnswer();
        await this.peerConnection?.setLocalDescription(answer);
        
        console.log('📤 Sending answer');
        this.socket.emit('webrtc:answer', {
          answer: answer!,
          from: this.socket.id!,
        });
      } catch (error) {
        console.error('❌ Error handling offer:', error);
      }
    });

    // Handle incoming answer
    this.socket.on('webrtc:answer', async (data) => {
      console.log('📥 Received answer from:', data.from);
      
      try {
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    });

    // Handle incoming ICE candidate
    this.socket.on('webrtc:ice-candidate', async (data) => {
      try {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        if (!this.ignoreOffer) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      }
    });

    // Handle renegotiation request
    this.socket.on('webrtc:renegotiate', async () => {
      console.log('🔄 Renegotiation requested');
      await this.createAndSendOffer();
    });
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      console.log('📤 Sending offer');
      this.socket.emit('webrtc:offer', {
        offer,
        from: this.socket.id!,
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }

  async startLocalMedia(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(DEFAULT_MEDIA_CONSTRAINTS);
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      console.log('✅ Local media started');
      return this.localStream;
    } catch (error) {
      console.error('❌ Error starting local media:', error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: 30,
        },
        audio: false,
      });

      // Replace video track with screen share track
      const videoTrack = this.screenStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      } else {
        this.peerConnection?.addTrack(videoTrack, this.screenStream);
      }

      // Handle screen share stop
      videoTrack.onended = () => {
        console.log('🛑 Screen share stopped');
        this.stopScreenShare();
      };

      console.log('✅ Screen share started');
      return this.screenStream;
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (!this.screenStream) return;

    // Stop screen share tracks
    this.screenStream.getTracks().forEach((track) => track.stop());

    // Replace with camera track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }

    this.screenStream = null;
    console.log('✅ Screen share stopped');
  }

  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log('🎤 Audio:', enabled ? 'enabled' : 'disabled');
  }

  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log('📹 Video:', enabled ? 'enabled' : 'disabled');
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  isScreenSharing(): boolean {
    return this.screenStream !== null;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState ?? null;
  }

  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState ?? null;
  }

  async getStats(): Promise<RTCStatsReport | null> {
    return this.peerConnection?.getStats() ?? null;
  }

  close(): void {
    console.log('🔌 Closing peer connection');

    // Stop all tracks
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.screenStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();

    // Clear streams
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.peerConnection = null;
  }
}
