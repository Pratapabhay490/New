export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED'
}

export interface Room {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  status: RoomStatus;
  creatorSocketId: string | null;
  maxParticipants: number;
}

export interface Participant {
  id: string;
  roomId: string;
  socketId: string;
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  peerId: string | null;
}

export interface CreateRoomRequest {
  expiresIn?: number; // seconds, default 24 hours
}

export interface CreateRoomResponse {
  roomId: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId: string;
  participants: Participant[];
  message?: string;
}

export interface RoomInfo {
  id: string;
  participantCount: number;
  maxParticipants: number;
  status: RoomStatus;
  createdAt: string;
  expiresAt: string;
}
