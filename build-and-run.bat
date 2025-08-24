@echo off
echo 🚀 Building and running CogniSpeech with Docker...

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Remove old images
echo 🧹 Cleaning up old images...
docker system prune -f

REM Build the images
echo 🔨 Building Docker images...
docker-compose build --no-cache

REM Start the services
echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Check service status
echo 📊 Service status:
docker-compose ps

REM Show logs
echo 📋 Recent logs:
docker-compose logs --tail=20

echo.
echo ✅ CogniSpeech is now running!
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo 📋 Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart: docker-compose restart
echo   Status: docker-compose ps
echo.
pause
