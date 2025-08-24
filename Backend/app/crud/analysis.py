from sqlalchemy.orm import Session
from app.models.analysis import User, AudioRecording, AnalysisResult
from app.schemas.analysis import AnalysisResultCreate, AnalysisResultUpdate
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone

# User CRUD operations
def get_user_by_external_id(db: Session, external_id: str) -> Optional[User]:
    """Get user by external ID."""
    return db.query(User).filter(User.external_id == external_id).first()

def create_user(db: Session, external_id: str) -> User:
    """Create a new user."""
    db_user = User(external_id=external_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_or_create_user(db: Session, external_id: str) -> User:
    """Get existing user or create new one."""
    user = get_user_by_external_id(db, external_id)
    if not user:
        user = create_user(db, external_id)
    return user

# Audio Recording CRUD operations
def create_audio_recording(db: Session, user_id: int, filename: str, file_path: str) -> AudioRecording:
    """Create a new audio recording record."""
    db_recording = AudioRecording(
        user_id=user_id,
        filename=filename,
        file_path=file_path
    )
    db.add(db_recording)
    db.commit()
    db.refresh(db_recording)
    return db_recording

def get_audio_recording(db: Session, recording_id: int) -> Optional[AudioRecording]:
    """Get audio recording by ID."""
    return db.query(AudioRecording).filter(AudioRecording.id == recording_id).first()

# Analysis Result CRUD operations
def create_analysis(db: Session, recording_id: int) -> AnalysisResult:
    """Create initial analysis record with PENDING status."""
    db_analysis = AnalysisResult(
        recording_id=recording_id,
        status="PENDING"
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def get_analysis(db: Session, analysis_id: int) -> Optional[AnalysisResult]:
    """Get analysis result by ID."""
    return db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()

def update_analysis(db: Session, analysis_id: int, update_data: dict) -> Optional[AnalysisResult]:
    """Update analysis result with new data, including enhanced linguistic analysis."""
    db_analysis = get_analysis(db, analysis_id)
    if db_analysis:
        # Enhanced field mapping for multi-layered analysis
        field_mapping = {
            # Enhanced Vocal Biomarkers (Praat + Librosa)
            # Core Pitch Metrics
            'mean_pitch_hz': 'mean_pitch_hz',
            'pitch_std_hz': 'pitch_std_hz',
            'intensity_db': 'intensity_db',
            
            # Jitter Metrics (Frequency Perturbation)
            'jitter_local_percent': 'jitter_local_percent',
            'jitter_rap_percent': 'jitter_rap_percent',
            
            # Shimmer Metrics (Amplitude Perturbation)
            'shimmer_local_percent': 'shimmer_local_percent',
            'shimmer_apq11_percent': 'shimmer_apq11_percent',
            
            # Voice Quality Metrics
            'mean_hnr_db': 'mean_hnr_db',
            'mean_f1_hz': 'mean_f1_hz',
            'mean_f2_hz': 'mean_f2_hz',
            
            # Spectral Features (Librosa)
            'mfcc_1_mean': 'mfcc_1_mean',
            'spectral_centroid_mean': 'spectral_centroid_mean',
            'spectral_bandwidth_mean': 'spectral_bandwidth_mean',
            'spectral_contrast_mean': 'spectral_contrast_mean',
            'spectral_flatness_mean': 'spectral_flatness_mean',
            'spectral_rolloff_mean': 'spectral_rolloff_mean',
            'chroma_mean': 'chroma_mean',
            
            # Speech Rate Metrics
            'speech_rate_sps': 'speech_rate_sps',
            'articulation_rate_sps': 'articulation_rate_sps',
            
            # Legacy field mappings for backward compatibility
            'local_jitter_percent': 'jitter_local_percent',
            'rap_jitter_percent': 'jitter_rap_percent',
            'ppq5_jitter_percent': 'jitter_local_percent',
            'local_shimmer_percent': 'shimmer_local_percent',
            'apq11_shimmer_percent': 'shimmer_apq11_percent',
            'pitch_range_hz': 'pitch_range_hz',
            'mfcc_1': 'mfcc_1_mean',
            'spectral_contrast': 'spectral_contrast_mean',
            'spectral_centroid_hz': 'spectral_centroid_mean',
            'spectral_bandwidth_hz': 'spectral_bandwidth_mean',
            'spectral_flatness': 'spectral_flatness_mean',
            'zero_crossing_rate': 'zero_crossing_rate',
            
            # Legacy linguistic analysis (for backward compatibility)
            'transcript_text': 'transcript_text',
            'sentiment_label': 'sentiment_label',
            'sentiment_score': 'sentiment_score',
            'summary_text': 'summary_text',
            
            # Enhanced linguistic analysis fields
            'overall_sentiment': 'overall_sentiment',
            'overall_sentiment_score': 'overall_sentiment_score',
            'emotions_breakdown': 'emotions_breakdown',
            'dominant_emotion': 'dominant_emotion',
            'emotion_confidence': 'emotion_confidence',
            'dialogue_acts_breakdown': 'dialogue_acts_breakdown',
            'primary_dialogue_act': 'primary_dialogue_act',
            'sentence_count': 'sentence_count',
            'sentence_analysis': 'sentence_analysis',
            
            # Support for detailed_analysis structure from linguistic analyzer
            'detailed_analysis': None  # Will be processed separately
        }
        
        # Process detailed_analysis if present (from linguistic analyzer)
        if 'detailed_analysis' in update_data and update_data['detailed_analysis']:
            detailed = update_data['detailed_analysis']
            if isinstance(detailed, dict):
                # Extract and map detailed analysis fields
                if 'overall_sentiment' in detailed:
                    db_analysis.overall_sentiment = detailed['overall_sentiment']
                if 'overall_sentiment_score' in detailed:
                    db_analysis.overall_sentiment_score = detailed['overall_sentiment_score']
                if 'emotions_breakdown' in detailed:
                    db_analysis.emotions_breakdown = detailed['emotions_breakdown']
                if 'dialogue_acts_breakdown' in detailed:
                    db_analysis.dialogue_acts_breakdown = detailed['dialogue_acts_breakdown']
                if 'sentence_by_sentence_analysis' in detailed:
                    db_analysis.sentence_analysis = detailed['sentence_analysis']  # Use the new structured field
                    db_analysis.sentence_count = len(detailed['sentence_by_sentence_analysis'])
                
                # Calculate dominant emotion and confidence
                if 'emotions_breakdown' in detailed and detailed['emotions_breakdown']:
                    emotions = detailed['emotions_breakdown']
                    if isinstance(emotions, dict):
                        dominant_emotion = max(emotions.items(), key=lambda x: x[1]) if emotions else ("neutral", 0)
                        db_analysis.dominant_emotion = dominant_emotion[0]
                        # Calculate confidence as ratio of dominant emotion to total
                        total_emotions = sum(emotions.values())
                        if total_emotions > 0:
                            db_analysis.emotion_confidence = dominant_emotion[1] / total_emotions
                
                # Calculate primary dialogue act
                if 'dialogue_acts_breakdown' in detailed and detailed['dialogue_acts_breakdown']:
                    dialogue_acts = detailed['dialogue_acts_breakdown']
                    if isinstance(dialogue_acts, dict):
                        primary_act = max(dialogue_acts.items(), key=lambda x: x[1]) if dialogue_acts else ("statement", 0)
                        db_analysis.primary_dialogue_act = primary_act[0]
        
        # Update fields with proper mapping
        for key, value in update_data.items():
            if key in field_mapping and field_mapping[key] is not None:
                db_field = field_mapping[key]
                if hasattr(db_analysis, db_field):
                    setattr(db_analysis, db_field, value)
            elif hasattr(db_analysis, key) and key != 'detailed_analysis':
                setattr(db_analysis, key, value)
        
        db_analysis.status = "COMPLETE"
        db.commit()
        db.refresh(db_analysis)
    return db_analysis

def get_user_analyses(db: Session, user_id: int, limit: int = 100) -> List[AnalysisResult]:
    """Get all analyses for a specific user."""
    return db.query(AnalysisResult)\
        .join(AudioRecording)\
        .filter(AudioRecording.user_id == user_id)\
        .order_by(AnalysisResult.created_at.desc())\
        .limit(limit)\
        .all()

def get_recent_analyses(db: Session, user_id: int, days: int = 7) -> List[AnalysisResult]:
    """Get recent analyses for a user within specified days."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    return db.query(AnalysisResult)\
        .join(AudioRecording)\
        .filter(AudioRecording.user_id == user_id)\
        .filter(AnalysisResult.created_at >= cutoff_date)\
        .order_by(AnalysisResult.created_at.desc())\
        .all()

def get_emotion_trends(db: Session, user_id: int, days: int = 30) -> List[Dict[str, Any]]:
    """Get emotion trends over time for a user."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    analyses = db.query(AnalysisResult)\
        .join(AudioRecording)\
        .filter(AudioRecording.user_id == user_id)\
        .filter(AnalysisResult.created_at >= cutoff_date)\
        .filter(AnalysisResult.dominant_emotion.isnot(None))\
        .order_by(AnalysisResult.created_at.asc())\
        .all()
    
    trends = []
    for analysis in analyses:
        if analysis.emotions_breakdown and analysis.dominant_emotion:
            trends.append({
                'date': analysis.created_at,
                'dominant_emotion': analysis.dominant_emotion,
                'emotion_distribution': analysis.emotions_breakdown,
                'confidence': analysis.emotion_confidence or 0.0
            })
    
    return trends

def get_dialogue_trends(db: Session, user_id: int, days: int = 30) -> List[Dict[str, Any]]:
    """Get dialogue act trends over time for a user."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    analyses = db.query(AnalysisResult)\
        .join(AudioRecording)\
        .filter(AudioRecording.user_id == user_id)\
        .filter(AnalysisResult.created_at >= cutoff_date)\
        .filter(AnalysisResult.primary_dialogue_act.isnot(None))\
        .order_by(AnalysisResult.created_at.asc())\
        .all()
    
    trends = []
    for analysis in analyses:
        if analysis.dialogue_acts_breakdown and analysis.primary_dialogue_act:
            trends.append({
                'date': analysis.created_at,
                'primary_dialogue_act': analysis.primary_dialogue_act,
                'dialogue_distribution': analysis.dialogue_acts_breakdown
            })
    
    return trends

def get_analysis_statistics(db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
    """Get comprehensive analysis statistics for a user."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    analyses = db.query(AnalysisResult)\
        .join(AudioRecording)\
        .filter(AudioRecording.user_id == user_id)\
        .filter(AnalysisResult.created_at >= cutoff_date)\
        .all()
    
    if not analyses:
        return {}
    
    # Calculate statistics
    total_recordings = len(analyses)
    completed_analyses = [a for a in analyses if a.status == "COMPLETE"]
    
    # Emotion statistics
    emotion_counts = {}
    dialogue_act_counts = {}
    sentiment_scores = []
    
    for analysis in completed_analyses:
        if analysis.emotions_breakdown:
            for emotion, count in analysis.emotions_breakdown.items():
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + count
        
        if analysis.dialogue_acts_breakdown:
            for act, count in analysis.dialogue_acts_breakdown.items():
                dialogue_act_counts[act] = dialogue_act_counts.get(act, 0) + count
        
        if analysis.overall_sentiment_score is not None:
            sentiment_scores.append(analysis.overall_sentiment_score)
    
    # Calculate averages
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
    
    return {
        'total_recordings': total_recordings,
        'completed_analyses': len(completed_analyses),
        'completion_rate': len(completed_analyses) / total_recordings if total_recordings > 0 else 0.0,
        'emotion_distribution': emotion_counts,
        'dialogue_act_distribution': dialogue_act_counts,
        'average_sentiment_score': avg_sentiment,
        'analysis_period_days': days
    } 