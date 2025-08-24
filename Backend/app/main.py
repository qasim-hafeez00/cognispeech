from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1.endpoints import analysis
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📚 API Documentation available at: /docs")
    print(f"🔍 ReDoc available at: /redoc")
    
    # Create database tables
    try:
        print("🗄️  Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"⚠️  Warning: Database table creation failed: {e}")
        print("🔄 The application will continue, but database operations may fail.")
        logger.warning(f"Database table creation failed: {e}")
    
    yield
    
    # Shutdown
    print(f"🛑 Shutting down {settings.APP_NAME}")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="CogniSpeech Backend API for Vocal Biomarker Analysis and Linguistic Processing",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(
    analysis.router,
    prefix="/api/v1/analysis",
    tags=["Analysis"]
)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to CogniSpeech API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/analysis/health"
    } 