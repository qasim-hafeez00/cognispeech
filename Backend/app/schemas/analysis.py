from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Base schemas
class UserBase(BaseModel):
    external_id: str = Field(..., description="Non-personally identifiable user identifier")

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AudioRecordingBase(BaseModel):
    filename: str
    file_path: str

class AudioRecordingCreate(AudioRecordingBase):
    user_id: int

class AudioRecording(AudioRecordingBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Enhanced Linguistic Analysis Schemas
class SentenceAnalysis(BaseModel):
    """Schema for individual sentence analysis results."""
    text: str = Field(..., description="The sentence text")
    sentiment: str = Field(..., description="Sentiment classification (POSITIVE/NEGATIVE/NEUTRAL)")
    emotion: str = Field(..., description="Detected emotion (joy, sadness, fear, anger, disgust, surprise, neutral)")
    dialogue_act: str = Field(..., description="Dialogue act classification")
    confidence: Optional[float] = Field(None, description="Confidence score for the analysis")

class SentenceAnalysisSummary(BaseModel):
    """Schema for sentence analysis summary and distribution."""
    sentences: List[SentenceAnalysis] = Field(..., description="List of individual sentence analyses")
    count: int = Field(..., description="Total number of sentences analyzed")
    summary: Dict[str, Any] = Field(..., description="Summary statistics and distributions")

class EmotionBreakdown(BaseModel):
    """Schema for emotion frequency breakdown."""
    joy: Optional[int] = Field(0, description="Count of joy emotions")
    sadness: Optional[int] = Field(0, description="Count of sadness emotions")
    fear: Optional[int] = Field(0, description="Count of fear emotions")
    anger: Optional[int] = Field(0, description="Count of anger emotions")
    disgust: Optional[int] = Field(0, description="Count of disgust emotions")
    surprise: Optional[int] = Field(0, description="Count of surprise emotions")
    neutral: Optional[int] = Field(0, description="Count of neutral emotions")

class DialogueActBreakdown(BaseModel):
    """Schema for dialogue act frequency breakdown."""
    statement: Optional[int] = Field(0, description="Count of statements")
    question: Optional[int] = Field(0, description="Count of questions")
    agreement: Optional[int] = Field(0, description="Count of agreements")
    disagreement: Optional[int] = Field(0, description="Count of disagreements")
    request: Optional[int] = Field(0, description="Count of requests")
    other: Optional[int] = Field(0, description="Count of other dialogue acts")

class DetailedLinguisticAnalysis(BaseModel):
    """Schema for the complete multi-layered linguistic analysis."""
    overall_sentiment: str = Field(..., description="Overall sentiment classification")
    overall_sentiment_score: float = Field(..., description="Normalized sentiment score (0-1)")
    emotions_breakdown: EmotionBreakdown = Field(..., description="Emotion frequency breakdown")
    dialogue_acts_breakdown: DialogueActBreakdown = Field(..., description="Dialogue act frequency breakdown")
    sentence_by_sentence_analysis: List[SentenceAnalysis] = Field(..., description="Detailed sentence analysis")
    sentence_analysis: SentenceAnalysisSummary = Field(..., description="Structured sentence analysis summary")
    sentence_count: int = Field(..., description="Total number of sentences analyzed")

# Enriched vocal metrics schema for better UX
class VocalMetric(BaseModel):
    metric_name: str = Field(..., description="Technical name of the metric")
    full_name: str = Field(..., description="Human-readable name")
    value: float = Field(..., description="Numeric value of the metric")
    unit: str = Field(..., description="Unit of measurement")
    description: str = Field(..., description="Clinical significance and explanation")

class VocalAnalysisResult(BaseModel):
    audio_file_path: Optional[str] = Field(None, description="Path to the analyzed audio file")
    duration: Optional[float] = Field(None, description="Duration of the audio in seconds")
    sample_rate: Optional[int] = Field(None, description="Sample rate of the audio")
    metrics: List[VocalMetric] = Field(..., description="List of extracted vocal biomarkers")
    analysis_method: Optional[str] = Field(None, description="Method used for analysis (e.g., librosa_only_reliable)")

# Analysis result schemas
class AnalysisResultBase(BaseModel):
    status: str = Field(..., description="Current status of the analysis")
    
    # Enhanced Linguistic Analysis Results
    transcript_text: Optional[str] = Field(None, description="Transcribed text from audio")
    sentiment_label: Optional[str] = Field(None, description="Legacy sentiment classification")
    sentiment_score: Optional[float] = Field(None, description="Legacy sentiment confidence score")
    summary_text: Optional[str] = Field(None, description="AI-generated summary")
    
    # New Enhanced Linguistic Fields
    overall_sentiment: Optional[str] = Field(None, description="Overall sentiment from multi-layered analysis")
    overall_sentiment_score: Optional[float] = Field(None, description="Normalized sentiment score (0-1)")
    
    # Emotion Analysis
    emotions_breakdown: Optional[Dict[str, Any]] = Field(None, description="JSON object with emotion counts")
    dominant_emotion: Optional[str] = Field(None, description="Most frequently detected emotion")
    emotion_confidence: Optional[float] = Field(None, description="Confidence score for dominant emotion")
    
    # Dialogue Act Analysis
    dialogue_acts_breakdown: Optional[Dict[str, Any]] = Field(None, description="JSON object with dialogue act counts")
    primary_dialogue_act: Optional[str] = Field(None, description="Most frequent dialogue act")
    
    # Sentence-Level Analysis
    sentence_count: Optional[int] = Field(None, description="Total number of sentences analyzed")
    sentence_analysis: Optional[SentenceAnalysisSummary] = Field(None, description="Detailed sentence-by-sentence analysis")
    
    # Core vocal biomarker results
    mean_pitch_hz: Optional[float] = Field(None, description="Average fundamental frequency")
    jitter_percent: Optional[float] = Field(None, description="Frequency perturbation measure")
    shimmer_percent: Optional[float] = Field(None, description="Amplitude perturbation measure")
    
    # Additional vocal biomarkers
    pitch_std_hz: Optional[float] = Field(None, description="Standard deviation of pitch")
    pitch_range_hz: Optional[float] = Field(None, description="Range of pitch variation")
    mean_hnr_db: Optional[float] = Field(None, description="Harmonics-to-noise ratio")
    mfcc_1: Optional[float] = Field(None, description="First MFCC coefficient")
    spectral_contrast: Optional[float] = Field(None, description="Spectral contrast measure")
    zero_crossing_rate: Optional[float] = Field(None, description="Zero crossing rate")

class AnalysisResultCreate(AnalysisResultBase):
    recording_id: int

class AnalysisResultUpdate(BaseModel):
    status: Optional[str] = None
    transcript_text: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    summary_text: Optional[str] = None
    
    # New Enhanced Linguistic Fields
    overall_sentiment: Optional[str] = None
    overall_sentiment_score: Optional[float] = None
    emotions_breakdown: Optional[Dict[str, Any]] = None
    dominant_emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None
    dialogue_acts_breakdown: Optional[Dict[str, Any]] = None
    primary_dialogue_act: Optional[str] = None
    sentence_count: Optional[int] = None
    sentence_analysis: Optional[SentenceAnalysisSummary] = None
    
    # Vocal biomarkers
    mean_pitch_hz: Optional[float] = None
    jitter_percent: Optional[float] = None
    shimmer_percent: Optional[float] = None
    pitch_std_hz: Optional[float] = None
    pitch_range_hz: Optional[float] = None
    mean_hnr_db: Optional[float] = None
    mfcc_1: Optional[float] = None
    spectral_contrast: Optional[float] = None
    zero_crossing_rate: Optional[float] = None

class AnalysisResult(AnalysisResultBase):
    id: int
    recording_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Enhanced Analysis Response Schemas
class EnhancedAnalysisResponse(BaseModel):
    """Enhanced response with detailed linguistic analysis."""
    analysis_id: int = Field(..., description="ID of the analysis")
    status: str = Field(..., description="Current analysis status")
    message: str = Field(..., description="Response message")
    
    # Rich analysis data
    linguistic_analysis: Optional[DetailedLinguisticAnalysis] = Field(None, description="Complete linguistic analysis")
    vocal_analysis: Optional[VocalAnalysisResult] = Field(None, description="Vocal biomarker analysis")
    
    # Legacy compatibility
    basic_sentiment: Optional[str] = Field(None, description="Basic sentiment label")
    basic_score: Optional[float] = Field(None, description="Basic sentiment score")

# API response schemas
class AnalysisResponse(BaseModel):
    message: str = Field(..., description="Response message")
    analysis_id: int = Field(..., description="ID of the created analysis")

class AnalysisStatusResponse(BaseModel):
    analysis_id: int
    status: str
    message: str
    results: Optional[AnalysisResult] = None

# File upload schemas
class FileUploadResponse(BaseModel):
    message: str = Field(..., description="Upload status message")
    analysis_id: int = Field(..., description="ID for tracking the analysis")
    filename: str = Field(..., description="Name of the uploaded file")

# Dashboard and Analytics Schemas
class EmotionTrend(BaseModel):
    """Schema for emotion trends over time."""
    date: datetime = Field(..., description="Date of the recording")
    dominant_emotion: str = Field(..., description="Dominant emotion on that date")
    emotion_distribution: Dict[str, int] = Field(..., description="Full emotion breakdown")
    confidence: float = Field(..., description="Overall confidence in emotion detection")

class DialogueTrend(BaseModel):
    """Schema for dialogue act trends over time."""
    date: datetime = Field(..., description="Date of the recording")
    primary_dialogue_act: str = Field(..., description="Primary dialogue act on that date")
    dialogue_distribution: Dict[str, int] = Field(..., description="Full dialogue act breakdown")

class WeeklySummary(BaseModel):
    """Schema for weekly analysis summary."""
    week_start: datetime = Field(..., description="Start of the week")
    week_end: datetime = Field(..., description="End of the week")
    total_recordings: int = Field(..., description="Total recordings in the week")
    emotional_summary: str = Field(..., description="AI-generated emotional summary")
    communication_summary: str = Field(..., description="AI-generated communication pattern summary")
    clinical_insights: str = Field(..., description="Clinical insights and recommendations")
    trends: Dict[str, Any] = Field(..., description="Trend analysis data") 