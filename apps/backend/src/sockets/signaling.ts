import { TypedSocket, TypedServer } from './connection';
import { logger } from '../utils/logger';
import { signalingRateLimiter } from '../middleware/rate-limit';

export function setupSignalingHandlers(socket: TypedSocket, io: TypedServer): void {
  // Handle WebRTC offer
  socket.on('webrtc:offer', (data) => {
    if (!signalingRateLimiter.checkLimit(socket.id)) {
      logger.warn('Signaling rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) {
      logger.warn('Offer sent without joining room', { socketId: socket.id });
      return;
    }

    logger.debug('Relaying WebRTC offer', {
      from: socket.id,
      roomId,
    });

    // Relay offer to other participants in the room
    socket.to(roomId).emit('webrtc:offer', {
      offer: data.offer,
      from: socket.id,
    });
  });

  // Handle WebRTC answer
  socket.on('webrtc:answer', (data) => {
    if (!signalingRateLimiter.checkLimit(socket.id)) {
      logger.warn('Signaling rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) {
      logger.warn('Answer sent without joining room', { socketId: socket.id });
      return;
    }

    logger.debug('Relaying WebRTC answer', {
      from: socket.id,
      roomId,
    });

    // Relay answer to other participants
    socket.to(roomId).emit('webrtc:answer', {
      answer: data.answer,
      from: socket.id,
    });
  });

  // Handle ICE candidates
  socket.on('webrtc:ice-candidate', (data) => {
    if (!signalingRateLimiter.checkLimit(socket.id)) {
      logger.warn('Signaling rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) {
      logger.warn('ICE candidate sent without joining room', { socketId: socket.id });
      return;
    }

    logger.debug('Relaying ICE candidate', {
      from: socket.id,
      roomId,
    });

    // Relay ICE candidate to other participants
    socket.to(roomId).emit('webrtc:ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  // Handle renegotiation
  socket.on('webrtc:renegotiate', () => {
    const { roomId } = socket.data;

    if (!roomId) {
      logger.warn('Renegotiation requested without joining room', { socketId: socket.id });
      return;
    }

    logger.debug('Relaying renegotiation request', {
      from: socket.id,
      roomId,
    });

    // Notify other participants to renegotiate
    socket.to(roomId).emit('webrtc:renegotiate');
  });

  // Handle media toggle events
  socket.on('media:toggle-video', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Media toggle: video', {
      userId: data.userId,
      enabled: data.enabled,
      roomId,
    });

    socket.to(roomId).emit('media:toggle-video', data);
  });

  socket.on('media:toggle-audio', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Media toggle: audio', {
      userId: data.userId,
      enabled: data.enabled,
      roomId,
    });

    socket.to(roomId).emit('media:toggle-audio', data);
  });

  // Handle screen share events
  socket.on('media:screen-share-start', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.info('Screen share started', {
      userId: data.userId,
      roomId,
    });

    socket.to(roomId).emit('media:screen-share-start', data);
  });

  socket.on('media:screen-share-stop', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.info('Screen share stopped', {
      userId: data.userId,
      roomId,
    });

    socket.to(roomId).emit('media:screen-share-stop', data);
  });
}
