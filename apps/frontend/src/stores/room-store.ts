import { create } from 'zustand';
import { Participant } from '@studysync/shared-types';

export type RoomStatus = 'idle' | 'connecting' | 'waiting' | 'active' | 'disconnected' | 'error';

interface RoomState {
  roomId: string | null;
  participants: Participant[];
  userId: string | null;
  isHost: boolean;
  roomStatus: RoomStatus;
  error: string | null;

  setRoomId: (roomId: string) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  setUserId: (userId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setRoomStatus: (status: RoomStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  participants: [],
  userId: null,
  isHost: false,
  roomStatus: 'idle' as RoomStatus,
  error: null,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoomId: (roomId) => set({ roomId }),

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),

  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== userId),
    })),

  setUserId: (userId) => set({ userId }),

  setIsHost: (isHost) => set({ isHost }),

  setRoomStatus: (roomStatus) => set({ roomStatus }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
