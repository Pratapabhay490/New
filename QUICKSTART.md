# StudySync - Quick Start Guide

Get StudySync running locally in under 5 minutes!

## Prerequisites

Ensure you have these installed:
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Docker** (optional, for database) ([Download](https://www.docker.com/))
- **Git**

## Option 1: Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/studysync.git
cd studysync

# 2. Run the setup script (handles everything)
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh

# 3. Start all services
pnpm dev
```

That's it! Open http://localhost:3000 🎉

---

## Option 2: Manual Setup

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/studysync.git
cd studysync

# Install dependencies
pnpm install
```

### Step 2: Setup Database

**With Docker (Easy)**:
```bash
# Start PostgreSQL
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Wait 5 seconds for database to start
sleep 5
```

**Without Docker**:
```bash
# Install PostgreSQL 15+
# Create database
createdb studysync
```

### Step 3: Configure Environment

**Backend**:
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studysync?schema=public"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
SESSION_SECRET="your-secret-key-here"
```

**Frontend**:
```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

Edit `apps/frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
```

### Step 4: Setup Database Schema

```bash
cd apps/backend

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
pnpm prisma studio

cd ../..
```

### Step 5: Start Development Servers

**Terminal 1 - Backend**:
```bash
cd apps/backend
pnpm dev
```

**Terminal 2 - Frontend**:
```bash
cd apps/frontend
pnpm dev
```

Or start both at once from root:
```bash
pnpm dev
```

### Step 6: Open Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Prisma Studio**: http://localhost:5555 (if running)

---

## Verify Installation

### 1. Check Backend Health
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    ...
  }
}
```

### 2. Create Test Room
```bash
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "roomId": "...",
    "inviteUrl": "http://localhost:3000/room/...",
    ...
  }
}
```

### 3. Test in Browser

1. Open http://localhost:3000
2. Click "Create Study Room"
3. Copy the room URL
4. Open URL in a second browser/incognito window
5. Allow camera/microphone permissions
6. Verify video/audio connection works

---

## Common Issues & Fixes

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Fix**:
```bash
# Find process using port
lsof -i :3000  # or :3001 for backend

# Kill process
kill -9 <PID>

# Or use different ports
PORT=3002 pnpm dev
```

### Database Connection Error

**Error**: `Can't reach database server`

**Fix**:
```bash
# Check if PostgreSQL is running
docker ps  # if using Docker

# Restart database
docker-compose -f infrastructure/docker/docker-compose.yml restart postgres

# Verify DATABASE_URL in .env
```

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Fix**:
```bash
cd apps/backend
pnpm prisma generate
cd ../..
pnpm install
```

### Module Not Found Errors

**Error**: `Cannot find module '@studysync/shared-types'`

**Fix**:
```bash
# Build shared types
cd packages/shared-types
pnpm build
cd ../..

# Reinstall dependencies
pnpm install
```

### WebRTC Not Working

**Symptoms**: Video/audio not connecting

**Fix**:
- Check browser console for errors
- Ensure both users are in the same room
- Try different browsers (Chrome/Edge work best)
- Check firewall settings
- Verify STUN server is accessible

---

## Development Commands

```bash
# Root directory commands
pnpm dev          # Start all services
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm clean        # Clean build artifacts

# Backend commands
cd apps/backend
pnpm dev          # Start backend (port 3001)
pnpm build        # Build backend
pnpm start        # Start production build
pnpm test         # Run tests
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations
pnpm prisma:studio      # Open Prisma Studio

# Frontend commands
cd apps/frontend
pnpm dev          # Start frontend (port 3000)
pnpm build        # Build for production
pnpm start        # Start production build
pnpm lint         # Run linter
```

---

## Next Steps

### For Development

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
3. Review [API.md](./API.md) for API documentation

### For Production

1. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guides
2. Configure environment variables for production
3. Set up monitoring and logging
4. Configure custom domain
5. Enable SSL/TLS certificates

---

## Project Structure

```
studysync/
├── apps/
│   ├── frontend/          # Next.js app (port 3000)
│   └── backend/           # Express API (port 3001)
├── packages/
│   └── shared-types/      # Shared TypeScript types
├── infrastructure/
│   ├── docker/            # Docker configs
│   └── scripts/           # Setup scripts
├── README.md              # Main documentation
├── ARCHITECTURE.md        # System architecture
├── DEPLOYMENT.md          # Deployment guide
├── API.md                 # API documentation
└── QUICKSTART.md          # This file
```

---

## Features to Try

Once running, try these features:

1. **Video Chat**
   - Toggle camera on/off
   - Toggle microphone on/off
   - Adjust video quality

2. **Screen Sharing**
   - Share entire screen
   - Share specific window
   - Share browser tab

3. **Annotations**
   - Enable drawing mode
   - Choose different colors
   - Draw on shared screen
   - Undo drawings
   - Clear canvas

4. **Real-time Sync**
   - All actions sync instantly
   - See remote user's annotations
   - Collaborative drawing

---

## Getting Help

- **Documentation**: Check other .md files in this repo
- **GitHub Issues**: https://github.com/yourusername/studysync/issues
- **Email**: support@studysync.com

---

## What's Next?

Now that you're running locally:

1. **Experiment**: Try creating rooms, screen sharing, annotations
2. **Customize**: Modify colors, add features, improve UX
3. **Deploy**: Follow DEPLOYMENT.md to go live
4. **Contribute**: Check CONTRIBUTING.md to submit improvements

---

**Happy Collaborating! 🎉**
