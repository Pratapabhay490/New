export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RTCConfig {
  iceServers: ICEServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface ScreenShareConstraints {
  video: {
    cursor?: 'always' | 'motion' | 'never';
    displaySurface?: 'monitor' | 'window' | 'application' | 'browser';
    logicalSurface?: boolean;
    aspectRatio?: number;
    frameRate?: number;
    width?: number;
    height?: number;
  };
  audio?: boolean | {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
}

export interface MediaDeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
  groupId: string;
}

export interface PeerConnectionStats {
  bytesSent: number;
  bytesReceived: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  bitrate: number;
}

export enum ConnectionState {
  NEW = 'new',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed'
}

export enum SignalingState {
  STABLE = 'stable',
  HAVE_LOCAL_OFFER = 'have-local-offer',
  HAVE_REMOTE_OFFER = 'have-remote-offer',
  HAVE_LOCAL_PRANSWER = 'have-local-pranswer',
  HAVE_REMOTE_PRANSWER = 'have-remote-pranswer',
  CLOSED = 'closed'
}

export enum ICEConnectionState {
  NEW = 'new',
  CHECKING = 'checking',
  CONNECTED = 'connected',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DISCONNECTED = 'disconnected',
  CLOSED = 'closed'
}

export enum ICEGatheringState {
  NEW = 'new',
  GATHERING = 'gathering',
  COMPLETE = 'complete'
}

export interface WebRTCStats {
  connectionState: ConnectionState;
  iceConnectionState: ICEConnectionState;
  iceGatheringState: ICEGatheringState;
  signalingState: SignalingState;
  localCandidates: number;
  remoteCandidates: number;
  selectedCandidatePair?: {
    local: string;
    remote: string;
  };
}

export interface MediaStreamTrackInfo {
  id: string;
  kind: 'audio' | 'video';
  label: string;
  enabled: boolean;
  muted: boolean;
  readyState: MediaStreamTrackState;
}

export interface PeerConnectionConfig {
  rtcConfig: RTCConfig;
  mediaConstraints: MediaConstraints;
  screenShareConstraints?: ScreenShareConstraints;
}

export const DEFAULT_RTC_CONFIG: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export const DEFAULT_MEDIA_CONSTRAINTS: MediaConstraints = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1
  }
};

export const DEFAULT_SCREEN_SHARE_CONSTRAINTS: ScreenShareConstraints = {
  video: {
    cursor: 'always',
    displaySurface: 'monitor',
    frameRate: 30,
    width: 1920,
    height: 1080
  },
  audio: false
};
