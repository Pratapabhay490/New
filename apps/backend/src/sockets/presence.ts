import { TypedSocket, TypedServer } from './connection';
import { logger } from '../utils/logger';

// Throttle cursor updates to reduce load
const cursorUpdateThrottleMs = 50; // 20 updates per second max
const lastCursorUpdate = new Map<string, number>();

export function setupPresenceHandlers(socket: TypedSocket, io: TypedServer): void {
  // Handle cursor movement
  socket.on('cursor:move', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    // Throttle cursor updates
    const now = Date.now();
    const lastUpdate = lastCursorUpdate.get(socket.id) || 0;

    if (now - lastUpdate < cursorUpdateThrottleMs) {
      return;
    }

    lastCursorUpdate.set(socket.id, now);

    // Relay cursor position to other participants
    socket.to(roomId).emit('cursor:move', data);
  });

  // Handle cursor hide
  socket.on('cursor:hide', (data) => {
    const { roomId } = socket.data;

    if (!roomId) return;

    // Relay cursor hide to other participants
    socket.to(roomId).emit('cursor:hide', data);
  });

  // Clean up cursor throttle map on disconnect
  socket.on('disconnect', () => {
    lastCursorUpdate.delete(socket.id);
  });
}
