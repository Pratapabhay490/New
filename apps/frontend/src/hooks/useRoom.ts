import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { socketManager } from '@/lib/socket/socket-manager';
import { WebRTCPeerConnection } from '@/lib/webrtc/peer-connection';
import { useRoomStore } from '@/stores/room-store';
import { useMediaStore } from '@/stores/media-store';

export function useRoom(roomId: string) {
  const router = useRouter();
  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null);
  const socketRef = useRef(socketManager.connect());

  const {
    setRoomId,
    setUserId,
    setIsHost,
    setRoomStatus,
    setParticipants,
    setError,
    reset: resetRoom,
  } = useRoomStore();

  const {
    setLocalStream,
    setRemoteStream,
    setConnectionState,
    setIceConnectionState,
    setRemoteVideoEnabled,
    setRemoteAudioEnabled,
    setRemoteScreenSharing,
    reset: resetMedia,
  } = useMediaStore();

  const joinRoom = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) return;

    setRoomStatus('connecting');
    setRoomId(roomId);

    socket.emit('join-room', { roomId }, async (response: any) => {
      if (!response.success) {
        setError(response.error?.message || 'Failed to join room');
        setRoomStatus('error');
        toast.error(response.error?.message || 'Failed to join room');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      setUserId(response.userId);
      setIsHost(response.isInitiator);
      setParticipants(response.participants);

      if (response.participants.length === 1) {
        setRoomStatus('waiting');
        toast.info('Waiting for another participant...');
      } else {
        setRoomStatus('active');
        toast.success('Connected to room!');
      }

      // Initialize WebRTC peer connection
      peerConnectionRef.current = new WebRTCPeerConnection(
        socket,
        response.isInitiator,
        {
          onRemoteStream: (stream) => {
            console.log('Remote stream received');
            setRemoteStream(stream);
          },
          onConnectionStateChange: (state) => {
            setConnectionState(state);
            if (state === 'connected') {
              setRoomStatus('active');
            } else if (state === 'failed' || state === 'disconnected') {
              setRoomStatus('disconnected');
            }
          },
          onIceConnectionStateChange: (state) => {
            setIceConnectionState(state);
          },
        }
      );

      // Start local media
      try {
        const localStream = await peerConnectionRef.current.startLocalMedia();
        setLocalStream(localStream);
        toast.success('Camera and microphone enabled');
      } catch (error) {
        console.error('Failed to start local media:', error);
        toast.error('Failed to access camera/microphone');
      }
    });

    // Handle user joined
    socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      setRoomStatus('active');
      toast.success('Participant joined!');
    });

    // Handle user left
    socket.on('user-left', (data) => {
      console.log('User left:', data);
      setRoomStatus('waiting');
      toast.info('Participant left');
      setRemoteStream(null);
    });

    // Handle room full
    socket.on('room-full', (data) => {
      setError(data.message);
      setRoomStatus('error');
      toast.error(data.message);
      setTimeout(() => router.push('/'), 3000);
    });

    // Handle media toggles
    socket.on('media:toggle-video', (data) => {
      setRemoteVideoEnabled(data.enabled);
    });

    socket.on('media:toggle-audio', (data) => {
      setRemoteAudioEnabled(data.enabled);
    });

    socket.on('media:screen-share-start', (data) => {
      setRemoteScreenSharing(true);
      toast.info('Remote user started screen sharing');
    });

    socket.on('media:screen-share-stop', (data) => {
      setRemoteScreenSharing(false);
      toast.info('Remote user stopped screen sharing');
    });
  }, [
    roomId,
    router,
    setRoomId,
    setUserId,
    setIsHost,
    setRoomStatus,
    setParticipants,
    setError,
    setLocalStream,
    setRemoteStream,
    setConnectionState,
    setIceConnectionState,
    setRemoteVideoEnabled,
    setRemoteAudioEnabled,
    setRemoteScreenSharing,
  ]);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }

    // Cleanup
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    resetRoom();
    resetMedia();

    router.push('/');
  }, [roomId, router, resetRoom, resetMedia]);

  useEffect(() => {
    joinRoom();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [joinRoom]);

  return {
    peerConnection: peerConnectionRef.current,
    socket: socketRef.current,
    leaveRoom,
  };
}
