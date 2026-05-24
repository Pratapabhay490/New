import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@studysync/shared-types';
import { RoomService } from '../services/room.service';
import { logger } from '../utils/logger';
import { setupSignalingHandlers } from './signaling';
import { setupAnnotationHandlers } from './annotations';
import { setupPresenceHandlers } from './presence';

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Handle room joining
    socket.on('join-room', async ({ roomId }, callback) => {
      try {
        // Check if room is available
        const isAvailable = await RoomService.isRoomAvailable(roomId);

        if (!isAvailable) {
          const room = await RoomService.getRoomWithParticipants(roomId);
          
          if (!room) {
            callback({
              success: false,
              error: {
                code: 'ROOM_NOT_FOUND',
                message: 'Room not found',
              },
            });
            return;
          }

          const activeParticipants = room.participants.filter((p) => p.isActive);
          
          if (activeParticipants.length >= room.maxParticipants) {
            socket.emit('room-full', {
              message: 'Room is full',
              maxParticipants: room.maxParticipants,
            });
            
            callback({
              success: false,
              error: {
                code: 'ROOM_FULL',
                message: 'Room is full',
              },
            });
            return;
          }
        }

        // Add participant to room
        const participant = await RoomService.addParticipant(roomId, socket.id);

        // Join socket.io room
        await socket.join(roomId);

        // Store room data in socket
        socket.data.roomId = roomId;
        socket.data.userId = participant.id;

        // Get all active participants
        const participants = await RoomService.getActiveParticipants(roomId);

        // Determine if this is the first participant (initiator)
        const isInitiator = participants.length === 1;

        logger.info('User joined room', {
          socketId: socket.id,
          roomId,
          userId: participant.id,
          isInitiator,
          participantCount: participants.length,
        });

        // Notify other participants
        socket.to(roomId).emit('user-joined', {
          userId: participant.id,
          socketId: socket.id,
          participantCount: participants.length,
          isInitiator: false,
        });

        // Send acknowledgment to joining user
        callback({
          success: true,
          roomId,
          participants: participants.map((p) => ({
            id: p.id,
            roomId: p.roomId,
            socketId: p.socketId,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
            isActive: p.isActive,
            peerId: p.peerId,
          })),
          userId: participant.id,
          isInitiator,
        });

        // Create session when second participant joins
        if (participants.length === 2) {
          await RoomService.createSession(roomId);
        }
      } catch (error) {
        logger.error('Error joining room', { socketId: socket.id, roomId, error });
        callback({
          success: false,
          error: {
            code: 'JOIN_ROOM_FAILED',
            message: 'Failed to join room',
          },
        });
      }
    });

    // Handle room leaving
    socket.on('leave-room', async ({ roomId }) => {
      await handleLeaveRoom(socket, io);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info('Client disconnected', { socketId: socket.id });
      await handleLeaveRoom(socket, io);
    });

    // Setup other event handlers
    setupSignalingHandlers(socket, io);
    setupAnnotationHandlers(socket, io);
    setupPresenceHandlers(socket, io);
  });
}

async function handleLeaveRoom(socket: TypedSocket, io: TypedServer): Promise<void> {
  const { roomId, userId } = socket.data;

  if (!roomId) {
    return;
  }

  try {
    // Remove participant from database
    await RoomService.removeParticipant(socket.id);

    // Get remaining participants
    const participants = await RoomService.getActiveParticipants(roomId);

    // Notify other participants
    socket.to(roomId).emit('user-left', {
      userId: userId || socket.id,
      participantCount: participants.length,
    });

    // Leave socket.io room
    await socket.leave(roomId);

    logger.info('User left room', {
      socketId: socket.id,
      roomId,
      userId,
      remainingParticipants: participants.length,
    });

    // End session if no more participants
    if (participants.length === 0) {
      await RoomService.endSession(roomId);
    }
  } catch (error) {
    logger.error('Error leaving room', { socketId: socket.id, roomId, error });
  }
}
