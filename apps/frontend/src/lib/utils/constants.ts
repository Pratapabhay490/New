export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
export const STUN_SERVER = process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302';

export const ANNOTATION_COLORS = [
  '#EF4444', // red
  '#F59E0B', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#000000', // black
  '#FFFFFF', // white
];

export const BRUSH_SIZES = [2, 4, 6, 10, 16, 24];

export const DEFAULT_BRUSH_SIZE = 4;
export const DEFAULT_COLOR = '#EF4444';

export const STROKE_BATCH_INTERVAL = 16; // ~60fps
export const CURSOR_UPDATE_THROTTLE = 50; // 20fps
