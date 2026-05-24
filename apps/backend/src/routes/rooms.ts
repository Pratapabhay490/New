import { Router } from 'express';
import { RoomService } from '../services/room.service';
import { asyncHandler } from '../middleware/error';
import { validateBody, validateParams, createRoomSchema, roomIdSchema } from '../middleware/validation';
import { createRoomLimiter } from '../middleware/rate-limit';
import { config } from '../config/constants';

const router = Router();

/**
 * POST /api/rooms
 * Create a new room
 */
router.post(
  '/',
  createRoomLimiter,
  validateBody(createRoomSchema),
  asyncHandler(async (req, res) => {
    const { expiresIn } = req.body;
    const room = await RoomService.createRoom(expiresIn);

    const inviteUrl = `${config.server.frontendUrl}/room/${room.id}`;

    res.status(201).json({
      success: true,
      data: {
        roomId: room.id,
        inviteUrl,
        expiresAt: room.expiresAt.toISOString(),
        maxParticipants: room.maxParticipants,
      },
    });
  })
);

/**
 * GET /api/rooms/:id
 * Get room details
 */
router.get(
  '/:id',
  validateParams(roomIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const room = await RoomService.getRoomWithParticipants(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    const activeParticipants = room.participants.filter((p) => p.isActive);

    res.json({
      success: true,
      data: {
        id: room.id,
        status: room.status,
        participantCount: activeParticipants.length,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt.toISOString(),
        expiresAt: room.expiresAt.toISOString(),
        isAvailable: await RoomService.isRoomAvailable(id),
      },
    });
  })
);

export default router;
