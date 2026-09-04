# 🛡️ Refuge Women's Safety App - Backend

Full-stack safety app with real-time location tracking, SOS alerts, and guardian notifications.

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if not using Docker)
- Git

### Setup with Docker (Recommended)

```bash
# 1. Clone repo
git clone <repo>
cd refuge-app

# 2. Copy environment variables
cp .env.example .env

# 3. Start services
docker-compose up -d

# 4. Check if services are running
docker-compose ps

# 5. Backend should be available at http://localhost:3000
curl http://localhost:3000/health
```

### Setup without Docker

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Update .env with local database credentials
# Make sure PostgreSQL and Redis are running locally

# 4. Run database migrations
npm run db:migrate

# 5. Seed test data (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

## Project Structure

```
src/
├── config/          # Configuration files (DB, Redis, etc.)
├── controllers/     # Request handlers (to be implemented)
├── services/        # Business logic
├── models/          # Database models
├── middleware/      # Express middleware
├── routes/          # API routes
├── utils/           # Utility functions
├── types/           # TypeScript types
└── database/        # Migrations and seeds
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/avatar` - Upload photo + generate avatar
- `GET /api/users/avatar/status` - Check avatar generation status

### Guardians
- `GET /api/guardians` - List guardians
- `POST /api/guardians` - Add guardian
- `DELETE /api/guardians/:id` - Remove guardian
- `POST /api/guardians/invite` - Send SMS invite

### SOS Alerts
- `POST /api/sos/trigger` - Trigger emergency alert
- `GET /api/sos/active` - Get active alerts
- `POST /api/sos/:id/acknowledge` - Acknowledge alert
- `POST /api/sos/:id/resolve` - Resolve alert
- `GET /api/sos/history` - Get alert history

### Location
- `POST /api/location/update` - Send location update
- `GET /api/location/history` - Get location history

### Safe Walk
- `POST /api/safe-walk/start` - Start safe walk session
- `POST /api/safe-walk/end` - End session

### Emergency Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact
- `DELETE /api/contacts/:id` - Delete contact

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings/code-word` - Update code word
- `PUT /api/settings/preferences` - Update preferences

## Development Workflows

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix issues
npm run type-check   # TypeScript type checking
```

### Database

```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# View schema
psql -h localhost -U postgres -d refuge_dev -f src/database/schema.sql
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=refuge_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRY=15m

# External APIs
DALLE_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=...
TWILIO_ACCOUNT_SID=...
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api

# Connect to database
docker-compose exec postgres psql -U postgres -d refuge_dev

# Connect to Redis
docker-compose exec redis redis-cli
```

## Database Schema

The database is initialized automatically on startup. Key tables:

- `users` - User accounts
- `guardians` - Trusted contacts
- `sos_alerts` - Emergency alerts
- `alert_recipients` - Alert notifications
- `location_history` - Location tracking
- `safe_walk_sessions` - Safe walk sessions
- `emergency_contacts` - User's emergency contacts
- `audit_logs` - Activity logging

See `src/database/schema.sql` for full schema.

## Real-time Features (Socket.IO)

WebSocket events for real-time updates:

```javascript
// Client connects
socket.on('connect', () => { ... });

// Location updates
socket.emit('location:send', { lat, lng, accuracy });
socket.on('location:update', (data) => { ... });

// SOS alerts
socket.on('alert:triggered', (alert) => { ... });
socket.on('alert:acknowledged', (alert) => { ... });

// Safe walk updates
socket.on('safe-walk:update', (location) => { ... });
```

## Monitoring & Logging

- Logs are written to `logs/` directory
- CloudWatch logging (production)
- Winston logger integration
- Error tracking with details

## Security Checklist

- [ ] All passwords hashed (bcryptjs)
- [ ] Code word encrypted (AES-256)
- [ ] Location data encrypted in transit (TLS 1.3)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all routes
- [ ] SQL injection protection
- [ ] CORS properly configured
- [ ] JWT token expiry set

## Troubleshooting

### Port already in use
```bash
# Find process on port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check password in .env
# Verify DB_HOST is correct (use 'postgres' in Docker)
```

### Redis connection failed
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Next Steps

1. Implement authentication service (hash passwords, JWT generation)
2. Build SOS alert system (database + notifications)
3. Add real-time location tracking (Socket.IO)
4. Integrate avatar generation (DALL-E API)
5. Setup AWS infrastructure (CDK)
6. Write tests for core features
7. Deploy to staging

## Contributing

1. Create feature branch
2. Make changes
3. Run tests & lint
4. Push and create PR

## License

MIT
