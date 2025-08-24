import os
import tempfile
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from contextlib import contextmanager
from concurrent.futures import ProcessPoolExecutor
import asyncio
from app.crud.analysis import (
    get_or_create_user, create_audio_recording, create_analysis,
    get_analysis, get_user_analyses, get_recent_analyses, update_analysis,
    get_audio_recording, get_emotion_trends, get_dialogue_trends, get_analysis_statistics
)
from app.services.vocal_analyzer import VocalAnalyzer
from app.services.linguistic_analyzer import LinguisticAnalyzer
from app.schemas.analysis import (
    FileUploadResponse, AnalysisStatusResponse, AnalysisResult,
    EmotionTrend, DialogueTrend, WeeklySummary
)
from app.core.config import settings
from datetime import datetime
import sys

logger = logging.getLogger(__name__)
router = APIRouter()

# Create a process pool executor to run the analysis in a separate process
# This is the key to preventing the main server from being blocked
executor = ProcessPoolExecutor(max_workers=2)  # Adjust max_workers based on your CPU cores

# Add shutdown handler
import atexit
atexit.register(lambda: executor.shutdown(wait=True))

def cleanup_executor():
    """Cleanup function for the process pool executor."""
    try:
        logger.info("Shutting down analysis process pool executor...")
        executor.shutdown(wait=True)
        logger.info("Analysis process pool executor shutdown complete")
    except Exception as e:
        logger.error(f"Error during executor shutdown: {e}")

# Register cleanup
atexit.register(cleanup_executor)

def validate_audio_file(file: UploadFile) -> bool:
    """Enhanced audio file validation - more permissive for web recording."""
    try:
        # Check file extension - be more permissive
        allowed_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.webm', '.ogg', '.opus']
        if not file.filename:
            return False
            
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Handle webm files with codec information (e.g., .webm;codecs=opus)
        if ';codecs=' in file.filename:
            base_ext = file.filename.split(';')[0].lower()
            file_ext = os.path.splitext(base_ext)[1]
            logger.info(f"Detected codec info in filename, using base extension: {file_ext}")
        
        if file_ext not in allowed_extensions:
            logger.warning(f"File extension {file_ext} not in allowed list, but proceeding anyway")
            # Don't reject based on extension alone for web recordings
        
        # For web recordings, be more lenient with header validation
        try:
            header = file.file.read(1024)
            file.file.seek(0)  # Reset file pointer
            
            # Basic format detection - but don't fail if we can't detect
            if file_ext == '.wav' and header.startswith(b'RIFF'):
                logger.info("Valid WAV file detected")
            elif file_ext == '.mp3' and (header.startswith(b'\xff\xfb') or header.startswith(b'ID3')):
                logger.info("Valid MP3 file detected")
            elif file_ext == '.m4a' and (header.startswith(b'ftyp') or header.startswith(b'M4A')):
                logger.info("Valid M4A file detected")
            elif file_ext == '.flac' and header.startswith(b'fLaC'):
                logger.info("Valid FLAC file detected")
            elif file_ext == '.webm' and (header.startswith(b'\x1a\x45\xdf\xa3') or header.startswith(b'\x1f\x43\xb8\x67')):
                logger.info("Valid WebM file detected")
                # Additional WebM codec detection
                if b'Opus' in header:
                    logger.info("WebM file contains Opus codec")
                elif b'Vorbis' in header:
                    logger.info("WebM file contains Vorbis codec")
                else:
                    logger.info("WebM file with unknown codec")
            elif file_ext == '.ogg' and header.startswith(b'OggS'):
                logger.info("Valid OGG file detected")
            elif file_ext == '.opus':
                logger.info("OPUS file detected - will be converted during processing")
            else:
                logger.warning(f"Could not detect audio format for {file_ext}, but proceeding anyway")
                
        except Exception as header_error:
            logger.warning(f"Header validation failed: {header_error}, but proceeding anyway")
            
        # If we get here, accept the file
        return True
        
    except Exception as e:
        logger.error(f"File validation error: {e}")
        # Be more permissive - return True unless there's a critical error
        return True

def save_upload_file_tmp(upload_file: UploadFile) -> str:
    """Save uploaded file to temporary location and return path."""
    try:
        # Validate file before saving
        if not validate_audio_file(upload_file):
            raise HTTPException(
                status_code=400,
                detail="Invalid audio file format or corrupted file"
            )
            
        # Create temp file with proper extension
        # Handle filenames with codec information (e.g., .webm;codecs=opus)
        if upload_file.filename and ';codecs=' in upload_file.filename:
            # Extract base extension without codec info
            base_filename = upload_file.filename.split(';')[0]
            suffix = os.path.splitext(base_filename)[1]
            logger.info(f"Processing file with codec info: {upload_file.filename} -> {base_filename}")
            
            # For WebM files, preserve codec information in the filename
            if suffix == '.webm' and 'opus' in upload_file.filename.lower():
                suffix = '.webm'  # Keep as .webm for Opus codec
                logger.info("Preserving WebM format for Opus codec")
        else:
            suffix = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".wav"
        
        # Ensure we have a valid suffix
        if not suffix or suffix not in ['.wav', '.mp3', '.m4a', '.flac', '.webm', '.ogg', '.opus']:
            suffix = ".wav"  # Default to WAV if no valid extension
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            content = upload_file.file.read()
            tmp_file.write(content)
            tmp_file.flush()
            logger.info(f"Saved uploaded file to temporary location: {tmp_file.name} (suffix: {suffix})")
            return tmp_file.name
    except Exception as e:
        logger.error(f"Error saving uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

@contextmanager
def get_db_session():
    """Context manager for database sessions with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def analysis_pipeline(analysis_id: int, file_path: str):
    """
    This is the actual analysis function that will run in a separate process.
    It's essentially your old run_full_analysis function, but renamed.
    """
    with get_db_session() as db:
        try:
            logger.info(f"ANALYSIS PROCESS: Starting analysis for ID: {analysis_id}")
            
            # Update status to PROCESSING
            analysis = get_analysis(db, analysis_id)
            if analysis:
                analysis.status = "PROCESSING"
                db.commit()
                logger.info(f"ANALYSIS PROCESS: Status updated to PROCESSING for ID: {analysis_id}")

            # Initialize services with error handling
            logger.info(f"ANALYSIS PROCESS: Initializing VocalAnalyzer for file: {file_path}")
            vocal_analyzer = VocalAnalyzer(audio_file_path=file_path)
            logger.info(f"ANALYSIS PROCESS: VocalAnalyzer initialized successfully")
            
            logger.info(f"ANALYSIS PROCESS: Initializing LinguisticAnalyzer")
            linguistic_analyzer = LinguisticAnalyzer()  # Models will be lazy-loaded here
            logger.info(f"ANALYSIS PROCESS: LinguisticAnalyzer initialized successfully")

            # Run vocal analysis with error handling
            logger.info(f"ANALYSIS PROCESS: Starting vocal analysis")
            try:
                vocal_results = vocal_analyzer.get_summary_metrics()
                logger.info(f"ANALYSIS PROCESS: Vocal analysis completed with {len(vocal_results)} metrics")
            except Exception as vocal_error:
                logger.error(f"ANALYSIS PROCESS: Vocal analysis failed: {vocal_error}")
                vocal_results = {}
                # Continue with linguistic analysis even if vocal fails
            
            # Run linguistic analysis with error handling
            logger.info(f"ANALYSIS PROCESS: Starting linguistic analysis")
            try:
                linguistic_results = linguistic_analyzer.process_audio_complete(file_path)
                logger.info(f"ANALYSIS PROCESS: Linguistic analysis completed successfully")
            except Exception as linguistic_error:
                logger.error(f"ANALYSIS PROCESS: Linguistic analysis failed: {linguistic_error}")
                linguistic_results = {}
                # Continue with vocal results even if linguistic fails
            
            # Combine results and update database
            logger.info(f"ANALYSIS PROCESS: Combining results and updating database")
            update_data = {**vocal_results, **linguistic_results}
            
            # Ensure we have at least some results before marking as complete
            if not update_data:
                logger.warning(f"ANALYSIS PROCESS: No results generated, marking as failed")
                analysis = get_analysis(db, analysis_id)
                if analysis:
                    analysis.status = "FAILED"
                    db.commit()
                return
            
            # Update analysis with results
            update_analysis(db, analysis_id, update_data)
            logger.info(f"ANALYSIS PROCESS: Analysis completed successfully for ID: {analysis_id}")
            
        except Exception as e:
            logger.error(f"ANALYSIS PROCESS: Critical error in analysis pipeline for ID: {analysis_id}: {e}")
            logger.error(f"ANALYSIS PROCESS: Error details: {str(e)}", exc_info=True)
            
            # Update status to FAILED
            try:
                analysis = get_analysis(db, analysis_id)
                if analysis:
                    analysis.status = "FAILED"
                    db.commit()
                    logger.info(f"ANALYSIS PROCESS: Status updated to FAILED for ID: {analysis_id}")
            except Exception as update_error:
                logger.error(f"ANALYSIS PROCESS: Failed to update status to FAILED: {update_error}")
        finally:
            # Clean up the temporary file
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    logger.info(f"ANALYSIS PROCESS: Temporary file cleaned up: {file_path}")
            except Exception as cleanup_error:
                logger.error(f"ANALYSIS PROCESS: Failed to cleanup temporary file: {cleanup_error}")

async def run_full_analysis(analysis_id: int, file_path: str):
    """
    This new async function is what the background task will call.
    It submits the analysis_pipeline to the process pool.
    """
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            executor, analysis_pipeline, analysis_id, file_path
        )
    except asyncio.CancelledError:
        logger.warning(f"Analysis {analysis_id} was cancelled during shutdown")
        # Try to update status to indicate cancellation
        try:
            with get_db_session() as db:
                analysis = get_analysis(db, analysis_id)
                if analysis and analysis.status == "PROCESSING":
                    analysis.status = "CANCELLED"
                    db.commit()
                    logger.info(f"Analysis {analysis_id} marked as cancelled")
        except Exception as e:
            logger.error(f"Failed to update cancelled analysis {analysis_id}: {e}")
        raise  # Re-raise the cancellation
    except Exception as e:
        logger.error(f"Error in run_full_analysis for analysis {analysis_id}: {e}")
        # Try to update status to failed
        try:
            with get_db_session() as db:
                analysis = get_analysis(db, analysis_id)
                if analysis and analysis.status == "PROCESSING":
                    analysis.status = "FAILED"
                    db.commit()
                    logger.info(f"Analysis {analysis_id} marked as failed due to async error")
        except Exception as update_error:
            logger.error(f"Failed to update failed analysis {analysis_id}: {update_error}")
        raise

@router.post("/upload/{user_id}", response_model=FileUploadResponse)
async def upload_audio_for_analysis(
    user_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """
    Upload audio file for analysis.
    
    This endpoint accepts audio files and initiates background processing
    for vocal biomarker extraction and linguistic analysis.
    """
    try:
        logger.info(f"=== UPLOAD REQUEST RECEIVED ===")
        logger.info(f"User ID: {user_id}")
        logger.info(f"File name: {file.filename}")
        logger.info(f"File type: {file.content_type}")
        logger.info(f"File size: {file.size}")
        logger.info(f"Headers: {dict(file.headers)}")
        
        # Validate file type - be more permissive
        if file.content_type and file.content_type not in settings.ALLOWED_AUDIO_TYPES:
            logger.warning(f"Content type {file.content_type} not in allowed list, but proceeding anyway")
            # Don't reject based on content type alone
        
        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Get or create user
        logger.info(f"Getting or creating user {user_id}")
        user = get_or_create_user(db, user_id)
        logger.info(f"User {user_id} ready, ID: {user.id}")
        
        # Save uploaded file to temporary location
        logger.info("Saving uploaded file to temporary location")
        temp_file_path = save_upload_file_tmp(file)
        logger.info(f"File saved to temporary location: {temp_file_path}")
        
        # Create audio recording record
        logger.info("Creating audio recording record")
        recording = create_audio_recording(
            db=db,
            user_id=user.id,
            filename=file.filename or "unknown",
            file_path=temp_file_path
        )
        logger.info(f"Audio recording record created with ID: {recording.id}")
        
        # Create initial analysis record
        logger.info("Creating initial analysis record")
        analysis = create_analysis(db, recording.id)
        logger.info(f"Analysis record created with ID: {analysis.id}")
        
        # Add background task for analysis
        logger.info("Adding background task for analysis")
        try:
            background_tasks.add_task(run_full_analysis, analysis.id, temp_file_path)
            logger.info(f"Background task added successfully for analysis {analysis.id}")
        except Exception as task_error:
            logger.error(f"Failed to add background task: {task_error}")
            # If we can't add the background task, try to run it directly
            try:
                logger.info("Attempting to run analysis directly due to background task failure")
                await run_full_analysis(analysis.id, temp_file_path)
                logger.info("Direct analysis execution completed")
            except Exception as direct_error:
                logger.error(f"Direct analysis execution also failed: {direct_error}")
                # Mark as failed since we can't process it
                analysis.status = "FAILED"
                db.commit()
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to initiate analysis processing"
                )
        
        logger.info(f"=== ANALYSIS INITIATED SUCCESSFULLY ===")
        logger.info(f"User: {user_id}, Analysis ID: {analysis.id}, Recording ID: {recording.id}")
        
        return FileUploadResponse(
            message="Analysis accepted for processing",
            analysis_id=analysis.id,
            filename=file.filename or "unknown"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== CRITICAL ERROR IN UPLOAD ENDPOINT ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Error details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/results/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_analysis_results(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Get analysis results by ID.
    
    Returns the current status and results of an analysis job.
    """
    try:
        analysis = get_analysis(db, analysis_id)
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Analysis with the specified ID not found"
            )
        
        # Determine message based on status
        if analysis.status == "PENDING":
            message = "Analysis is queued for processing"
        elif analysis.status == "PROCESSING":
            message = "Analysis is currently being processed"
        elif analysis.status == "COMPLETE":
            message = "Analysis completed successfully"
        elif analysis.status == "FAILED":
            message = "Analysis failed during processing"
        elif analysis.status == "CANCELLED":
            message = "Analysis was cancelled (possibly during shutdown)"
        else:
            message = f"Analysis status: {analysis.status}"
        
        return AnalysisStatusResponse(
            analysis_id=analysis_id,
            status=analysis.status,
            message=message,
            results=analysis if analysis.status == "COMPLETE" else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis results: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/retry/{analysis_id}")
async def retry_analysis(
    analysis_id: int,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """
    Retry a failed analysis.
    
    This endpoint allows retrying an analysis that previously failed.
    """
    try:
        logger.info(f"=== RETRY ANALYSIS REQUEST ===")
        logger.info(f"Analysis ID: {analysis_id}")
        
        analysis = get_analysis(db, analysis_id)
        if not analysis:
            logger.error(f"Analysis with ID {analysis_id} not found")
            raise HTTPException(
                status_code=404,
                detail="Analysis with the specified ID not found"
            )
        
        if analysis.status != "FAILED":
            logger.warning(f"Analysis {analysis_id} is not in FAILED status (current: {analysis.status})")
            raise HTTPException(
                status_code=400,
                detail="Only failed analyses can be retried"
            )
        
        # Get the associated audio recording
        recording = get_audio_recording(db, analysis.recording_id)
        if not recording:
            logger.error(f"Associated audio recording not found for analysis {analysis_id}")
            raise HTTPException(
                status_code=404,
                detail="Associated audio recording not found"
            )
        
        # Check if the file still exists
        if not os.path.exists(recording.file_path):
            logger.error(f"Audio file no longer available for retry: {recording.file_path}")
            raise HTTPException(
                status_code=404,
                detail="Audio file no longer available for retry"
            )
        
        # Reset analysis status to PENDING and clear previous results
        logger.info(f"Resetting analysis {analysis_id} status to PENDING")
        analysis.status = "PENDING"
        
        # Clear previous results to avoid confusion
        analysis.transcript_text = None
        analysis.sentiment_label = None
        analysis.sentiment_score = None
        analysis.summary_text = None
        analysis.overall_sentiment = None
        analysis.overall_sentiment_score = None
        analysis.emotions_breakdown = None
        analysis.dominant_emotion = None
        analysis.emotion_confidence = None
        analysis.dialogue_acts_breakdown = None
        analysis.primary_dialogue_act = None
        analysis.sentence_count = None
        analysis.sentence_analysis = None
        
        # Clear vocal biomarker results
        analysis.mean_pitch_hz = None
        analysis.pitch_std_hz = None
        analysis.intensity_db = None
        analysis.jitter_local_percent = None
        analysis.jitter_rap_percent = None
        analysis.shimmer_local_percent = None
        analysis.shimmer_apq11_percent = None
        analysis.mean_hnr_db = None
        analysis.mean_f1_hz = None
        analysis.mean_f2_hz = None
        analysis.mfcc_1_mean = None
        analysis.spectral_centroid_mean = None
        analysis.spectral_bandwidth_mean = None
        analysis.spectral_contrast_mean = None
        analysis.spectral_flatness_mean = None
        analysis.spectral_rolloff_mean = None
        analysis.chroma_mean = None
        analysis.speech_rate_sps = None
        analysis.articulation_rate_sps = None
        
        db.commit()
        logger.info(f"Analysis {analysis_id} reset successfully")
        
        # Add background task for analysis
        logger.info(f"Adding background task for retry analysis {analysis_id}")
        background_tasks.add_task(run_full_analysis, analysis.id, recording.file_path)
        
        logger.info(f"=== ANALYSIS RETRY INITIATED SUCCESSFULLY ===")
        logger.info(f"Analysis ID: {analysis_id}, Status: PENDING")
        
        return {
            "analysis_id": analysis_id,
            "status": "PENDING",
            "message": "Analysis retry initiated successfully",
            "retried_at": analysis.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== CRITICAL ERROR IN RETRY ENDPOINT ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Error details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/user/{user_id}/analyses", response_model=List[AnalysisResult])
async def get_user_analyses_endpoint(
    user_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all analyses for a specific user.
    
    Returns a list of analysis results ordered by creation date.
    """
    try:
        user = get_or_create_user(db, user_id)
        analyses = get_user_analyses(db, user.id, limit=limit)
        return analyses
        
    except Exception as e:
        logger.error(f"Error getting user analyses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/weekly-summary")
async def get_weekly_summary(
    user_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered weekly summary for a user.
    
    Analyzes trends in vocal and linguistic biomarkers over the specified period.
    """
    try:
        user = get_or_create_user(db, user_id)
        recent_analyses = get_recent_analyses(db, user.id, days=days)
        
        if not recent_analyses:
            return {"message": "No analysis data available for the specified period"}
        
        # Generate weekly summary using linguistic analyzer
        linguistic_analyzer = LinguisticAnalyzer()
        weekly_summary = linguistic_analyzer.generate_weekly_summary(recent_analyses)
        
        return {
            "user_id": user_id,
            "period_days": days,
            "analyses_count": len(recent_analyses),
            "weekly_summary": weekly_summary,
            "generated_at": recent_analyses[0].created_at.isoformat() if recent_analyses else None
        }
        
    except Exception as e:
        logger.error(f"Error generating weekly summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/emotion-trends")
async def get_user_emotion_trends(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get emotion trends over time for a user.
    
    Returns detailed emotion analysis trends including dominant emotions
    and confidence scores over the specified period.
    """
    try:
        user = get_or_create_user(db, user_id)
        emotion_trends = get_emotion_trends(db, user.id, days=days)
        
        if not emotion_trends:
            return {
                "user_id": user_id,
                "period_days": days,
                "message": "No emotion data available for the specified period",
                "trends": []
            }
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_data_points": len(emotion_trends),
            "trends": emotion_trends,
            "summary": {
                "most_common_emotion": max(
                    [t['dominant_emotion'] for t in emotion_trends],
                    key=[t['dominant_emotion'] for t in emotion_trends].count
                ) if emotion_trends else None,
                "average_confidence": sum(t['confidence'] for t in emotion_trends) / len(emotion_trends) if emotion_trends else 0.0
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting emotion trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/dialogue-trends")
async def get_user_dialogue_trends(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get dialogue act trends over time for a user.
    
    Returns communication pattern trends including primary dialogue acts
    and distribution over the specified period.
    """
    try:
        user = get_or_create_user(db, user_id)
        dialogue_trends = get_dialogue_trends(db, user.id, days=days)
        
        if not dialogue_trends:
            return {
                "user_id": user_id,
                "period_days": days,
                "message": "No dialogue data available for the specified period",
                "trends": []
            }
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_data_points": len(dialogue_trends),
            "trends": dialogue_trends,
            "summary": {
                "most_common_dialogue_act": max(
                    [t['primary_dialogue_act'] for t in dialogue_trends],
                    key=[t['primary_dialogue_act'] for t in dialogue_trends].count
                ) if dialogue_trends else None,
                "communication_style": "interactive" if any("question" in t['dialogue_distribution'] for t in dialogue_trends) else "declarative"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dialogue trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/statistics")
async def get_user_analysis_statistics(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analysis statistics for a user.
    
    Returns aggregated statistics including emotion distribution,
    dialogue act patterns, and sentiment trends over time.
    """
    try:
        user = get_or_create_user(db, user_id)
        statistics = get_analysis_statistics(db, user.id, days=days)
        
        if not statistics:
            return {
                "user_id": user_id,
                "period_days": days,
                "message": "No analysis data available for the specified period",
                "statistics": {}
            }
        
        return {
            "user_id": user_id,
            "period_days": days,
            "statistics": statistics,
            "insights": {
                "emotional_state": "positive" if statistics.get('average_sentiment_score', 0.5) > 0.6 else "negative" if statistics.get('average_sentiment_score', 0.5) < 0.4 else "neutral",
                "communication_engagement": "high" if statistics.get('completion_rate', 0) > 0.8 else "medium" if statistics.get('completion_rate', 0) > 0.5 else "low",
                "data_quality": "excellent" if statistics.get('total_recordings', 0) > 10 else "good" if statistics.get('total_recordings', 0) > 5 else "limited"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/enhanced-weekly-summary")
async def get_enhanced_weekly_summary(
    user_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Generate enhanced AI-powered weekly summary for a user.
    
    Provides comprehensive analysis including emotional patterns,
    communication style trends, and clinical insights.
    """
    try:
        user = get_or_create_user(db, user_id)
        recent_analyses = get_recent_analyses(db, user.id, days=days)
        
        if not recent_analyses:
            return {
                "user_id": user_id,
                "period_days": days,
                "message": "No analysis data available for the specified period",
                "summary": None
            }
        
        # Get enhanced statistics
        statistics = get_analysis_statistics(db, user.id, days=days)
        emotion_trends = get_emotion_trends(db, user.id, days=days)
        dialogue_trends = get_dialogue_trends(db, user.id, days=days)
        
        # Generate enhanced weekly summary using linguistic analyzer
        linguistic_analyzer = LinguisticAnalyzer()
        weekly_summary = linguistic_analyzer.generate_weekly_summary(recent_analyses)
        
        # Create enhanced response
        enhanced_summary = {
            "period_summary": {
                "start_date": min(a.created_at for a in recent_analyses).isoformat(),
                "end_date": max(a.created_at for a in recent_analyses).isoformat(),
                "total_recordings": len(recent_analyses),
                "completion_rate": statistics.get('completion_rate', 0)
            },
            "emotional_analysis": {
                "overall_mood": statistics.get('average_sentiment_score', 0.5),
                "dominant_emotions": statistics.get('emotion_distribution', {}),
                "emotion_stability": "stable" if len(emotion_trends) > 3 else "variable",
                "trends": emotion_trends
            },
            "communication_analysis": {
                "primary_style": statistics.get('dialogue_act_distribution', {}),
                "engagement_level": "high" if statistics.get('completion_rate', 0) > 0.8 else "medium",
                "patterns": dialogue_trends
            },
            "clinical_insights": {
                "ai_summary": weekly_summary,
                "key_observations": _generate_clinical_observations(statistics, emotion_trends, dialogue_trends),
                "recommendations": _generate_clinical_recommendations(statistics, emotion_trends, dialogue_trends)
            }
        }
        
        return {
            "user_id": user_id,
            "period_days": days,
            "enhanced_summary": enhanced_summary,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating enhanced weekly summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def _generate_clinical_observations(statistics: dict, emotion_trends: list, dialogue_trends: list) -> list:
    """Generate clinical observations based on analysis data."""
    observations = []
    
    # Sentiment observations
    avg_sentiment = statistics.get('average_sentiment_score', 0.5)
    if avg_sentiment > 0.7:
        observations.append("Consistently positive emotional state observed")
    elif avg_sentiment < 0.3:
        observations.append("Persistent negative emotional state detected")
    elif avg_sentiment > 0.4 and avg_sentiment < 0.6:
        observations.append("Stable neutral emotional baseline maintained")
    
    # Emotion stability observations
    if len(emotion_trends) > 5:
        emotion_variety = len(set(t['dominant_emotion'] for t in emotion_trends))
        if emotion_variety > 3:
            observations.append("High emotional variability indicates dynamic emotional state")
        else:
            observations.append("Consistent emotional patterns suggest emotional stability")
    
    # Communication observations
    completion_rate = statistics.get('completion_rate', 0)
    if completion_rate > 0.9:
        observations.append("Excellent engagement with recording protocol")
    elif completion_rate < 0.5:
        observations.append("Low engagement may indicate protocol adherence challenges")
    
    return observations

def _generate_clinical_recommendations(statistics: dict, emotion_trends: list, dialogue_trends: list) -> list:
    """Generate clinical recommendations based on analysis data."""
    recommendations = []
    
    # Sentiment-based recommendations
    avg_sentiment = statistics.get('average_sentiment_score', 0.5)
    if avg_sentiment < 0.3:
        recommendations.append("Consider mood assessment and potential intervention strategies")
    elif avg_sentiment > 0.7:
        recommendations.append("Positive emotional state suggests good mental health baseline")
    
    # Engagement recommendations
    completion_rate = statistics.get('completion_rate', 0)
    if completion_rate < 0.7:
        recommendations.append("Review recording protocol and provide additional support for adherence")
    
    # Data quality recommendations
    total_recordings = statistics.get('total_recordings', 0)
    if total_recordings < 5:
        recommendations.append("Increase recording frequency for better trend analysis")
    elif total_recordings > 20:
        recommendations.append("Sufficient data for comprehensive longitudinal analysis")
    
    return recommendations

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete an analysis by ID.
    
    This endpoint allows users to delete their analysis records.
    """
    try:
        analysis = get_analysis(db, analysis_id)
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Analysis with the specified ID not found"
            )
        
        # Get the associated audio recording to clean up files
        recording = get_audio_recording(db, analysis.recording_id)
        
        # Delete from database
        db.delete(analysis)
        if recording:
            # Clean up audio file if it exists
            try:
                if os.path.exists(recording.file_path):
                    os.unlink(recording.file_path)
                    logger.info(f"Cleaned up audio file: {recording.file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up audio file {recording.file_path}: {cleanup_error}")
            
            # Delete recording record
            db.delete(recording)
        
        db.commit()
        
        logger.info(f"Analysis {analysis_id} deleted successfully")
        
        return {
            "message": "Analysis deleted successfully",
            "analysis_id": analysis_id,
            "deleted_at": analysis.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/export/{analysis_id}")
async def export_analysis(
    analysis_id: int,
    format: str = "json",
    db: Session = Depends(get_db)
):
    """
    Export analysis data in various formats.
    
    Supports JSON, CSV, and PDF export formats.
    """
    try:
        analysis = get_analysis(db, analysis_id)
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Analysis with the specified ID not found"
            )
        
        if analysis.status != "COMPLETE":
            raise HTTPException(
                status_code=400,
                detail="Analysis must be completed before export"
            )
        
        # Prepare export data
        export_data = {
            "analysis_id": analysis.id,
            "status": analysis.status,
            "created_at": analysis.created_at.isoformat(),
            "updated_at": analysis.updated_at.isoformat(),
            "vocal_biomarkers": {
                "mean_pitch_hz": analysis.mean_pitch_hz,
                "jitter_percent": analysis.jitter_percent,
                "shimmer_percent": analysis.shimmer_percent,
                "pitch_std_hz": analysis.pitch_std_hz,
                "pitch_range_hz": analysis.pitch_range_hz,
                "mean_hnr_db": analysis.mean_hnr_db,
                "mfcc_1": analysis.mfcc_1,
                "spectral_contrast": analysis.spectral_contrast,
                "zero_crossing_rate": analysis.zero_crossing_rate,
            },
            "linguistic_analysis": {
                "transcript_text": analysis.transcript_text,
                "sentiment_label": analysis.sentiment_label,
                "sentiment_score": analysis.sentiment_score,
                "summary_text": analysis.summary_text,
            }
        }
        
        if format.lower() == "json":
            return JSONResponse(
                content=export_data,
                headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id}.json"}
            )
        elif format.lower() == "csv":
            # For CSV, we'll flatten the data structure
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow(["metric", "value", "category"])
            
            # Write vocal biomarkers
            for key, value in export_data["vocal_biomarkers"].items():
                if value is not None:
                    writer.writerow([key, value, "vocal_biomarker"])
            
            # Write linguistic analysis
            for key, value in export_data["linguistic_analysis"].items():
                if value is not None:
                    writer.writerow([key, value, "linguistic_analysis"])
            
            # Write metadata
            writer.writerow(["analysis_id", export_data["analysis_id"], "metadata"])
            writer.writerow(["status", export_data["status"], "metadata"])
            writer.writerow(["created_at", export_data["created_at"], "metadata"])
            writer.writerow(["updated_at", export_data["updated_at"], "metadata"])
            
            csv_content = output.getvalue()
            output.close()
            
            return JSONResponse(
                content={"csv_data": csv_content},
                headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id}.csv"}
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported export format. Use 'json' or 'csv'"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/user/{user_id}/filter")
async def filter_user_analyses(
    user_id: str,
    filters: dict,
    db: Session = Depends(get_db)
):
    """
    Filter user analyses based on criteria.
    
    Supports filtering by date range, status, and metric values.
    """
    try:
        user = get_or_create_user(db, user_id)
        
        # Get all analyses for the user using the existing function
        analyses = get_user_analyses(db, user.id, limit=filters.get("limit", 100))
        
        # Apply filters in Python (simpler approach)
        filtered_analyses = analyses
        
        if "status" in filters and filters["status"]:
            filtered_analyses = [a for a in filtered_analyses if a.status == filters["status"]]
        
        if "date_from" in filters and filters["date_from"]:
            from datetime import datetime
            date_from = datetime.fromisoformat(filters["date_from"])
            filtered_analyses = [a for a in filtered_analyses if a.created_at >= date_from]
        
        if "date_to" in filters and filters["date_to"]:
            from datetime import datetime
            date_to = datetime.fromisoformat(filters["date_to"])
            filtered_analyses = [a for a in filtered_analyses if a.created_at <= date_to]
        
        return filtered_analyses
        
    except Exception as e:
        logger.error(f"Error filtering analyses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/debug/{analysis_id}")
async def debug_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to get detailed information about an analysis failure.
    This helps troubleshoot issues without exposing sensitive data.
    """
    try:
        logger.info(f"=== DEBUG ANALYSIS REQUEST ===")
        logger.info(f"Analysis ID: {analysis_id}")
        
        analysis = get_analysis(db, analysis_id)
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Analysis with the specified ID not found"
            )
        
        # Get associated recording info
        recording = get_audio_recording(db, analysis.recording_id) if analysis.recording_id else None
        
        debug_info = {
            "analysis_id": analysis_id,
            "status": analysis.status,
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
            "recording_info": {
                "id": recording.id if recording else None,
                "filename": recording.filename if recording else None,
                "file_path": recording.file_path if recording else None,
                "file_exists": os.path.exists(recording.file_path) if recording and recording.file_path else False,
                "file_size": os.path.getsize(recording.file_path) if recording and recording.file_path and os.path.exists(recording.file_path) else None
            } if recording else None,
            "results_summary": {
                "has_transcript": bool(analysis.transcript_text),
                "has_sentiment": bool(analysis.sentiment_label),
                "has_vocal_metrics": bool(analysis.mean_pitch_hz is not None),
                "has_emotion_data": bool(analysis.emotions_breakdown),
                "has_dialogue_data": bool(analysis.dialogue_acts_breakdown)
            },
            "system_info": {
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "platform": sys.platform,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # Add specific error context if analysis failed
        if analysis.status == "FAILED":
            debug_info["failure_context"] = {
                "likely_cause": "unknown",  # Could be enhanced with more sophisticated error analysis
                "recommendation": "Check system logs and try retry endpoint"
            }
        
        logger.info(f"Debug info generated for analysis {analysis_id}")
        return debug_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating debug info for analysis {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/shutdown")
async def graceful_shutdown():
    """
    Graceful shutdown endpoint to safely stop background analysis tasks.
    """
    try:
        logger.info("=== GRACEFUL SHUTDOWN REQUESTED ===")
        
        # Shutdown the process pool executor gracefully
        try:
            logger.info("Shutting down process pool executor...")
            executor.shutdown(wait=True, timeout=30)  # Wait up to 30 seconds
            logger.info("Process pool executor shutdown complete")
        except Exception as e:
            logger.error(f"Error during executor shutdown: {e}")
        
        # Mark any running analyses as cancelled
        try:
            with get_db_session() as db:
                running_analyses = db.query(AnalysisResult).filter(
                    AnalysisResult.status == "PROCESSING"
                ).all()
                
                for analysis in running_analyses:
                    analysis.status = "CANCELLED"
                    logger.info(f"Marked analysis {analysis.id} as cancelled")
                
                db.commit()
                logger.info(f"Marked {len(running_analyses)} running analyses as cancelled")
        except Exception as e:
            logger.error(f"Error updating analysis statuses: {e}")
        
        logger.info("=== GRACEFUL SHUTDOWN COMPLETED ===")
        return {
            "message": "Graceful shutdown completed",
            "shutdown_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error during graceful shutdown: {e}")
        raise HTTPException(status_code=500, detail=f"Shutdown error: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify system status and model availability.
    """
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {}
        }
        
        # Check VocalAnalyzer dependencies
        try:
            import librosa
            import parselmouth
            health_status["services"]["vocal_analyzer"] = {
                "status": "healthy",
                "librosa_version": librosa.__version__,
                "parselmouth_version": parselmouth.__version__
            }
        except ImportError as e:
            health_status["services"]["vocal_analyzer"] = {
                "status": "unhealthy",
                "error": f"Missing dependency: {str(e)}"
            }
        
        # Check LinguisticAnalyzer dependencies
        try:
            import whisper
            import transformers
            import nltk
            health_status["services"]["linguistic_analyzer"] = {
                "status": "healthy",
                "whisper_available": True,
                "transformers_version": transformers.__version__,
                "nltk_version": nltk.__version__
            }
        except ImportError as e:
            health_status["services"]["linguistic_analyzer"] = {
                "status": "unhealthy",
                "error": f"Missing dependency: {str(e)}"
            }
        
        # Check database connection
        try:
            from app.db.session import SessionLocal
            db = SessionLocal()
            db.execute("SELECT 1")
            db.close()
            health_status["services"]["database"] = {
                "status": "healthy",
                "connection": "successful"
            }
        except Exception as e:
            health_status["services"]["database"] = {
                "status": "unhealthy",
                "error": f"Database connection failed: {str(e)}"
            }
            health_status["status"] = "degraded"
        
        # Check if any critical services are unhealthy
        critical_services = ["vocal_analyzer", "linguistic_analyzer", "database"]
        unhealthy_count = sum(1 for service in critical_services 
                            if health_status["services"].get(service, {}).get("status") == "unhealthy")
        
        if unhealthy_count > 0:
            health_status["status"] = "degraded"
            if unhealthy_count == len(critical_services):
                health_status["status"] = "unhealthy"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": f"Health check failed: {str(e)}"
        } 
        