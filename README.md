# 🎤 CogniSpeech - AI-Powered Speech Analysis Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ed.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Advanced AI-powered platform for comprehensive vocal biomarker analysis and linguistic pattern recognition from audio recordings.**

## 🌟 Overview

**CogniSpeech** is a cutting-edge platform that combines advanced AI models with sophisticated audio processing to analyze speech patterns, extract vocal biomarkers, and provide deep insights into cognitive and emotional states. The system processes audio recordings through multiple AI models to deliver comprehensive linguistic and vocal analysis.

### 🎯 Key Features

- **🧠 Multi-Model AI Analysis**: 5+ AI models for comprehensive speech processing
- **🎤 20+ Vocal Biomarkers**: Pitch, jitter, shimmer, HNR, MFCC, spectral analysis
- **💬 Advanced Linguistic Processing**: Sentiment analysis, emotion detection, dialogue act classification
- **📊 Real-time Dashboard**: Interactive visualizations and insights
- **🐳 Docker Ready**: Full containerization support
- **🔌 RESTful API**: Comprehensive backend API with FastAPI
- **📱 Modern Frontend**: React + TypeScript with responsive design
- **📈 Trend Analysis**: Historical data tracking and insights

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Models     │
│   (React/TS)    │◄──►│   (FastAPI)     │◄──►│   (Whisper,     │
│                 │    │                 │    │    RoBERTa,     │
│   Dashboard     │    │   Audio Proc.   │    │    BART, etc.)   │
│   Analytics     │    │   Database      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Docker Desktop** (optional but recommended)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cognispeech.git
cd cognispeech
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start the backend server
python main.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd Second_Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Docker Deployment (Recommended)

```bash
# From project root
docker-compose up -d
```

This will start both backend and frontend services automatically.

## 📁 Project Structure

```
cognispeech/
├── 🐍 Backend/                    # Python FastAPI Backend
│   ├── app/                       # Main application code
│   │   ├── api/                   # REST API endpoints
│   │   ├── services/              # AI analysis services
│   │   ├── models/                # Database models
│   │   └── schemas/               # Data validation schemas
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Test suite
│   └── requirements.txt           # Python dependencies
├── ⚛️ Second_Frontend/            # React TypeScript Frontend
│   ├── src/                       # Source code
│   │   ├── components/            # React components
│   │   ├── pages/                 # Application pages
│   │   └── features/              # Feature modules
│   ├── public/                    # Static assets
│   └── package.json               # Node.js dependencies
├── 🐳 docker-compose.yml          # Multi-service deployment
└── 📚 README.md                   # This file
```

## 🔧 Backend Features

### AI-Powered Analysis Services

- **Vocal Analyzer**: Extracts 20+ vocal biomarkers including:
  - Pitch analysis (mean, std, range)
  - Jitter and shimmer measurements
  - Harmonic-to-Noise Ratio (HNR)
  - MFCC coefficients
  - Spectral contrast analysis

- **Linguistic Analyzer**: Processes speech content using:
  - Whisper for speech-to-text
  - RoBERTa for sentiment analysis
  - BART for text summarization
  - Emotion detection models
  - Dialogue act classification

### API Endpoints

```bash
# Health Check
GET /api/v1/analysis/health

# Upload Audio
POST /api/v1/analysis/upload/{user_id}

# Get Analysis Results
GET /api/v1/analysis/results/{analysis_id}

# User Analysis History
GET /api/v1/analysis/user/{user_id}/analyses

# Weekly Summary
GET /api/v1/analysis/user/{user_id}/weekly-summary
```

### Database Schema

- **Users**: User management and identification
- **Audio Recordings**: Audio file metadata and storage
- **Analysis Results**: Comprehensive analysis outcomes

## 🎨 Frontend Features

### Interactive Dashboard

- **Enhanced Analysis Dashboard**: Comprehensive results display
- **Linguistic Visualization**: Emotion breakdown, sentiment analysis
- **Vocal Metrics**: Interactive charts and progress bars
- **Trend Analysis**: Historical data visualization
- **Mobile Responsive**: Works on all device sizes

### Component Architecture

- **Modular Design**: Reusable components and hooks
- **Type Safety**: Full TypeScript integration
- **State Management**: Efficient state handling
- **Error Boundaries**: Graceful error handling

## 🐳 Docker Deployment

### Quick Docker Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Service Deployment

```bash
# Backend only
cd Backend
docker build -t cognispeech-backend .
docker run -p 8000:8000 cognispeech-backend

# Frontend only
cd Second_Frontend
docker build -t cognispeech-frontend .
docker run -p 3000:3000 cognispeech-frontend
```

## 🧪 Testing

### Backend Testing

```bash
cd Backend

# Run startup tests
python test_startup.py

# Run comprehensive tests
python test_functionality.py

# Run with coverage
python -m pytest --cov=app tests/
```

### Frontend Testing

```bash
cd Second_Frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E testing
npm run test:e2e
```

## 📊 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔒 Security Features

- **Input Validation**: Comprehensive data sanitization
- **CORS Configuration**: Proper cross-origin handling
- **File Upload Security**: Type and size validation
- **Error Handling**: Secure error responses

## 🌐 Browser Support

- **Chrome 90+** ✅
- **Firefox 88+** ✅
- **Safari 14+** ✅
- **Edge 90+** ✅

## 🚀 Performance Features

- **Async Processing**: Background task processing
- **Caching**: Intelligent result caching
- **Optimized Models**: Efficient AI model usage
- **Lazy Loading**: Frontend component optimization

## 📈 Monitoring & Health

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/v1/analysis/health

# Docker health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Logs

```bash
# Backend logs
docker logs cognispeech-backend

# Frontend logs
docker logs cognispeech-frontend

# Follow logs in real-time
docker logs -f cognispeech-backend
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in both Backend and Second_Frontend directories:

```env
# Backend/.env
DATABASE_URL=sqlite:///./cognispeech.db
MAX_FILE_SIZE=52428800
WHISPER_MODEL=base.en
SENTIMENT_MODEL=siebert/sentiment-roberta-large-english

# Second_Frontend/.env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=CogniSpeech
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Add tests for new features
- Update documentation as needed
- Follow conventional commit messages

## 📚 Documentation

- **[Backend Documentation](Backend/README.md)** - Comprehensive backend guide
- **[Frontend Documentation](Second_Frontend/README.md)** - Frontend development guide
- **[Docker Guide](Backend/DOCKER_README.md)** - Docker deployment guide
- **[Testing Guide](Backend/TESTING_GUIDE.md)** - Testing and quality assurance

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.11+

# Verify dependencies
pip list | grep fastapi

# Check database
python init_db.py
```

**Frontend build errors**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

**Docker issues**
```bash
# Clean Docker
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Whisper** for speech recognition
- **Hugging Face** for sentiment analysis models
- **FastAPI** for the robust backend framework
- **React** for the modern frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cognispeech/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cognispeech/discussions)
- **Wiki**: [Project Wiki](https://github.com/yourusername/cognispeech/wiki)

## 🌟 Star History

If you find this project helpful, please consider giving it a ⭐️ on GitHub!

---

**Made with ❤️ by the CogniSpeech Team**

*Empowering speech analysis through AI innovation*
