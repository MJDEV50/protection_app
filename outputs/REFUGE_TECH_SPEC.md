# 🛡️ Refuge Women's Safety App - Tech Architecture

## Executive Summary
Full-stack safety app with real-time location tracking, SOS alerts, and guardian notifications. Built for speed, security, and reliability.

---

## Tech Stack

### Frontend
- **React Native** (Expo) - iOS/Android
- **Redux** or **Context API** - State management
- **React Navigation** - Routing
- **Firebase Cloud Messaging (FCM)** - Push notifications

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type safety
- **Passport.js** - Auth
- **Socket.io** - Real-time location tracking
- **Bull** - Job queue (async tasks)

### Database
- **PostgreSQL** - Primary RDBMS (RDS)
- **Redis** - Cache + real-time location buffer
- **S3** - Avatar/media storage

### Infrastructure
- **AWS**
  - RDS (PostgreSQL)
  - Lambda (serverless functions)
  - API Gateway
  - Cognito (auth)
  - SNS (notifications)
  - CloudFront (CDN)
  - EventBridge (event triggers)
- **AWS CDK** (TypeScript) - Infrastructure as code

### External Services
- **DALL-E 3 API** - Avatar generation ($0.06/avatar)
- **Twilio** - SMS notifications (backup)
- **Google Maps API** - Location/geocoding
- **Firebase** - Push notifications

---

## Database Schema

### Core Tables

#### `users`
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
phone (VARCHAR, UNIQUE)
first_name (VARCHAR)
last_name (VARCHAR)
password_hash (VARCHAR)
avatar_url (TEXT)
avatar_prompt (TEXT)
code_word (VARCHAR, encrypted)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `guardians` (User's trusted contacts)
```sql
id (UUID, PK)
user_id (UUID, FK → users)
guardian_user_id (UUID, FK → users, nullable)
name (VARCHAR)
phone (VARCHAR, unique per user)
email (VARCHAR)
relationship (VARCHAR: friend, family, partner, other)
is_active (BOOLEAN)
notification_method (VARCHAR: sms, push, email)
created_at (TIMESTAMP)
```

#### `sos_alerts`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
trigger_type (VARCHAR: manual, code_word, fake_call, auto)
latitude (DECIMAL)
longitude (DECIMAL)
location_address (TEXT)
audio_url (TEXT, nullable)
photo_url (TEXT, nullable)
status (VARCHAR: active, resolved, cancelled)
started_at (TIMESTAMP)
ended_at (TIMESTAMP, nullable)
created_at (TIMESTAMP)
```

#### `alert_recipients`
```sql
id (UUID, PK)
alert_id (UUID, FK → sos_alerts)
guardian_id (UUID, FK → guardians)
notification_sent_at (TIMESTAMP)
notification_type (VARCHAR: sms, push, email)
is_acknowledged (BOOLEAN)
acknowledged_at (TIMESTAMP, nullable)
```

#### `location_history`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
alert_id (UUID, FK → sos_alerts, nullable)
latitude (DECIMAL)
longitude (DECIMAL)
accuracy (DECIMAL)
speed (DECIMAL, nullable)
timestamp (TIMESTAMP)
```

#### `safe_walk_sessions`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
started_at (TIMESTAMP)
ended_at (TIMESTAMP, nullable)
destination_latitude (DECIMAL, nullable)
destination_longitude (DECIMAL, nullable)
status (VARCHAR: active, completed, cancelled)
```

#### `safe_walk_watchers`
```sql
id (UUID, PK)
session_id (UUID, FK → safe_walk_sessions)
guardian_id (UUID, FK → guardians)
watching_since (TIMESTAMP)
```

#### `fake_calls`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
caller_id (VARCHAR)
duration_seconds (INTEGER)
call_type (VARCHAR: incoming, outgoing)
status (VARCHAR: completed, missed, declined)
created_at (TIMESTAMP)
```

#### `emergency_contacts`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
name (VARCHAR)
phone (VARCHAR)
category (VARCHAR: police, hospital, taxi, other)
created_at (TIMESTAMP)
```

#### `device_tokens`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
token (TEXT)
device_type (VARCHAR: ios, android)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `audit_logs`
```sql
id (UUID, PK)
user_id (UUID, FK → users)
action (VARCHAR)
details (JSONB)
ip_address (VARCHAR)
created_at (TIMESTAMP)
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register        - User registration
POST   /api/auth/login           - User login
POST   /api/auth/refresh         - Refresh token
POST   /api/auth/logout          - User logout
POST   /api/auth/forgot-password - Password reset
POST   /api/auth/reset-password  - Reset password with token
```

### User Profile
```
GET    /api/users/me             - Get current user
PUT    /api/users/me             - Update profile
POST   /api/users/avatar         - Upload avatar + generate
GET    /api/users/avatar/status  - Check avatar generation status
```

### Guardians
```
GET    /api/guardians            - List user's guardians
POST   /api/guardians            - Add guardian
DELETE /api/guardians/:id        - Remove guardian
PUT    /api/guardians/:id        - Update guardian
POST   /api/guardians/invite     - Send SMS invite
GET    /api/guardians/:id/status - Guardian online status
```

### SOS Alerts
```
POST   /api/sos/trigger          - Trigger emergency alert
GET    /api/sos/active           - Get active alert (for guardians)
POST   /api/sos/:id/acknowledge  - Guardian acknowledges alert
POST   /api/sos/:id/resolve      - Resolve alert
GET    /api/sos/history          - Get alert history
```

### Location
```
POST   /api/location/update      - Send location update
GET    /api/location/history     - Get location history for alert
```

### Safe Walk
```
POST   /api/safe-walk/start      - Start safe walk
POST   /api/safe-walk/end        - End safe walk
GET    /api/safe-walk/active     - Get active session
POST   /api/safe-walk/add-watcher - Add guardian to watch
```

### Emergency Contacts
```
GET    /api/contacts             - List emergency contacts
POST   /api/contacts             - Add contact
DELETE /api/contacts/:id         - Delete contact
```

### Settings
```
GET    /api/settings             - Get user settings
PUT    /api/settings/code-word   - Update code word
PUT    /api/settings/preferences - Update notification preferences
PUT    /api/settings/privacy     - Update privacy settings
```

### WebSocket Events (Real-time)
```
socket.on('location:update')     - Receive location updates
socket.on('alert:triggered')     - Alert triggered
socket.on('alert:acknowledged')  - Guardian acknowledged
socket.on('safe-walk:update')    - Safe walk location update
socket.emit('location:send')     - Send location
```

---

## AWS Infrastructure (CDK)

### VPC Setup
- Private subnets for RDS
- Public subnets for ALB
- NAT Gateway for outbound traffic
- Security groups for each service

### RDS PostgreSQL
- Multi-AZ for HA
- Automated backups (30-day retention)
- Enhanced monitoring
- Encryption at rest (KMS)
- SSL connections only

### Lambda Functions
- **Avatar Generation** - Async DALL-E calls
- **SOS Notification** - Send alerts to guardians
- **Location Processing** - Buffer + clean location data
- **Geofencing** - Check safe zones
- **Cleanup Jobs** - Archive old data

### API Gateway
- REST API endpoints
- WebSocket API for real-time
- Rate limiting
- API key management
- CloudWatch logging

### Cognito
- User pools for auth
- MFA support
- Social login (optional)
- Custom attributes (code_word)

### SNS Topics
- `sos-alerts` - SOS notifications
- `location-updates` - Location tracking
- `safe-walk-updates` - Safe walk notifications

### CloudWatch
- Custom metrics for alerts, active users
- Alarms for failed notifications
- Logs for all services
- X-Ray tracing for debugging

---

## Security Checklist

- [ ] All passwords hashed (bcrypt)
- [ ] Code word encrypted (AES-256)
- [ ] Location data encrypted in transit (TLS 1.3)
- [ ] Database encryption at rest (AWS KMS)
- [ ] Rate limiting on auth endpoints
- [ ] JWT token expiry (15 min access, 7-day refresh)
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] Audit logging for sensitive actions
- [ ] PII redacted in logs
- [ ] Regular security patches
- [ ] OWASP compliance checks
- [ ] Penetration testing plan
- [ ] GDPR/CCPA compliance (data deletion, export)

---

## Deployment Strategy

### Environments
1. **Dev** - Local + AWS dev account
2. **Staging** - Pre-production mirror
3. **Production** - HA setup with auto-scaling

### CI/CD Pipeline
- GitHub Actions
- Run tests on every PR
- Deploy to staging on merge
- Manual promotion to production
- Automated rollback on failure

### Monitoring & Alerting
- CloudWatch dashboards
- PagerDuty integration
- Slack notifications
- Performance metrics
- Error rate tracking

---

## Scalability Considerations

### Database
- Connection pooling (pgBouncer)
- Read replicas for analytics
- Partitioning for large tables (by date/region)
- Indexing strategy for common queries

### Application
- Horizontal auto-scaling (ECS/EKS)
- Load balancing (ALB)
- Caching layer (Redis)
- CDN for static assets

### Real-time
- WebSocket server clustering
- Redis pub/sub for cross-server messaging
- Message queue for async tasks

---

## Development Workflow

1. **Local Setup**
   - Docker Compose for PostgreSQL + Redis
   - Environment variables (.env)
   - Seed data for testing

2. **Testing**
   - Unit tests (Jest)
   - Integration tests (Supertest)
   - E2E tests (Playwright)
   - Load testing (k6)

3. **Code Quality**
   - ESLint + Prettier
   - Pre-commit hooks
   - Code coverage targets (80%+)

4. **Documentation**
   - API docs (Swagger/OpenAPI)
   - Architecture diagrams
   - Runbooks for ops

---

## MVP Timeline (8-12 weeks)

**Week 1-2:** Database + API scaffolding
**Week 3-4:** Auth + User management
**Week 5-6:** SOS alert system
**Week 7-8:** Real-time location + Safe Walk
**Week 9-10:** Avatar generation + integration
**Week 11-12:** Testing, optimization, deployment

---

## Cost Estimates (Monthly, 1,000 active users)

| Service | Estimate |
|---------|----------|
| RDS (db.t3.micro) | $50 |
| Lambda (1M requests) | $20 |
| API Gateway | $35 |
| S3 (avatars) | $5 |
| Cognito (free tier) | $0 |
| SNS (1M messages) | $50 |
| CloudFront | $20 |
| DALL-E (1k avatars) | $60 |
| **Total** | **~$240** |

---

## Next Steps

1. Set up AWS account + CDK project
2. Design database schema (finalize)
3. Build Docker local dev environment
4. Start with auth service
5. Build SOS alert core logic
6. Add real-time location tracking
7. Integrate avatar generation
8. Frontend integration begins

