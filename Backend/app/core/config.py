from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings with validation and type hints."""
    
    # Database configuration - PostgreSQL for Docker, SQLite for local development
    DATABASE_URL: str = "postgresql://postgres:password@db:5432/cognispeech"
    
    # OpenAI API (optional, for future enhancements)
    OPENAI_API_KEY: Optional[str] = None
    
    # Application settings
    DEBUG: bool = False
    APP_NAME: str = "CogniSpeech API"
    APP_VERSION: str = "1.0.0"
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_AUDIO_TYPES: list = [
        "audio/wav", "audio/mp3", "audio/m4a", "audio/flac", 
        "audio/webm", "audio/webm;codecs=opus", "audio/ogg", 
        "audio/mpeg", "audio/x-wav", "audio/x-m4a"
    ]
    
    # AI Model Configuration
    WHISPER_MODEL: str = "base.en"
    SENTIMENT_MODEL: str = "siebert/sentiment-roberta-large-english"
    SUMMARIZATION_MODEL: str = "facebook/bart-large-cnn"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings() 