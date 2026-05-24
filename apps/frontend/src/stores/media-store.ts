import { create } from 'zustand';

interface MediaState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  remoteVideoEnabled: boolean;
  remoteAudioEnabled: boolean;
  remoteScreenSharing: boolean;
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;

  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setRemoteVideoEnabled: (enabled: boolean) => void;
  setRemoteAudioEnabled: (enabled: boolean) => void;
  setRemoteScreenSharing: (sharing: boolean) => void;
  setConnectionState: (state: RTCPeerConnectionState | null) => void;
  setIceConnectionState: (state: RTCIceConnectionState | null) => void;
  reset: () => void;
}

const initialState = {
  localStream: null,
  remoteStream: null,
  screenStream: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  isScreenSharing: false,
  remoteVideoEnabled: true,
  remoteAudioEnabled: true,
  remoteScreenSharing: false,
  connectionState: null,
  iceConnectionState: null,
};

export const useMediaStore = create<MediaState>((set) => ({
  ...initialState,

  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setVideoEnabled: (isVideoEnabled) => set({ isVideoEnabled }),
  setAudioEnabled: (isAudioEnabled) => set({ isAudioEnabled }),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setRemoteVideoEnabled: (remoteVideoEnabled) => set({ remoteVideoEnabled }),
  setRemoteAudioEnabled: (remoteAudioEnabled) => set({ remoteAudioEnabled }),
  setRemoteScreenSharing: (remoteScreenSharing) => set({ remoteScreenSharing }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setIceConnectionState: (iceConnectionState) => set({ iceConnectionState }),

  reset: () => set(initialState),
}));
