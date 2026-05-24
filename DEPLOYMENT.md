# StudySync Deployment Guide

This guide covers various deployment options for StudySync in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Vercel (Frontend)](#vercel-deployment)
- [Railway (Backend + Database)](#railway-deployment)
- [Other Platforms](#alternative-platforms)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Domain name (optional but recommended)
- SSL certificates (provided by hosting platforms)
- GitHub account for CI/CD
- Payment method for hosting services

---

## Environment Setup

### 1. Required Environment Variables

#### Backend
```bash
DATABASE_URL="postgresql://user:pass@host:5432/studysync?schema=public"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://studysync.vercel.app"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET="generated-secure-secret-key-here"
DEFAULT_ROOM_EXPIRY=86400
MAX_PARTICIPANTS_PER_ROOM=2
CLEANUP_INTERVAL_MS=3600000
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL="https://api.studysync.railway.app"
NEXT_PUBLIC_WS_URL="https://api.studysync.railway.app"
NEXT_PUBLIC_STUN_SERVER="stun:stun.l.google.com:19302"
```

### 2. Generate Secrets

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Docker Deployment

### Production Docker Compose

1. **Update docker-compose.yml with production values**

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/studysync
      SESSION_SECRET: ${SESSION_SECRET}
      FRONTEND_URL: https://yourdomain.com
    restart: always

  frontend:
    build:
      args:
        NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    restart: always
```

2. **Deploy**

```bash
# Build images
docker-compose -f infrastructure/docker/docker-compose.yml build

# Start services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Run migrations
docker exec studysync-backend npx prisma migrate deploy

# Check logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

3. **Setup Reverse Proxy (Nginx)**

```nginx
# /etc/nginx/sites-available/studysync

# Frontend
server {
    listen 80;
    server_name studysync.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend
server {
    listen 80;
    server_name api.studysync.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **SSL with Certbot**

```bash
sudo certbot --nginx -d studysync.com -d api.studysync.com
```

---

## Vercel Deployment

### Step-by-Step

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Navigate to Frontend**
```bash
cd apps/frontend
```

3. **Configure vercel.json** (optional)
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.studysync.railway.app/api/:path*"
    }
  ]
}
```

4. **Deploy**
```bash
vercel --prod
```

5. **Set Environment Variables** (Vercel Dashboard)
- Go to Project Settings → Environment Variables
- Add:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_WS_URL`
  - `NEXT_PUBLIC_STUN_SERVER`

6. **Custom Domain** (Optional)
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

### GitHub Integration

1. Connect repository to Vercel
2. Vercel will auto-deploy on push to main branch
3. Preview deployments for pull requests

---

## Railway Deployment

### Backend + Database

1. **Create Railway Account**
- Visit https://railway.app
- Sign up with GitHub

2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your repository

3. **Add PostgreSQL Database**
- Click "+ New"
- Select "Database" → "PostgreSQL"
- Railway provides `DATABASE_URL` automatically

4. **Configure Backend Service**
- Click "+ New"
- Select "GitHub Repo"
- Choose your repository
- Set root directory: `apps/backend`

5. **Set Environment Variables**
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://studysync.vercel.app
SESSION_SECRET=your-generated-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DEFAULT_ROOM_EXPIRY=86400
MAX_PARTICIPANTS_PER_ROOM=2
CLEANUP_INTERVAL_MS=3600000
```

6. **Add Build Commands**
- Build Command: `pnpm install && pnpm prisma generate && pnpm build`
- Start Command: `npx prisma migrate deploy && node dist/index.js`

7. **Deploy**
- Railway automatically deploys on push
- Get your URL: `https://studysync-backend.railway.app`

8. **Custom Domain** (Optional)
- Go to Settings → Domains
- Add custom domain
- Update DNS records

---

## Alternative Platforms

### Render

**Backend:**
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd apps/backend && pnpm install && pnpm build`
4. Set start command: `cd apps/backend && npx prisma migrate deploy && node dist/index.js`
5. Add environment variables
6. Deploy

**Database:**
1. Create PostgreSQL database
2. Copy connection string
3. Add to backend environment

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to backend
cd apps/backend

# Initialize Fly app
fly launch

# Set secrets
fly secrets set DATABASE_URL="postgresql://..." \
  SESSION_SECRET="..." \
  FRONTEND_URL="https://..."

# Deploy
fly deploy
```

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create apps
heroku create studysync-backend
heroku create studysync-frontend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini -a studysync-backend

# Deploy backend
cd apps/backend
git subtree push --prefix apps/backend heroku main

# Deploy frontend
cd apps/frontend
git subtree push --prefix apps/frontend heroku main
```

---

## Post-Deployment

### 1. Database Migrations

```bash
# Via Docker
docker exec studysync-backend npx prisma migrate deploy

# Via Railway CLI
railway run npx prisma migrate deploy

# Via SSH
ssh user@server
cd studysync/apps/backend
npx prisma migrate deploy
```

### 2. Health Checks

```bash
# Backend health
curl https://api.studysync.com/api/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 12345,
    "services": {
      "database": "up",
      "socket": "up"
    }
  }
}
```

### 3. Test Room Creation

```bash
# Create a test room
curl -X POST https://api.studysync.com/api/rooms \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "inviteUrl": "https://studysync.com/room/uuid",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### 4. WebRTC Testing

1. Open room in two different browsers/devices
2. Verify video/audio connection
3. Test screen sharing
4. Test annotations

---

## Monitoring

### Application Monitoring

**LogRocket / Sentry**
```typescript
// Frontend
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Datadog / New Relic**
```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Uptime Monitoring

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring with alerts
- **Better Uptime**: Status pages and monitoring

### Log Aggregation

- **Logtail**: Real-time log streaming
- **Papertrail**: Log management
- **LogDNA**: Log analysis

### Database Monitoring

```bash
# Railway provides built-in metrics

# External monitoring
# - Datadog Database Monitoring
# - pganalyze (PostgreSQL-specific)
```

---

## Troubleshooting

### Common Issues

#### 1. WebRTC Connection Fails

**Symptoms**: Users can't see/hear each other

**Solutions**:
- Check STUN server configuration
- Add TURN server for restrictive networks
- Verify firewall allows UDP ports
- Test with different networks

#### 2. Socket.IO Disconnects

**Symptoms**: Frequent disconnections

**Solutions**:
- Increase `pingTimeout` in socket config
- Check reverse proxy WebSocket settings
- Verify CORS configuration
- Enable sticky sessions for load balancer

#### 3. Database Connection Errors

**Symptoms**: 500 errors, "Cannot connect to database"

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database server is running
- Verify SSL settings for production databases
- Increase connection pool size

#### 4. Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:
- Check Node version (use 20+)
- Verify all dependencies are installed
- Clear build cache
- Check for TypeScript errors

#### 5. CORS Errors

**Symptoms**: API requests blocked by browser

**Solutions**:
- Update `FRONTEND_URL` in backend
- Verify CORS middleware configuration
- Check request headers
- Ensure credentials are included

### Debug Mode

```bash
# Backend debug logs
DEBUG=* node dist/index.js

# Frontend debug mode
NEXT_PUBLIC_DEBUG=true pnpm dev
```

### Performance Issues

```bash
# Database query analysis
cd apps/backend
npx prisma studio

# Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Backend profiling
node --inspect dist/index.js
```

---

## Scaling Considerations

### Horizontal Scaling

**Requirements:**
- Redis for Socket.IO adapter
- Sticky sessions on load balancer
- Shared file storage (if recording)

**Setup with Redis:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Database Scaling

- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: PgBouncer
- **Caching**: Redis for session data

### CDN Integration

- Cloudflare for static assets
- CloudFront for global distribution
- Fastly for edge computing

---

## Backup & Recovery

### Database Backups

```bash
# Automated backups (Railway)
# Configured in Railway dashboard

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Disaster Recovery Plan

1. **Daily automated backups**
2. **Weekly backup verification**
3. **Documented recovery procedures**
4. **Tested rollback process**

---

## Security Checklist

- [ ] Environment variables secured
- [ ] SSL/TLS certificates active
- [ ] Rate limiting enabled
- [ ] Database credentials rotated
- [ ] Firewall configured
- [ ] Security headers (Helmet.js)
- [ ] Input validation active
- [ ] CORS properly configured
- [ ] Logs don't contain sensitive data
- [ ] Regular dependency updates

---

## Cost Estimation

### Free Tier (Development)
- **Vercel**: Free for personal projects
- **Railway**: $5/month (500 hrs + database)
- **Total**: ~$5/month

### Production (Small Scale)
- **Vercel Pro**: $20/month
- **Railway Pro**: $20/month
- **Domain**: $12/year
- **Monitoring**: $10/month
- **Total**: ~$50/month

### Production (Medium Scale)
- **Vercel Enterprise**: $150/month
- **Railway with scaling**: $100/month
- **TURN Servers**: $50/month
- **Monitoring**: $30/month
- **Total**: ~$330/month

---

## Support

For deployment issues:
- Check [Troubleshooting](#troubleshooting) section
- Open GitHub issue
- Contact support@studysync.com

---

**Last Updated**: 2024-01-01
