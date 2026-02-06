# CCTV NVR Monitor - PostgreSQL Migration

This document describes the migration from Supabase to PostgreSQL for the CCTV NVR Monitor application.

## Overview

The application has been migrated from Supabase to a self-hosted PostgreSQL database with the following components:

- **PostgreSQL Database**: Main database with pg_cron extension for scheduled tasks
- **Backend API**: Express.js server for database operations and snapshot management
- **Frontend**: React application (unchanged, but updated to use PostgreSQL)
- **Docker Compose**: Complete containerized setup

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │◄──►│   (Express)     │◄──►│   Database      │
│   Port: 8080    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  pgAdmin        │
                       │  Port: 5050     │
                       └─────────────────┘
```

## Database Schema

### Tables

1. **nvr_stations**: NVR station information
2. **cameras**: Camera configuration linked to NVR stations
3. **nvr_snapshot_history**: Snapshot history (migrated from Supabase)
4. **snapshot_logs**: Detailed snapshot attempt logs

### Cron Jobs

- **fetch-snapshots-every-5min**: Runs every 5 minutes to log snapshot attempts
- **cleanup-old-logs**: Runs daily at 2 AM to clean up logs older than 30 days

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd cctv-nvr-monitor
```

### 2. Environment Configuration

Copy the environment example file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=cctv_nvr
VITE_DB_USER=postgres
VITE_DB_PASSWORD=password
VITE_DB_SSL=false
```

### 3. Docker Deployment

#### Option A: Production Setup (Recommended)

```bash
docker-compose -f docker-compose.production.yml up -d
```

This will start:
- Frontend (http://localhost:8080)
- Backend API (http://localhost:3001)
- PostgreSQL (localhost:5432)
- pgAdmin (http://localhost:5050)

#### Option B: Development Setup

```bash
docker-compose up -d
```

This starts only the frontend and database.

### 4. Install Dependencies and Build

```bash
npm install
npm run build
```

### 5. Start Backend (for development)

```bash
npm run backend:dev
```

## Database Migration

### From Supabase

1. Export data from Supabase tables:
   - `nvr_snapshot_history`
   - Any other custom tables

2. Import data to PostgreSQL:

```sql
-- Example import command
COPY nvr_snapshot_history FROM '/path/to/export.csv' WITH CSV HEADER;
```

### Manual Database Setup

If you need to set up the database manually:

```bash
# Connect to PostgreSQL
docker exec -it cctv-nvr-monitor-db-1 psql -U postgres -d cctv_nvr

# Run initialization scripts
\i /docker-entrypoint-initdb.d/01-create-tables.sql
\i /docker-entrypoint-initdb.d/02-setup-cron.sql
\i /docker-entrypoint-initdb.d/03-sample-data.sql
```

## API Endpoints

### Backend API (Port 3001)

- `GET /health` - Health check
- `GET /api/nvr-stations` - Get all NVR stations
- `GET /api/cameras` - Get all cameras
- `GET /api/snapshots` - Get snapshot history
- `GET /api/snapshot-logs` - Get snapshot logs
- `POST /api/trigger-snapshots` - Manually trigger snapshots
- `POST /api/log-snapshots` - Log snapshots (for cron jobs)

### pgAdmin (Port 5050)

- **Email**: admin@cctv-nvr.com
- **Password**: admin
- **Server**: db
- **Port**: 5432
- **Database**: cctv_nvr
- **Username**: postgres
- **Password**: password

## Configuration

### Database Connection

The application uses the following environment variables:

- `VITE_DB_HOST`: Database host
- `VITE_DB_PORT`: Database port
- `VITE_DB_NAME`: Database name
- `VITE_DB_USER`: Database username
- `VITE_DB_PASSWORD`: Database password
- `VITE_DB_SSL`: SSL connection (true/false)

### Cron Jobs

Cron jobs are configured in PostgreSQL using the pg_cron extension:

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- Unschedule a job
SELECT cron.unschedule('job-name');

-- Schedule a new job
SELECT cron.schedule('job-name', 'schedule', 'SELECT function()');
```

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
npm run backend:dev
```

### Database Development

Connect using pgAdmin or psql:

```bash
psql -h localhost -p 5432 -U postgres -d cctv_nvr
```

## Monitoring

### Health Checks

- Frontend: http://localhost:8080
- Backend: http://localhost:3001/health
- Database: Check backend health endpoint

### Logs

```bash
# View all container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
docker-compose logs -f backend
docker-compose logs -f db
```

## Backup and Restore

### Backup Database

```bash
docker exec cctv-nvr-monitor-db-1 pg_dump -U postgres cctv_nvr > backup.sql
```

### Restore Database

```bash
docker exec -i cctv-nvr-monitor-db-1 psql -U postgres cctv_nvr < backup.sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL container is running
   - Verify environment variables
   - Check network connectivity

2. **Cron Jobs Not Running**
   - Verify pg_cron extension is enabled
   - Check PostgreSQL logs
   - Verify cron job schedule syntax

3. **Frontend Cannot Connect to Backend**
   - Check CORS configuration
   - Verify backend is running
   - Check API endpoint URLs

### Reset Everything

```bash
# Stop all containers
docker-compose -f docker-compose.production.yml down

# Remove volumes (WARNING: This deletes all data)
docker volume rm cctv-nvr-monitor_postgres_data

# Start fresh
docker-compose -f docker-compose.production.yml up -d
```

## Security Considerations

1. **Change Default Passwords**: Update PostgreSQL and pgAdmin passwords
2. **Network Security**: Use Docker networks to isolate services
3. **SSL/TLS**: Enable SSL for database connections in production
4. **Environment Variables**: Use secure secret management in production

## Performance Optimization

1. **Database Indexes**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Configure appropriate pool sizes
3. **Caching**: Consider Redis for frequently accessed data
4. **Monitoring**: Set up monitoring for database performance

## Migration Checklist

- [ ] Environment variables configured
- [ ] Docker containers running
- [ ] Database schema created
- [ ] Sample data loaded
- [ ] Cron jobs scheduled
- [ ] Frontend connects to backend
- [ ] Backend connects to database
- [ ] API endpoints working
- [ ] pgAdmin accessible
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Backup strategy in place
