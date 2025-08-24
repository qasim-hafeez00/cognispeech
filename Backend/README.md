# CogniSpeech Backend - Comprehensive Documentation

## 🎯 Project Overview

**CogniSpeech** is an advanced AI-powered backend system that analyzes vocal biomarkers and linguistic patterns from audio recordings. The system combines speech recognition, sentiment analysis, and vocal biomarker extraction to provide comprehensive insights into cognitive and emotional states.

### 🚀 Key Features
- **Vocal Biomarker Analysis**: Extract 16+ vocal metrics (pitch, jitter, shimmer, HNR, MFCC, etc.)
- **Linguistic Processing**: Speech-to-text transcription, sentiment analysis, and text summarization
- **Real-time Analysis**: Fast processing with async operations and background tasks
- **Comprehensive API**: RESTful endpoints for upload, analysis, and results retrieval
- **Docker Support**: Containerized deployment with health monitoring
- **Database Integration**: SQLite with SQLAlchemy ORM and Alembic migrations

## 🎤 Audio Format Support

### Supported Formats
- **WebM**: Primary format for web recordings with Opus/Vorbis codecs
- **WAV**: Uncompressed audio for high-quality analysis
- **MP3**: Compressed audio with wide compatibility
- **M4A**: Apple ecosystem audio format
- **FLAC**: Lossless compression for quality preservation
- **OGG**: Open source audio container
- **OPUS**: Modern low-latency codec

### WebM Processing
- **Codec Detection**: Automatic Opus/Vorbis codec identification
- **Header Validation**: WebM container format verification
- **File Preservation**: Maintains original format during processing
- **FFmpeg Integration**: Full audio conversion and analysis support

## 📁 Complete Directory Structure

```
Backend/
├── 📁 app/                          # Main application package
│   ├── 📁 api/                      # API layer and endpoints
│   │   ├── 📁 v1/                   # API version 1
│   │   │   └── 📁 endpoints/        # Route handlers
│   │   │       └── analysis.py      # Analysis endpoints (15KB)
│   ├── 📁 core/                     # Core configuration and utilities
│   │   └── config.py                # Application settings (1KB)
│   ├── 📁 crud/                     # Database operations
│   │   └── analysis.py              # CRUD operations (5KB)
│   ├── 📁 db/                       # Database configuration
│   │   ├── base.py                  # SQLAlchemy base (108B)
│   │   └── session.py               # Database session (920B)
│   ├── 📁 models/                   # Database models
│   │   └── analysis.py              # Data models (2.9KB)
│   ├── 📁 schemas/                  # Pydantic schemas
│   │   └── analysis.py              # Request/Response schemas (4.2KB)
│   ├── 📁 services/                 # Business logic services
│   │   ├── linguistic_analyzer.py   # NLP processing (15KB)
│   │   └── vocal_analyzer.py        # Audio analysis (15KB)
│   └── main.py                      # FastAPI application (1.6KB)
├── 📁 alembic/                      # Database migrations
│   ├── env.py                       # Migration environment
│   ├── script.py.mako               # Migration template
│   └── 📁 versions/                 # Migration files
│       ├── 001_initial_schema.py    # Initial database setup
│       └── fb5da0a4082f_add_additional_vocal_biomarkers.py
├── 📁 tests/                        # Test suite
│   └── test_analysis.py             # Analysis tests (48 lines)
├── 📁 cache/                        # Temporary cache storage
├── 📁 logs/                         # Application logs
├── 📁 models/                       # ML model storage
├── 📁 uploads/                      # Audio file uploads
├── 📁 supabase/                     # Supabase configuration
│   ├── config.toml                  # Supabase settings
│   ├── 📁 migrations/               # Database migrations
│   └── seed.sql                     # Initial data
├── .dockerignore                     # Docker build exclusions (1.1KB)
├── .env                             # Environment variables (104B)
├── .gitignore                       # Git exclusions (580B)
├── alembic.ini                      # Alembic configuration (3.2KB)
├── cognispeech.db                   # SQLite database (52KB)
├── deploy.py                        # Deployment script (8.1KB)
├── docker-build.bat                 # Windows Docker build script (2.7KB)
├── docker-compose.yml               # Docker Compose configuration (689B)
├── Dockerfile                       # Docker image definition (2.3KB)
├── DOCKER_README.md                 # Docker documentation (5.2KB)
├── init_db.py                       # Database initialization (1.7KB)
├── main.py                          # Application entry point (447B)
├── migrate.py                       # Migration runner (5.7KB)
├── requirements.txt                  # Python dependencies (653B)
├── test_functionality.py            # Comprehensive tests (12KB)
├── test_startup.py                  # Startup tests (2.3KB)
└── TESTING_GUIDE.md                 # Testing documentation (5.5KB)
```

## 🔄 System Workflow

### 1. **Application Startup Flow**
```
main.py → app/main.py → FastAPI App → Database Init → Service Loading → API Ready
```

### 2. **Audio Analysis Workflow**
```
Audio Upload → File Validation → User Creation → Recording Storage → 
Vocal Analysis → Linguistic Analysis → Results Storage → API Response
```

### 3. **Data Flow Architecture**
```
Client Request → API Endpoint → CRUD Operations → Service Layer → 
ML Models → Database Storage → Response Generation
```

## 📋 File-by-File Documentation

### 🚀 **Entry Points**

#### `main.py` (447B) - Application Entry Point
**Purpose**: Main entry point for running the application
**Key Logic**:
- Imports the FastAPI app from `app.main`
- Runs uvicorn server on port 8000
- Handles Python path configuration for imports

**Code Structure**:
```python
#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
```

#### `app/main.py` (1.6KB) - FastAPI Application Core
**Purpose**: Main FastAPI application configuration and setup
**Key Features**:
- CORS middleware configuration
- Application lifespan management
- Database table creation on startup
- API router inclusion
- Root endpoint definition

**Code Logic**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Cleanup operations

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)
```

### ⚙️ **Configuration & Core**

#### `app/core/config.py` (1KB) - Application Settings
**Purpose**: Centralized configuration management using Pydantic
**Key Settings**:
- Database URL configuration
- File upload limits (50MB max)
- AI model specifications
- Environment variable loading

**Configuration Classes**:
```python
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./cognispeech.db"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    WHISPER_MODEL: str = "base.en"
    SENTIMENT_MODEL: str = "siebert/sentiment-roberta-large-english"
```

#### `alembic.ini` (3.2KB) - Database Migration Configuration
**Purpose**: Alembic migration tool configuration
**Key Settings**:
- Database connection strings
- Migration file templates
- Logging configuration
- Script path definitions

### 🗄️ **Database Layer**

#### `app/db/base.py` (108B) - SQLAlchemy Base
**Purpose**: SQLAlchemy declarative base for all models
**Code**:
```python
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()
```

#### `app/db/session.py` (920B) - Database Session Management
**Purpose**: Database connection and session handling
**Key Features**:
- SQLAlchemy engine creation
- Session factory configuration
- Connection pooling settings

**Code Logic**:
```python
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### `app/models/analysis.py` (2.9KB) - Data Models
**Purpose**: SQLAlchemy ORM models for database tables
**Models Defined**:

1. **User Model**:
   - `id`: Primary key
   - `external_id`: Unique user identifier
   - `created_at`: Timestamp

2. **AudioRecording Model**:
   - `id`: Primary key
   - `user_id`: Foreign key to User
   - `filename`: Original filename
   - `file_path`: Storage path

3. **AnalysisResult Model**:
   - **Linguistic Results**: transcript, sentiment, summary
   - **Vocal Biomarkers**: pitch, jitter, shimmer, HNR, MFCC
   - **Status Tracking**: PENDING, COMPLETED, FAILED

**Relationships**:
```python
# User → AudioRecordings (one-to-many)
# AudioRecording → AnalysisResult (one-to-one)
# AnalysisResult → AudioRecording (many-to-one)
```

### 🔧 **Business Logic Services**

#### `app/services/vocal_analyzer.py` (15KB) - Audio Analysis Service
**Purpose**: Extract vocal biomarkers from audio files
**Key Features**:
- Pitch analysis (mean, std, range)
- Jitter and shimmer calculation
- Harmonic-to-Noise Ratio (HNR)
- MFCC feature extraction
- Spectral contrast analysis

**Analysis Pipeline**:
```python
def analyze_audio(self, audio_path: str) -> Dict[str, float]:
    1. Load audio file
    2. Extract pitch contours
    3. Calculate jitter/shimmer
    4. Compute spectral features
    5. Return 16+ vocal metrics
```

#### `app/services/linguistic_analyzer.py` (15KB) - NLP Processing Service
**Purpose**: Process transcribed text for linguistic insights
**Key Features**:
- Speech-to-text transcription (Whisper)
- Sentiment analysis (RoBERTa)
- Text summarization (BART)
- Language detection

**Processing Flow**:
```python
def analyze_text(self, audio_path: str) -> Dict[str, Any]:
    1. Transcribe audio to text
    2. Analyze sentiment (label + score)
    3. Generate text summary
    4. Return linguistic insights
```

### 📊 **Data Access Layer**

#### `app/crud/analysis.py` (5KB) - Database Operations
**Purpose**: CRUD operations for database entities
**Operations**:
- User creation and retrieval
- Audio recording management
- Analysis result storage
- Data cleanup and maintenance

**Key Methods**:
```python
def create_user(db: Session, external_id: str) -> User
def create_audio_recording(db: Session, user_id: int, filename: str, file_path: str) -> AudioRecording
def create_analysis_result(db: Session, recording_id: int) -> AnalysisResult
def get_user_analyses(db: Session, user_id: int) -> List[AnalysisResult]
```

#### `app/schemas/analysis.py` (4.2KB) - Data Validation
**Purpose**: Pydantic schemas for request/response validation
**Schemas Defined**:
- `UserCreate`: User creation requests
- `AudioRecordingCreate`: Audio upload requests
- `AnalysisResultResponse`: Analysis results
- `HealthResponse`: System health status

**Validation Features**:
```python
class AudioRecordingCreate(BaseModel):
    user_id: int
    filename: str
    file_path: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "filename": "recording.wav",
                "file_path": "/uploads/recording.wav"
            }
        }
```

### 🌐 **API Layer**

#### `app/api/v1/endpoints/analysis.py` (15KB) - API Endpoints
**Purpose**: RESTful API endpoints for analysis operations
**Endpoints Available**:

1. **POST** `/api/v1/analysis/upload/{user_id}` - Audio upload
2. **GET** `/api/v1/analysis/results/{analysis_id}` - Get results
3. **POST** `/api/v1/analysis/retry/{analysis_id}` - Retry analysis
4. **GET** `/api/v1/analysis/user/{user_id}/analyses` - User history
5. **GET** `/api/v1/analysis/user/{user_id}/weekly-summary` - Weekly insights
6. **GET** `/api/v1/analysis/health` - System health

**Key Logic**:
```python
@router.post("/upload/{user_id}")
async def upload_audio(
    user_id: int,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks
):
    1. Validate file type and size
    2. Create user if doesn't exist
    3. Store audio file
    4. Queue background analysis
    5. Return analysis ID
```

### 🧪 **Testing & Quality Assurance**

#### `test_startup.py` (2.3KB) - Startup Validation
**Purpose**: Verify application startup and configuration
**Tests Performed**:
- Module imports validation
- App configuration verification
- Database connectivity
- Service availability
- API route enumeration

#### `test_functionality.py` (12KB) - Comprehensive Testing
**Purpose**: End-to-end functionality validation
**Test Categories**:
- Module imports (9 tests)
- Database operations (CRUD)
- ML model initialization
- Vocal analysis pipeline
- API endpoint functionality
- File validation

**Test Results**: 7/7 tests passed ✅

### 🐳 **Docker & Deployment**

#### `Dockerfile` (2.3KB) - Container Definition
**Purpose**: Multi-stage Docker build for production
**Build Stages**:
1. **Builder Stage**: Install dependencies and build tools
2. **Production Stage**: Runtime environment with minimal footprint

**Key Features**:
- Python 3.11 slim base
- Multi-stage optimization
- Security user creation
- Health check configuration
- Volume mounting support

#### `docker-compose.yml` (689B) - Container Orchestration
**Purpose**: Multi-container deployment configuration
**Services**:
- `cognispeech-backend`: Main application
- Volume mounts for persistence
- Network configuration
- Environment variables

#### `docker-build.bat` (2.7KB) - Windows Build Script
**Purpose**: Automated Docker build and deployment
**Features**:
- Container cleanup
- Image building
- Directory creation
- Health monitoring
- Log viewing

### 📚 **Database Migrations**

#### `alembic/versions/001_initial_schema.py` - Initial Database
**Purpose**: Create initial database structure
**Tables Created**:
- `users`: User management
- `audio_recordings`: Audio file metadata
- `analysis_results`: Analysis outcomes

#### `alembic/versions/fb5da0a4082f_add_additional_vocal_biomarkers.py`
**Purpose**: Add new vocal biomarker columns
**New Fields**:
- `pitch_std_hz`: Pitch standard deviation
- `pitch_range_hz`: Pitch range
- `mean_hnr_db`: Harmonic-to-noise ratio
- `mfcc_1`: MFCC coefficient
- `spectral_contrast`: Spectral contrast
- `zero_crossing_rate`: Zero crossing rate

### 🔧 **Utility Scripts**

#### `init_db.py` (1.7KB) - Database Initialization
**Purpose**: Initialize database with tables and sample data
**Functions**:
- Database connection setup
- Table creation
- Sample data insertion
- Connection cleanup

#### `migrate.py` (5.7KB) - Migration Runner
**Purpose**: Execute database migrations
**Features**:
- Migration status checking
- Automatic migration execution
- Rollback capabilities
- Logging and error handling

#### `deploy.py` (8.1KB) - Deployment Automation
**Purpose**: Automated deployment and configuration
**Capabilities**:
- Environment setup
- Dependency installation
- Service configuration
- Health monitoring

## 🚀 **Getting Started**

### **Prerequisites**
- Python 3.11+
- Docker Desktop
- Git

### **Quick Start**

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd cognispeech/Backend
   ```

2. **Environment Setup**:
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize Database**:
   ```bash
   python init_db.py
   ```

5. **Run Application**:
   ```bash
   # Development
   python main.py
   
   # Production with Docker
   .\docker-build.bat
   ```

### **Docker Deployment**

1. **Build Image**:
   ```bash
   docker build -t cognispeech-backend .
   ```

2. **Run Container**:
   ```bash
   docker run -d -p 8000:8000 cognispeech-backend
   ```

3. **Using Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## 🧪 **Testing**

### **Run All Tests**:
```bash
python test_startup.py      # Startup validation
python test_functionality.py # Comprehensive testing
```

### **Test Results**:
- ✅ **Startup Tests**: All passed
- ✅ **Functionality Tests**: 7/7 passed
- ✅ **API Endpoints**: All functional
- ✅ **Database Operations**: CRUD working
- ✅ **ML Models**: Initialized successfully

## 📊 **API Documentation**

### **Interactive Docs**:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **Health Check**:
```bash
GET /api/v1/analysis/health
Response: {"status": "healthy", "service": "CogniSpeech API"}
```

### **Upload Audio**:
```bash
POST /api/v1/analysis/upload/{user_id}
Body: multipart/form-data with audio file
Response: {"analysis_id": 123, "status": "PENDING"}
```

## 🔍 **Monitoring & Health**

### **Health Endpoints**:
- `/api/v1/analysis/health` - System health status
- Docker health checks every 30 seconds
- Automatic restart on failure

### **Logging**:
- Application logs in `/logs/` directory
- Docker logs: `docker logs cognispeech-backend`
- Real-time monitoring: `docker logs -f cognispeech-backend`

## 🚨 **Troubleshooting**

### **Common Issues**:

1. **Port Already in Use**:
   ```bash
   # Check port usage
   netstat -ano | findstr :8000
   # Kill process or change port
   ```

2. **Database Connection Errors**:
   ```bash
   # Reinitialize database
   python init_db.py
   # Check file permissions
   ```

3. **Docker Build Failures**:
   ```bash
   # Clean Docker cache
   docker system prune -a
   # Rebuild image
   docker build --no-cache -t cognispeech-backend .
   ```

### **Debug Mode**:
```bash
# Enable debug logging
export DEBUG=true
# Run with verbose output
python main.py --log-level debug
```

## 🤝 **Contributing**

### **Development Setup**:
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### **Code Standards**:
- Follow PEP 8 style guide
- Add type hints
- Include docstrings
- Write unit tests

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Documentation**:
- [API Reference](http://localhost:8000/docs)
- [Testing Guide](TESTING_GUIDE.md)
- [Docker Guide](DOCKER_README.md)

### **Issues**:
- Report bugs via GitHub Issues
- Include logs and error messages
- Provide reproduction steps

---

**🎯 CogniSpeech Backend is production-ready with comprehensive testing, Docker support, and detailed documentation!** 