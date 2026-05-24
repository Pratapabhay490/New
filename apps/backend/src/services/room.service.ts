import { Room, RoomStatus, Participant } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config/constants';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error';
import { randomBytes } from 'crypto';

export class RoomService {
  /**
   * Create a new room
   */
  static async createRoom(expiresIn?: number): Promise<Room> {
    const expirySeconds = expiresIn || config.room.defaultExpiry;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    try {
      const room = await prisma.room.create({
        data: {
          expiresAt,
          maxParticipants: config.room.maxParticipants,
        },
      });

      logger.info('Room created', { roomId: room.id, expiresAt });
      return room;
    } catch (error) {
      logger.error('Failed to create room', { error });
      throw new AppError(500, 'Failed to create room', 'ROOM_CREATE_FAILED');
    }
  }

  /**
   * Get room by ID
   */
  static async getRoomById(roomId: string): Promise<Room | null> {
    try {
      return await prisma.room.findUnique({
        where: { id: roomId },
      });
    } catch (error) {
      logger.error('Failed to fetch room', { roomId, error });
      return null;
    }
  }

  /**
   * Get room with participants
   */
  static async getRoomWithParticipants(
    roomId: string
  ): Promise<(Room & { participants: Participant[] }) | null> {
    try {
      return await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            where: { isActive: true },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch room with participants', { roomId, error });
      return null;
    }
  }

  /**
   * Check if room is available for joining
   */
  static async isRoomAvailable(roomId: string): Promise<boolean> {
    const room = await this.getRoomWithParticipants(roomId);

    if (!room) {
      return false;
    }

    if (room.status !== RoomStatus.ACTIVE) {
      return false;
    }

    if (new Date() > room.expiresAt) {
      // Mark room as expired
      await this.updateRoomStatus(roomId, RoomStatus.EXPIRED);
      return false;
    }

    const activeParticipants = room.participants.filter((p) => p.isActive);
    return activeParticipants.length < room.maxParticipants;
  }

  /**
   * Update room status
   */
  static async updateRoomStatus(
    roomId: string,
    status: RoomStatus
  ): Promise<Room> {
    try {
      const room = await prisma.room.update({
        where: { id: roomId },
        data: { status },
      });

      logger.info('Room status updated', { roomId, status });
      return room;
    } catch (error) {
      logger.error('Failed to update room status', { roomId, status, error });
      throw new AppError(500, 'Failed to update room status', 'ROOM_UPDATE_FAILED');
    }
  }

  /**
   * Close room
   */
  static async closeRoom(roomId: string): Promise<void> {
    try {
      await prisma.$transaction([
        // Update room status
        prisma.room.update({
          where: { id: roomId },
          data: { status: RoomStatus.CLOSED },
        }),
        // Mark all participants as inactive
        prisma.participant.updateMany({
          where: { roomId, isActive: true },
          data: {
            isActive: false,
            leftAt: new Date(),
          },
        }),
      ]);

      logger.info('Room closed', { roomId });
    } catch (error) {
      logger.error('Failed to close room', { roomId, error });
      throw new AppError(500, 'Failed to close room', 'ROOM_CLOSE_FAILED');
    }
  }

  /**
   * Add participant to room
   */
  static async addParticipant(
    roomId: string,
    socketId: string
  ): Promise<Participant> {
    const isAvailable = await this.isRoomAvailable(roomId);

    if (!isAvailable) {
      throw new AppError(403, 'Room is not available', 'ROOM_NOT_AVAILABLE');
    }

    try {
      const participant = await prisma.participant.create({
        data: {
          roomId,
          socketId,
        },
      });

      logger.info('Participant added to room', { roomId, socketId, participantId: participant.id });
      return participant;
    } catch (error) {
      logger.error('Failed to add participant', { roomId, socketId, error });
      throw new AppError(500, 'Failed to add participant', 'PARTICIPANT_ADD_FAILED');
    }
  }

  /**
   * Remove participant from room
   */
  static async removeParticipant(socketId: string): Promise<void> {
    try {
      const participant = await prisma.participant.findUnique({
        where: { socketId },
      });

      if (!participant) {
        return;
      }

      await prisma.participant.update({
        where: { socketId },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      logger.info('Participant removed from room', { socketId, roomId: participant.roomId });

      // Check if room should be closed (no active participants)
      const activeCount = await prisma.participant.count({
        where: {
          roomId: participant.roomId,
          isActive: true,
        },
      });

      if (activeCount === 0) {
        await this.closeRoom(participant.roomId);
      }
    } catch (error) {
      logger.error('Failed to remove participant', { socketId, error });
    }
  }

  /**
   * Get participant by socket ID
   */
  static async getParticipantBySocketId(
    socketId: string
  ): Promise<Participant | null> {
    try {
      return await prisma.participant.findUnique({
        where: { socketId },
      });
    } catch (error) {
      logger.error('Failed to fetch participant', { socketId, error });
      return null;
    }
  }

  /**
   * Get active participants in room
   */
  static async getActiveParticipants(roomId: string): Promise<Participant[]> {
    try {
      return await prisma.participant.findMany({
        where: {
          roomId,
          isActive: true,
        },
        orderBy: { joinedAt: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to fetch active participants', { roomId, error });
      return [];
    }
  }

  /**
   * Create session for room
   */
  static async createSession(roomId: string): Promise<void> {
    try {
      const participantCount = await prisma.participant.count({
        where: {
          roomId,
          isActive: true,
        },
      });

      await prisma.session.create({
        data: {
          roomId,
          participantCount,
        },
      });

      logger.info('Session created', { roomId, participantCount });
    } catch (error) {
      logger.error('Failed to create session', { roomId, error });
    }
  }

  /**
   * End session
   */
  static async endSession(roomId: string): Promise<void> {
    try {
      const activeSession = await prisma.session.findFirst({
        where: {
          roomId,
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (activeSession) {
        const endedAt = new Date();
        const duration = Math.floor(
          (endedAt.getTime() - activeSession.startedAt.getTime()) / 1000
        );

        await prisma.session.update({
          where: { id: activeSession.id },
          data: { endedAt, duration },
        });

        logger.info('Session ended', { roomId, sessionId: activeSession.id, duration });
      }
    } catch (error) {
      logger.error('Failed to end session', { roomId, error });
    }
  }
}
