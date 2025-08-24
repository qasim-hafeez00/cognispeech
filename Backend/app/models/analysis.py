from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    """User model representing study participants."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    audio_recordings = relationship("AudioRecording", back_populates="user")

class AudioRecording(Base):
    """Audio recording metadata model."""
    __tablename__ = "audio_recordings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audio_recordings")
    analysis_result = relationship("AnalysisResult", back_populates="recording", uselist=False)

class AnalysisResult(Base):
    """Analysis results model for storing extracted metrics."""
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    recording_id = Column(Integer, ForeignKey("audio_recordings.id"), unique=True, nullable=False)
    status = Column(String(50), index=True, nullable=False, default="PENDING")
    
    # Enhanced Linguistic Analysis Results
    transcript_text = Column(Text, nullable=True)
    sentiment_label = Column(String(50), nullable=True)
    sentiment_score = Column(Float, nullable=True)
    summary_text = Column(Text, nullable=True)
    
    # New Enhanced Linguistic Fields
    overall_sentiment = Column(String(50), nullable=True)
    overall_sentiment_score = Column(Float, nullable=True)
    
    # Emotion Analysis
    emotions_breakdown = Column(JSON, nullable=True)
    dominant_emotion = Column(String(50), nullable=True)
    emotion_confidence = Column(Float, nullable=True)
    
    # Dialogue Act Analysis
    dialogue_acts_breakdown = Column(JSON, nullable=True)
    primary_dialogue_act = Column(String(100), nullable=True)
    
    # Sentence-Level Analysis
    sentence_count = Column(Integer, nullable=True)
    sentence_analysis = Column(JSON, nullable=True)
    
    # Enhanced Vocal Biomarker Results (Praat + Librosa)
    # Core Pitch Metrics
    mean_pitch_hz = Column(Float, nullable=True)
    pitch_std_hz = Column(Float, nullable=True)
    intensity_db = Column(Float, nullable=True)
    
    # Jitter Metrics (Frequency Perturbation)
    jitter_local_percent = Column(Float, nullable=True)
    jitter_rap_percent = Column(Float, nullable=True)
    
    # Shimmer Metrics (Amplitude Perturbation)
    shimmer_local_percent = Column(Float, nullable=True)
    shimmer_apq11_percent = Column(Float, nullable=True)
    
    # Voice Quality Metrics
    mean_hnr_db = Column(Float, nullable=True)
    mean_f1_hz = Column(Float, nullable=True)
    mean_f2_hz = Column(Float, nullable=True)
    
    # Spectral Features (Librosa)
    mfcc_1_mean = Column(Float, nullable=True)
    spectral_centroid_mean = Column(Float, nullable=True)
    spectral_bandwidth_mean = Column(Float, nullable=True)
    spectral_contrast_mean = Column(Float, nullable=True)
    spectral_flatness_mean = Column(Float, nullable=True)
    spectral_rolloff_mean = Column(Float, nullable=True)
    chroma_mean = Column(Float, nullable=True)
    
    # Speech Rate Metrics
    speech_rate_sps = Column(Float, nullable=True)
    articulation_rate_sps = Column(Float, nullable=True)
    
    # Legacy fields for backward compatibility
    jitter_percent = Column(Float, nullable=True)
    shimmer_percent = Column(Float, nullable=True)
    pitch_range_hz = Column(Float, nullable=True)
    mfcc_1 = Column(Float, nullable=True)
    spectral_contrast = Column(Float, nullable=True)
    zero_crossing_rate = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    recording = relationship("AudioRecording", back_populates="analysis_result")

# Create indexes for better query performance
Index("idx_analysis_status", AnalysisResult.status)
Index("idx_user_external_id", User.external_id)
Index("idx_recording_user_id", AudioRecording.user_id)
Index("idx_analysis_sentiment", AnalysisResult.overall_sentiment)
Index("idx_analysis_emotion", AnalysisResult.dominant_emotion)
Index("idx_analysis_dialogue", AnalysisResult.primary_dialogue_act) 