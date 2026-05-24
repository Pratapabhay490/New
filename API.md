# StudySync API Documentation

Complete API documentation for StudySync backend services.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.studysync.com`

## Authentication

Currently, StudySync does not require authentication. All rooms are accessible via invite URLs.

---

## REST API Endpoints

### Health Check

Check API and database health status.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 12345,
    "services": {
      "database": "up",
      "socket": "up"
    },
    "responseTime": "5ms"
  }
}
```

---

### Create Room

Create a new study room.

**Endpoint**: `POST /api/rooms`

**Request Body**:
```json
{
  "expiresIn": 86400  // Optional: seconds (default 24 hours)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "inviteUrl": "https://studysync.com/room/550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2024-01-02T00:00:00.000Z",
    "maxParticipants": 2
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many room creation attempts"
  }
}
```

---

### Get Room Info

Retrieve room details and availability.

**Endpoint**: `GET /api/rooms/:id`

**Parameters**:
- `id`: Room UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ACTIVE",
    "participantCount": 1,
    "maxParticipants": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-02T00:00:00.000Z",
    "isAvailable": true
  }
}
```

**Error Responses**:

Room not found:
```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room not found"
  }
}
```

---

## WebSocket Events

Connect to Socket.IO at the base URL.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

### Room Events

#### Join Room

**Event**: `join-room`

**Emit**:
```javascript
socket.emit('join-room', { roomId: 'uuid' }, (response) => {
  console.log(response);
});
```

**Response**:
```json
{
  "success": true,
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid",
  "isInitiator": true,
  "participants": [
    {
      "id": "participant-uuid",
      "socketId": "socket-id",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "isActive": true
    }
  ]
}
```

#### User Joined

**Event**: `user-joined`

**Listen**:
```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
});
```

**Data**:
```json
{
  "userId": "user-uuid",
  "socketId": "socket-id",
  "participantCount": 2,
  "isInitiator": false
}
```

#### User Left

**Event**: `user-left`

**Listen**:
```javascript
socket.on('user-left', (data) => {
  console.log('User left:', data);
});
```

**Data**:
```json
{
  "userId": "user-uuid",
  "participantCount": 1
}
```

#### Room Full

**Event**: `room-full`

**Listen**:
```javascript
socket.on('room-full', (data) => {
  console.log('Room is full:', data);
});
```

**Data**:
```json
{
  "message": "Room is full",
  "maxParticipants": 2
}
```

---

### WebRTC Signaling Events

#### Offer

**Emit**:
```javascript
socket.emit('webrtc:offer', {
  offer: rtcSessionDescription,
  from: socket.id
});
```

**Listen**:
```javascript
socket.on('webrtc:offer', (data) => {
  console.log('Received offer from:', data.from);
  // Handle offer
});
```

#### Answer

**Emit**:
```javascript
socket.emit('webrtc:answer', {
  answer: rtcSessionDescription,
  from: socket.id
});
```

**Listen**:
```javascript
socket.on('webrtc:answer', (data) => {
  console.log('Received answer from:', data.from);
  // Handle answer
});
```

#### ICE Candidate

**Emit**:
```javascript
socket.emit('webrtc:ice-candidate', {
  candidate: iceCandidate,
  from: socket.id
});
```

**Listen**:
```javascript
socket.on('webrtc:ice-candidate', (data) => {
  // Add ICE candidate
});
```

---

### Media Control Events

#### Toggle Video

**Emit**:
```javascript
socket.emit('media:toggle-video', {
  userId: 'user-uuid',
  type: 'video',
  enabled: true
});
```

**Listen**:
```javascript
socket.on('media:toggle-video', (data) => {
  console.log('Remote video:', data.enabled);
});
```

#### Toggle Audio

**Emit**:
```javascript
socket.emit('media:toggle-audio', {
  userId: 'user-uuid',
  type: 'audio',
  enabled: true
});
```

**Listen**:
```javascript
socket.on('media:toggle-audio', (data) => {
  console.log('Remote audio:', data.enabled);
});
```

#### Screen Share

**Start**:
```javascript
socket.emit('media:screen-share-start', {
  userId: 'user-uuid',
  isSharing: true
});
```

**Stop**:
```javascript
socket.emit('media:screen-share-stop', {
  userId: 'user-uuid',
  isSharing: false
});
```

---

### Annotation Events

#### Stroke Start

**Emit**:
```javascript
socket.emit('annotation:stroke-start', {
  strokeId: 'stroke-uuid',
  tool: 'pencil',
  color: '#EF4444',
  width: 4,
  point: { x: 100, y: 200 },
  timestamp: Date.now(),
  userId: 'user-uuid'
});
```

#### Stroke Update

**Emit**:
```javascript
socket.emit('annotation:stroke-update', {
  strokeId: 'stroke-uuid',
  points: [
    { x: 100, y: 200 },
    { x: 101, y: 201 }
  ],
  timestamp: Date.now(),
  userId: 'user-uuid'
});
```

#### Stroke End

**Emit**:
```javascript
socket.emit('annotation:stroke-end', {
  strokeId: 'stroke-uuid',
  timestamp: Date.now(),
  userId: 'user-uuid'
});
```

#### Clear Canvas

**Emit**:
```javascript
socket.emit('annotation:clear', {
  userId: 'user-uuid',
  timestamp: Date.now()
});
```

#### Undo

**Emit**:
```javascript
socket.emit('annotation:undo', {
  userId: 'user-uuid',
  strokeId: 'stroke-uuid',
  timestamp: Date.now()
});
```

---

### Presence Events

#### Cursor Move

**Emit**:
```javascript
socket.emit('cursor:move', {
  userId: 'user-uuid',
  x: 100,
  y: 200,
  timestamp: Date.now()
});
```

**Listen**:
```javascript
socket.on('cursor:move', (data) => {
  // Update remote cursor position
});
```

#### Cursor Hide

**Emit**:
```javascript
socket.emit('cursor:hide', {
  userId: 'user-uuid'
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `ROOM_NOT_FOUND` | Room does not exist |
| `ROOM_FULL` | Room has reached max participants |
| `ROOM_NOT_AVAILABLE` | Room is expired or closed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_SERVER_ERROR` | Unexpected error occurred |
| `NOT_FOUND` | Route not found |

---

## Rate Limits

### API Endpoints
- **Window**: 15 minutes
- **Max Requests**: 100 per IP

### Room Creation
- **Window**: 15 minutes
- **Max Requests**: 10 per IP

### Socket Events
- **Annotations**: 200 events per second
- **Signaling**: 50 events per second
- **Cursor Updates**: 20 events per second (throttled)

---

## Data Models

### Room
```typescript
{
  id: string;              // UUID
  createdAt: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  creatorSocketId: string | null;
  maxParticipants: number; // Default: 2
}
```

### Participant
```typescript
{
  id: string;              // UUID
  roomId: string;
  socketId: string;
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  peerId: string | null;
}
```

### Session
```typescript
{
  id: string;              // UUID
  roomId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null; // seconds
  participantCount: number;
}
```

---

## Testing

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Create Room
```bash
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Get Room
```bash
curl http://localhost:3001/api/rooms/{roomId}
```

---

## WebSocket Testing

Using Socket.IO client:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected');
  
  socket.emit('join-room', { roomId: 'test-room' }, (response) => {
    console.log('Join response:', response);
  });
});
```

---

## Support

For API questions or issues:
- GitHub Issues: https://github.com/yourusername/studysync/issues
- Email: api@studysync.com
