# CogniSpeech Docker Setup

This document explains how to run the CogniSpeech application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### 1. Build and Start All Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (PostgreSQL)

## Development Mode

For development with hot reloading:

```bash
# Use development configuration
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

This will:
- Enable hot reloading for both frontend and backend
- Mount source code as volumes for live updates
- Use development-specific environment variables

## Service Details

### Backend Service
- **Port**: 8000
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Features**: Audio analysis, linguistic processing, ML models

### Frontend Service
- **Port**: 3000
- **Framework**: React + TypeScript + Vite
- **Features**: Modern UI, real-time analysis, responsive design

### Database Service
- **Port**: 5432
- **Type**: PostgreSQL 15
- **Data Persistence**: Docker volumes
- **Initialization**: Automatic schema migration

### Redis Service (Optional)
- **Port**: 6379
- **Purpose**: Caching and session management
- **Data Persistence**: Docker volumes

## Environment Variables

### Backend (.env.docker)
```bash
DATABASE_URL=postgresql://postgres:password@db:5432/cognispeech
DEBUG=true
APP_NAME=CogniSpeech API
APP_VERSION=1.0.0
```

### Frontend (env.docker)
```bash
NODE_ENV=development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=docker
```

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild specific service
docker-compose build backend

# Rebuild all services
docker-compose build --no-cache
```

### Access Container Shell
```bash
# Backend container
docker-compose exec backend bash

# Frontend container
docker-compose exec frontend sh

# Database container
docker-compose exec db psql -U postgres -d cognispeech
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :8000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Permission Denied**
   ```bash
   # On Windows, ensure Docker Desktop has access to your drives
   # On Linux/Mac, use sudo if needed
   sudo docker-compose up --build
   ```

3. **Out of Memory**
   - Increase Docker Desktop memory allocation
   - Close other applications
   - Consider using lighter base images

4. **Database Connection Issues**
   ```bash
   # Check if database is running
   docker-compose ps db
   
   # Restart database service
   docker-compose restart db
   ```

### Performance Optimization

1. **Use .dockerignore files** to reduce build context
2. **Multi-stage builds** for production images
3. **Volume mounts** for development (already configured)
4. **Resource limits** in docker-compose.yml if needed

## Production Deployment

For production deployment:

1. Remove development overrides
2. Set appropriate environment variables
3. Use production Dockerfiles
4. Configure proper logging and monitoring
5. Set up reverse proxy (nginx/traefik)
6. Configure SSL certificates
7. Set up backup strategies for volumes

## File Structure

```
cognispeech/
├── docker-compose.yml              # Main orchestration
├── docker-compose.override.yml     # Development overrides
├── Backend/
│   ├── Dockerfile                  # Backend production image
│   ├── .dockerignore              # Backend build exclusions
│   └── env.docker                 # Backend environment
├── Second_Frontend/
│   ├── Dockerfile                  # Frontend production image
│   ├── Dockerfile.dev             # Frontend development image
│   ├── .dockerignore              # Frontend build exclusions
│   ├── nginx.conf                 # Nginx configuration
│   └── env.docker                 # Frontend environment
└── DOCKER_README.md               # This file
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify Docker Desktop is running
3. Ensure ports are not in use
4. Check system resources (RAM, disk space)
5. Try rebuilding: `docker-compose build --no-cache`

## Contributing

When adding new services or modifying existing ones:

1. Update docker-compose.yml
2. Add appropriate .dockerignore files
3. Update environment configurations
4. Test the setup thoroughly
5. Update this README
