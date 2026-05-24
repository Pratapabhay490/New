# StudySync - Collaborative Study Platform

<div align="center">

![StudySync Logo](https://img.shields.io/badge/StudySync-Collaborative%20Learning-blue?style=for-the-badge)

**Real-time collaborative studying platform with screen sharing, video chat, and live annotations.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-orange.svg)](https://webrtc.org/)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Deployment](#deployment) • [Documentation](#documentation)

</div>

---

## 🎯 Overview

StudySync is a production-ready, real-time collaborative study platform designed for exactly **two users per room**. It combines high-quality video/audio communication, screen sharing, and collaborative annotations to create the perfect environment for tutoring, pair programming, or focused study sessions.

### ✨ Key Features

- 🎥 **HD Video & Audio** - Crystal clear WebRTC communication with low latency
- 🖥️ **Screen Sharing** - Share your entire screen or specific windows
- ✏️ **Live Annotations** - Draw and highlight together in real-time over shared screens
- 👥 **1-on-1 Focus** - Optimized for two-person collaboration
- 🔒 **Secure & Private** - No recording, temporary rooms, automatic expiry
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🚀 **Production Ready** - Docker support, comprehensive error handling, monitoring

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **WebRTC**: Native WebRTC APIs
- **Canvas**: Fabric.js
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript 5
- **WebSocket**: Socket.IO
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Security**: Helmet, CORS, Rate Limiting

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / Render / Fly.io
- **Database Hosting**: Railway / Supabase
- **WebRTC**: Google STUN (free) + optional TURN

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+ (or Docker)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/studysync.git
cd studysync
```

2. **Run setup script**
```bash
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh
```

This will:
- Install all dependencies
- Create environment files
- Start PostgreSQL with Docker
- Generate Prisma client
- Run database migrations

3. **Start development servers**
```bash
# Start all services
pnpm dev

# Or start individually
cd apps/backend && pnpm dev    # Backend on http://localhost:3001
cd apps/frontend && pnpm dev   # Frontend on http://localhost:3000
```

4. **Open your browser**
Navigate to http://localhost:3000

---

## 📖 Usage

### Creating a Room

1. Visit the landing page
2. Click "Create Study Room"
3. Share the generated invite URL with your study partner
4. Enable camera, microphone, and optionally screen sharing

### Using Annotations

1. Click the pencil icon to enable drawing mode
2. Select a color from the right-side palette
3. Draw directly on the shared screen
4. Use undo/clear buttons to manage annotations
5. Click the eye icon to disable drawing mode

### Media Controls

- **Video Toggle**: Enable/disable your camera
- **Audio Toggle**: Mute/unmute your microphone
- **Screen Share**: Share your screen with your partner
- **Leave Call**: Exit the room and return to home

---

## 🏛️ Architecture

### System Overview

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
┌─────────▼──────────────────┼──────────────────▼─────────────┐
│         Express Server     │           Socket.IO Server      │
│         + REST API         │           + Signaling           │
│              │             │                  │              │
│         PostgreSQL ◄───────┼──────────────────┘              │
│         (Prisma)           │                                 │
│                            │                                 │
│         Backend Server     │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ P2P Media
                             │
┌─────────────────────────────▼───────────────────────────────┐
│                         Client B                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend:**
- **WebRTC Manager**: Handles peer connections, media streams, ICE negotiation
- **Socket Manager**: Manages WebSocket connections with reconnection logic
- **Canvas Manager**: Real-time annotation synchronization using Fabric.js
- **State Stores**: Zustand stores for room, media, annotation, and UI state

**Backend:**
- **Socket.IO Server**: WebRTC signaling and real-time event relay
- **Express API**: REST endpoints for room management
- **Prisma ORM**: Type-safe database operations
- **Service Layer**: Business logic for rooms, participants, sessions

### Database Schema

- **Rooms**: Room metadata, expiry, status
- **Participants**: User connections, socket IDs
- **Sessions**: Session duration tracking
- **AnnotationEvents**: Optional annotation history

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

---

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start all services (database, backend, frontend)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

### Production Deployment

```bash
# Build production images
docker-compose -f infrastructure/docker/docker-compose.yml build

# Start with production environment
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Run migrations
docker exec studysync-backend npx prisma migrate deploy
```

---

## ☁️ Cloud Deployment

### Vercel (Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd apps/frontend`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard

### Railway (Backend + Database)

1. Create Railway account
2. Create new project
3. Add PostgreSQL database service
4. Add backend service from GitHub
5. Set environment variables
6. Deploy

### Alternative Platforms

- **Backend**: Render, Fly.io, Heroku
- **Database**: Supabase, Neon, AWS RDS
- **Frontend**: Netlify, Cloudflare Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides.

---

## 📁 Project Structure

```
studysync/
├── apps/
│   ├── frontend/               # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities & managers
│   │   │   ├── stores/        # Zustand stores
│   │   │   └── hooks/         # Custom React hooks
│   │   └── package.json
│   │
│   └── backend/               # Express backend
│       ├── src/
│       │   ├── routes/        # REST endpoints
│       │   ├── sockets/       # Socket.IO handlers
│       │   ├── services/      # Business logic
│       │   ├── middleware/    # Express middleware
│       │   └── config/        # Configuration
│       ├── prisma/            # Database schema
│       └── package.json
│
├── packages/
│   └── shared-types/          # Shared TypeScript types
│
├── infrastructure/
│   ├── docker/                # Docker configs
│   └── scripts/               # Setup & deployment scripts
│
├── ARCHITECTURE.md            # System architecture
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL="postgresql://user:pass@host:5432/studysync"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://your-frontend.vercel.app"
SESSION_SECRET="your-secret-key"
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="https://your-backend.railway.app"
NEXT_PUBLIC_WS_URL="https://your-backend.railway.app"
NEXT_PUBLIC_STUN_SERVER="stun:stun.l.google.com:19302"
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Backend tests
cd apps/backend && pnpm test

# Frontend tests (when added)
cd apps/frontend && pnpm test

# Test coverage
pnpm test --coverage
```

---

## 📊 Monitoring & Logging

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Logs

- **Development**: Console output with Winston
- **Production**: File logging to `logs/` directory
- **Structured Logging**: JSON format for easy parsing

### Metrics

- Active rooms count
- Active connections
- WebRTC connection success rate
- API response times

---

## 🔒 Security Features

- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration
- ✅ Rate limiting (API & Socket events)
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ XSS protection
- ✅ Secure room ID generation
- ✅ Automatic room expiry
- ✅ No data persistence (privacy-first)

---

## 🚦 Performance Optimizations

- **Frontend**: Code splitting, lazy loading, memoization
- **Backend**: Connection pooling, event batching, compression
- **WebRTC**: Adaptive bitrate, codec selection
- **Annotations**: Throttled updates (~60fps)
- **Database**: Indexed queries, periodic cleanup

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **WebRTC** - Real-time communication
- **Socket.IO** - WebSocket library
- **Next.js** - React framework
- **Prisma** - Database ORM
- **Tailwind CSS** - Styling
- **Fabric.js** - Canvas library

---

## 📞 Support

For issues, questions, or contributions:

- 📧 Email: support@studysync.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/studysync/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/studysync/discussions)

---

<div align="center">

**Built with ❤️ for collaborative learning**

[⬆ Back to Top](#studysync---collaborative-study-platform)

</div>
