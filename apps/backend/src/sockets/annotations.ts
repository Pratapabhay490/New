import { TypedSocket, TypedServer } from './connection';
import { logger } from '../utils/logger';
import { annotationRateLimiter } from '../middleware/rate-limit';

export function setupAnnotationHandlers(socket: TypedSocket, io: TypedServer): void {
  // Handle stroke start
  socket.on('annotation:stroke-start', (data) => {
    if (!annotationRateLimiter.checkLimit(socket.id)) {
      logger.warn('Annotation rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) {
      logger.warn('Annotation event sent without joining room', { socketId: socket.id });
      return;
    }

    logger.debug('Stroke start', {
      strokeId: data.strokeId,
      tool: data.tool,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:stroke-start', data);
  });

  // Handle stroke update (batched points)
  socket.on('annotation:stroke-update', (data) => {
    if (!annotationRateLimiter.checkLimit(socket.id)) {
      logger.warn('Annotation rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Stroke update', {
      strokeId: data.strokeId,
      pointCount: data.points.length,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:stroke-update', data);
  });

  // Handle stroke end
  socket.on('annotation:stroke-end', (data) => {
    if (!annotationRateLimiter.checkLimit(socket.id)) {
      logger.warn('Annotation rate limit exceeded', { socketId: socket.id });
      return;
    }

    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Stroke end', {
      strokeId: data.strokeId,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:stroke-end', data);
  });

  // Handle clear canvas
  socket.on('annotation:clear', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.info('Canvas cleared', {
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:clear', data);
  });

  // Handle undo
  socket.on('annotation:undo', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Undo annotation', {
      strokeId: data.strokeId,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:undo', data);
  });

  // Handle redo
  socket.on('annotation:redo', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Redo annotation', {
      strokeId: data.strokeId,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants
    socket.to(roomId).emit('annotation:redo', data);
  });

  // Handle tool change
  socket.on('annotation:tool-change', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    logger.debug('Tool changed', {
      tool: data.tool,
      userId: data.userId,
      roomId,
    });

    // Relay to other participants (optional - for showing remote user's tool)
    socket.to(roomId).emit('annotation:tool-change', data);
  });
}
