// Socket.IO event types for type-safe communication

// WebRTC Signaling
export interface WebRTCOffer {
  offer: RTCSessionDescriptionInit;
  from: string;
}

export interface WebRTCAnswer {
  answer: RTCSessionDescriptionInit;
  from: string;
}

export interface WebRTCIceCandidate {
  candidate: RTCIceCandidateInit;
  from: string;
}

// Media Control
export interface MediaToggle {
  userId: string;
  type: 'video' | 'audio';
  enabled: boolean;
}

export interface ScreenShareEvent {
  userId: string;
  isSharing: boolean;
}

// Annotation Events
export enum AnnotationTool {
  PENCIL = 'pencil',
  HIGHLIGHTER = 'highlighter',
  ERASER = 'eraser'
}

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  id: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
  userId: string;
}

export interface StrokeStartEvent {
  strokeId: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  point: Point;
  timestamp: number;
  userId: string;
}

export interface StrokeUpdateEvent {
  strokeId: string;
  points: Point[];
  timestamp: number;
  userId: string;
}

export interface StrokeEndEvent {
  strokeId: string;
  timestamp: number;
  userId: string;
}

export interface AnnotationClearEvent {
  userId: string;
  timestamp: number;
}

export interface AnnotationUndoEvent {
  userId: string;
  strokeId: string;
  timestamp: number;
}

export interface AnnotationRedoEvent {
  userId: string;
  strokeId: string;
  timestamp: number;
}

export interface ToolChangeEvent {
  userId: string;
  tool: AnnotationTool;
  color?: string;
  width?: number;
}

// Presence Events
export interface CursorMoveEvent {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface CursorHideEvent {
  userId: string;
}

// Room Events
export interface UserJoinedEvent {
  userId: string;
  socketId: string;
  participantCount: number;
  isInitiator: boolean;
}

export interface UserLeftEvent {
  userId: string;
  participantCount: number;
}

export interface RoomFullEvent {
  message: string;
  maxParticipants: number;
}

// Error Events
export interface ErrorEvent {
  code: string;
  message: string;
  details?: any;
}

// Client -> Server events
export interface ClientToServerEvents {
  'join-room': (data: { roomId: string }, callback: (response: any) => void) => void;
  'leave-room': (data: { roomId: string }) => void;
  
  // WebRTC signaling
  'webrtc:offer': (data: WebRTCOffer) => void;
  'webrtc:answer': (data: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (data: WebRTCIceCandidate) => void;
  'webrtc:renegotiate': () => void;
  
  // Media control
  'media:toggle-video': (data: MediaToggle) => void;
  'media:toggle-audio': (data: MediaToggle) => void;
  'media:screen-share-start': (data: ScreenShareEvent) => void;
  'media:screen-share-stop': (data: ScreenShareEvent) => void;
  
  // Annotations
  'annotation:stroke-start': (data: StrokeStartEvent) => void;
  'annotation:stroke-update': (data: StrokeUpdateEvent) => void;
  'annotation:stroke-end': (data: StrokeEndEvent) => void;
  'annotation:clear': (data: AnnotationClearEvent) => void;
  'annotation:undo': (data: AnnotationUndoEvent) => void;
  'annotation:redo': (data: AnnotationRedoEvent) => void;
  'annotation:tool-change': (data: ToolChangeEvent) => void;
  
  // Presence
  'cursor:move': (data: CursorMoveEvent) => void;
  'cursor:hide': (data: CursorHideEvent) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'user-joined': (data: UserJoinedEvent) => void;
  'user-left': (data: UserLeftEvent) => void;
  'room-full': (data: RoomFullEvent) => void;
  
  // WebRTC signaling
  'webrtc:offer': (data: WebRTCOffer) => void;
  'webrtc:answer': (data: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (data: WebRTCIceCandidate) => void;
  'webrtc:renegotiate': () => void;
  
  // Media control
  'media:toggle-video': (data: MediaToggle) => void;
  'media:toggle-audio': (data: MediaToggle) => void;
  'media:screen-share-start': (data: ScreenShareEvent) => void;
  'media:screen-share-stop': (data: ScreenShareEvent) => void;
  
  // Annotations
  'annotation:stroke-start': (data: StrokeStartEvent) => void;
  'annotation:stroke-update': (data: StrokeUpdateEvent) => void;
  'annotation:stroke-end': (data: StrokeEndEvent) => void;
  'annotation:clear': (data: AnnotationClearEvent) => void;
  'annotation:undo': (data: AnnotationUndoEvent) => void;
  'annotation:redo': (data: AnnotationRedoEvent) => void;
  'annotation:tool-change': (data: ToolChangeEvent) => void;
  
  // Presence
  'cursor:move': (data: CursorMoveEvent) => void;
  'cursor:hide': (data: CursorHideEvent) => void;
  
  // Error
  'error': (data: ErrorEvent) => void;
}

// Inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data
export interface SocketData {
  userId: string;
  roomId: string;
}
