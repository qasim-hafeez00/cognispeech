from sqlalchemy.orm import declarative_base

# Declarative base for all models
Base = declarative_base()

# Import models here to ensure they are registered with SQLAlchemy
# This is needed to avoid circular import issues
from app.models.analysis import User, AudioRecording, AnalysisResult

__all__ = ["Base", "User", "AudioRecording", "AnalysisResult"] 