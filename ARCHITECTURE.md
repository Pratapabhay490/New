# StudySync - Complete System Architecture

## Overview
StudySync is a real-time collaborative study platform for exactly 2 users per room, featuring screen sharing, video/audio communication, and collaborative annotations.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Real-time Communication**: Socket.IO Client
- **WebRTC**: Native WebRTC APIs
- **Canvas**: Fabric.js for collaborative drawing
- **Animations**: Framer Motion
- **Build Tool**: Turbopack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5+
- **WebSocket**: Socket.IO
- **Database ORM**: Prisma
- **Validation**: Zod
- **Security**: Helmet, CORS, rate-limit
- **Process Manager**: PM2 (production)

### Database
- **Primary**: PostgreSQL 15+
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Railway / Render / Fly.io
- **Database Hosting**: Railway / Supabase
- **STUN/TURN**: Google STUN (free) + Twilio TURN (optional)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client A                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   WebRTC     │  │  Socket.IO   │      │
│  │   Frontend   │  │  Peer Conn   │  │   Client     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ HTTP/WS          │ P2P Media        │ WS Events
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         ▼                  │                  ▼              │
│  ┌─────────────┐           │           ┌──────────────┐     │
│  │   Express   │           │           │  Socket.IO   │     │
│  │   Server    │           │           │   Server     │     │
│  └──────┬──────┘           │           └──────┬───────┘     │
│         │                  │                  │              │
│         ▼                  │                  │              │
│  ┌─────────────┐           │                  │              │
│  │  PostgreSQL │           │                  │              │
│  │  (Prisma)   │           │                  │              │
│  └─────────────┘           │                  │              │
│                            │                  │              │
│         Backend Server     │                  │              │
└────────────────────────────┼──────────────────┼─────────────┘
                             │                  │
                             │ P2P Media        │ WS Events
                             │                  │
┌────────────────────────────┼──────────────────┼─────────────┐
│         │                  │                  ▼              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────────────┐      │
│  │   Next.js    │  │   WebRTC     │  │  Socket.IO   │      │
│  │   Frontend   │  │  Peer Conn   │  │   Client     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                         Client B                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Room
- `id` (UUID, PK)
- `createdAt` (DateTime)
- `expiresAt` (DateTime)
- `status` (enum: ACTIVE, CLOSED, EXPIRED)
- `creatorSocketId` (String, nullable)
- `maxParticipants` (Int, default: 2)

### Participant
- `id` (UUID, PK)
- `roomId` (UUID, FK -> Room)
- `socketId` (String, unique)
- `joinedAt` (DateTime)
- `leftAt` (DateTime, nullable)
- `isActive` (Boolean)
- `peerId` (String, nullable)

### Session
- `id` (UUID, PK)
- `roomId` (UUID, FK -> Room)
- `startedAt` (DateTime)
- `endedAt` (DateTime, nullable)
- `duration` (Int, nullable) // seconds
- `participantCount` (Int)

### AnnotationEvent (optional optimization)
- `id` (UUID, PK)
- `roomId` (UUID, FK -> Room)
- `participantId` (UUID, FK -> Participant)
- `eventType` (enum: STROKE_START, STROKE_ADD, STROKE_END, CLEAR, UNDO)
- `payload` (JSONB)
- `timestamp` (DateTime)

## WebRTC Flow

### 1. Connection Establishment
```
Client A joins room
  ↓
Backend creates room in DB
  ↓
Client A waits for peer
  ↓
Client B joins room
  ↓
Backend notifies both clients
  ↓
Client A creates offer
  ↓
Client A sends offer via Socket.IO
  ↓
Client B receives offer
  ↓
Client B creates answer
  ↓
Client B sends answer via Socket.IO
  ↓
Client A receives answer
  ↓
Both clients exchange ICE candidates
  ↓
P2P connection established
```

### 2. Media Streaming
- Audio/Video: Peer-to-peer via WebRTC
- Screen Share: Peer-to-peer via WebRTC
- Annotations: Server-relayed via Socket.IO

### 3. ICE Servers Configuration
```typescript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Optional TURN servers
    {
      urls: 'turn:turnserver.example.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
}
```

## Socket.IO Events

### Connection Events
- `join-room` (client → server): Join a room
- `user-joined` (server → client): Notify peer joined
- `user-left` (server → client): Notify peer left
- `room-full` (server → client): Room at capacity
- `disconnect` (bidirectional): Handle disconnection

### WebRTC Signaling Events
- `webrtc:offer` (client → server → client): Send SDP offer
- `webrtc:answer` (client → server → client): Send SDP answer
- `webrtc:ice-candidate` (client → server → client): Exchange ICE candidates
- `webrtc:renegotiate` (client → server → client): Trigger renegotiation

### Media Control Events
- `media:toggle-video` (client → server → client): Video on/off
- `media:toggle-audio` (client → server → client): Audio on/off
- `media:screen-share-start` (client → server → client): Screen share started
- `media:screen-share-stop` (client → server → client): Screen share stopped

### Annotation Events
- `annotation:stroke-start` (client → server → client): Start drawing stroke
- `annotation:stroke-update` (client → server → client): Update stroke path
- `annotation:stroke-end` (client → server → client): Complete stroke
- `annotation:clear` (client → server → client): Clear canvas
- `annotation:undo` (client → server → client): Undo last action
- `annotation:redo` (client → server → client): Redo action
- `annotation:tool-change` (client → server → client): Tool/color change

### Presence Events
- `cursor:move` (client → server → client): Remote cursor position
- `cursor:hide` (client → server → client): Hide remote cursor

## Annotation Synchronization Strategy

### Event Batching
```typescript
// Batch stroke updates to reduce socket load
const batchInterval = 16; // ~60fps
const pendingStrokes: StrokeUpdate[] = [];

setInterval(() => {
  if (pendingStrokes.length > 0) {
    socket.emit('annotation:stroke-batch', pendingStrokes);
    pendingStrokes.length = 0;
  }
}, batchInterval);
```

### Stroke Data Structure
```typescript
interface Stroke {
  id: string;
  tool: 'pencil' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
}
```

### Conflict Resolution
- Last-write-wins (LWW) for simplicity
- Use timestamp for ordering
- 2 users only, so conflicts minimal

## State Management Architecture

### Zustand Stores

#### Room Store
```typescript
interface RoomState {
  roomId: string | null;
  participants: Participant[];
  isHost: boolean;
  roomStatus: 'idle' | 'waiting' | 'active' | 'disconnected';
}
```

#### Media Store
```typescript
interface MediaState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}
```

#### Annotation Store
```typescript
interface AnnotationState {
  canvas: fabric.Canvas | null;
  activeTool: Tool;
  color: string;
  brushSize: number;
  strokes: Stroke[];
  undoStack: Stroke[];
  redoStack: Stroke[];
}
```

#### UI Store
```typescript
interface UIState {
  isToolbarOpen: boolean;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  notifications: Notification[];
}
```

## Security Measures

### Rate Limiting
```typescript
// API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Socket events
const socketLimiter = new Map(); // Track per-socket rate limits
```

### Input Validation
```typescript
// Using Zod for schema validation
const createRoomSchema = z.object({
  expiresIn: z.number().min(300).max(86400).optional()
});
```

### CORS Configuration
```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST']
};
```

### Room ID Generation
```typescript
// Use crypto for secure random IDs
import { randomBytes } from 'crypto';
const roomId = randomBytes(16).toString('hex');
```

## Performance Optimizations

### Frontend
1. **Code Splitting**: Dynamic imports for heavy components
2. **Memoization**: React.memo for expensive components
3. **Canvas Optimization**: RequestAnimationFrame for smooth drawing
4. **Event Throttling**: Debounce socket emissions
5. **Lazy Loading**: Load media controls on demand

### Backend
1. **Connection Pooling**: Prisma connection pool
2. **Event Batching**: Batch annotation events
3. **Memory Management**: Clean up closed rooms periodically
4. **Redis (optional)**: Cache active room states
5. **Compression**: Enable gzip for HTTP responses

### WebRTC
1. **Adaptive Bitrate**: Adjust quality based on network
2. **TURN Fallback**: Use TURN only when STUN fails
3. **Codec Selection**: Prefer VP9/H.264 for video
4. **Audio Processing**: Enable noise suppression

## Deployment Architecture

### Production Setup
```
┌─────────────────────────────────────────────────────┐
│                    Vercel CDN                        │
│              (Next.js Frontend)                      │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTPS/WSS
                     ▼
┌─────────────────────────────────────────────────────┐
│              Railway/Render/Fly.io                   │
│           (Express + Socket.IO Backend)              │
└────────────────────┬────────────────────────────────┘
                     │
                     │ SSL Connection
                     ▼
┌─────────────────────────────────────────────────────┐
│           Railway PostgreSQL Database                │
│              (Managed Instance)                      │
└─────────────────────────────────────────────────────┘
```

### Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.studysync.com
NEXT_PUBLIC_WS_URL=wss://api.studysync.com
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
```

#### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/studysync
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://studysync.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-secret-key
TURN_SERVER_URL=turn:turnserver.com:3478
TURN_USERNAME=user
TURN_PASSWORD=pass
```

## Folder Structure

```
studysync/
├── apps/
│   ├── frontend/               # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   │   ├── page.tsx   # Landing page
│   │   │   │   ├── room/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # shadcn components
│   │   │   │   ├── room/      # Room-specific components
│   │   │   │   ├── annotations/ # Canvas components
│   │   │   │   └── landing/   # Landing page components
│   │   │   ├── lib/           # Utilities
│   │   │   │   ├── webrtc/    # WebRTC manager
│   │   │   │   ├── socket/    # Socket.IO client
│   │   │   │   └── utils.ts
│   │   │   ├── stores/        # Zustand stores
│   │   │   │   ├── room.ts
│   │   │   │   ├── media.ts
│   │   │   │   ├── annotation.ts
│   │   │   │   └── ui.ts
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── types/         # TypeScript types
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── next.config.js
│   │
│   └── backend/               # Express backend
│       ├── src/
│       │   ├── index.ts       # Entry point
│       │   ├── app.ts         # Express app setup
│       │   ├── server.ts      # HTTP + Socket.IO server
│       │   ├── routes/        # REST endpoints
│       │   │   ├── rooms.ts
│       │   │   └── health.ts
│       │   ├── sockets/       # Socket.IO handlers
│       │   │   ├── connection.ts
│       │   │   ├── signaling.ts
│       │   │   ├── annotations.ts
│       │   │   └── presence.ts
│       │   ├── services/      # Business logic
│       │   │   ├── room.service.ts
│       │   │   └── participant.service.ts
│       │   ├── middleware/    # Express middleware
│       │   │   ├── error.ts
│       │   │   ├── validation.ts
│       │   │   └── rate-limit.ts
│       │   ├── config/        # Configuration
│       │   │   ├── database.ts
│       │   │   └── constants.ts
│       │   └── types/         # TypeScript types
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/          # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   ├── room.ts
│       │   ├── socket-events.ts
│       │   └── webrtc.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   └── docker-compose.yml
│   └── scripts/
│       ├── setup.sh
│       └── deploy.sh
│
├── .gitignore
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # PNPM workspace
├── turbo.json               # Turborepo config
├── README.md
├── ARCHITECTURE.md
└── DEPLOYMENT.md
```

## Error Handling Strategy

### Frontend
1. Error Boundaries for component crashes
2. Toast notifications for user-facing errors
3. Retry logic for network failures
4. Fallback UI for permission denials

### Backend
1. Global error handler middleware
2. Structured error responses
3. Error logging to console/file
4. Graceful degradation

### WebRTC
1. Connection timeout handling
2. ICE failure recovery
3. Media track error handling
4. Automatic reconnection attempts

## Testing Strategy

### Unit Tests
- Utility functions
- Zustand store actions
- WebRTC manager methods
- Socket event handlers

### Integration Tests
- Socket.IO room management
- Database operations
- API endpoints
- WebRTC signaling flow

### E2E Tests (Optional)
- Room creation flow
- Two-user connection
- Screen sharing
- Annotation synchronization

## Monitoring & Logging

### Production Logging
```typescript
// Structured logging
logger.info('Room created', {
  roomId,
  timestamp: Date.now(),
  action: 'create-room'
});
```

### Metrics to Track
1. Active rooms count
2. Active connections count
3. Average session duration
4. WebRTC connection success rate
5. Socket event frequency
6. API response times

## Scalability Considerations

### Current Architecture (MVP)
- Single backend server
- Direct Socket.IO connections
- In-memory room state
- Suitable for: 10-50 concurrent rooms

### Future Scaling (Beyond MVP)
1. **Horizontal Scaling**: Multiple backend instances
2. **Redis Adapter**: Socket.IO Redis adapter for multi-server
3. **Load Balancer**: Nginx/HAProxy for traffic distribution
4. **SFU**: Selective Forwarding Unit for >2 participants
5. **CDN**: Static asset delivery optimization

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile Chrome/Safari (iOS 15+, Android 10+)

### Required APIs
- WebRTC (RTCPeerConnection)
- Canvas API
- WebSocket
- MediaDevices API
- Screen Capture API

## Progressive Enhancement

### Core Features (Required)
- Audio/Video communication
- Screen sharing
- Real-time annotations

### Enhanced Features (Optional)
- Noise suppression
- Virtual backgrounds
- Recording capabilities
- Chat functionality

## Recovery Mechanisms

### Reconnection Strategy
```typescript
// Exponential backoff
const reconnect = (attempt: number) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connectSocket(), delay);
};
```

### State Preservation
- Store room ID in sessionStorage
- Preserve media settings in localStorage
- Restore connection on page refresh

## Compliance & Privacy

### Data Handling
- No recording by default
- No annotation persistence (unless opted in)
- Rooms auto-expire after inactivity
- No personal data collection

### GDPR Considerations
- Minimal data collection
- Clear privacy policy
- User consent for media access
- Data deletion after session

## Future Enhancement Roadmap

### Phase 2 Features
1. Text chat sidebar
2. File sharing
3. Session recording
4. Emoji reactions
5. Collaborative cursors

### Phase 3 Features
1. Room scheduling
2. User authentication
3. Session history
4. Analytics dashboard
5. Mobile apps

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d postgres

# Run migrations
cd apps/backend && pnpm prisma migrate dev

# Start backend
cd apps/backend && pnpm dev

# Start frontend
cd apps/frontend && pnpm dev
```

### Production Build
```bash
# Build all packages
pnpm build

# Run production
pnpm start
```

## API Endpoints

### REST API
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join room
- `GET /api/health` - Health check

### WebSocket Namespace
- `/` - Main namespace for all room communication

## Success Metrics

### Technical Metrics
- WebRTC connection success rate > 95%
- Average latency < 100ms
- Annotation sync delay < 50ms
- Uptime > 99.5%

### User Experience Metrics
- Time to first connection < 3s
- Smooth drawing (60fps)
- No dropped frames during screen share
- Intuitive UI (minimal learning curve)

---

This architecture is designed for production deployment, scalability, and maintainability while keeping the scope focused on 2-user rooms.
