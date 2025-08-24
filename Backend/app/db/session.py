from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# Import base to ensure models are registered with SQLAlchemy
from app.db.base import Base

# Use SQLite as primary database
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cognispeech.db")

# Create SQLite engine with optimized settings
engine = create_engine(
    f"sqlite:///{db_path}",
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300
)

print(f"✅ Using SQLite database: {db_path}")

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency function to provide database sessions to API endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 