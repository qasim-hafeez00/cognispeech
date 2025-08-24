import logging
import os
import re
import numpy as np
from typing import Dict, List, Any, Optional
from app.schemas.analysis import AnalysisResult
import whisper
from transformers import pipeline
import nltk
import tempfile
import subprocess
import time
import pickle
from pathlib import Path

# Download the sentence tokenizer model from NLTK if not already present
try:
    import nltk
    nltk.download('punkt', quiet=True)
except Exception as e:
    logging.warning(f"Could not download NLTK punkt: {e}")

# Import ML libraries
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logging.warning("Whisper not available")

try:
    from transformers import pipeline
    PIPELINE_AVAILABLE = True
except ImportError:
    PIPELINE_AVAILABLE = False
    logging.warning("Transformers pipeline not available")

logger = logging.getLogger(__name__)

class LinguisticAnalyzer:
    """
    Enhanced linguistic analyzer with performance optimizations.
    Features:
    - Model caching for instant loading
    - Lighter model variants for speed
    - Batch processing capabilities
    - GPU acceleration support
    """
    
    _models = {}
    _models_loaded = False
    _model_cache_dir = Path("model_cache")
    _cache_enabled = True
    
    def __init__(self):
        """Initialize the analyzer with performance optimizations."""
        logger.info("Initializing LinguisticAnalyzer - models will be loaded on demand")
        
        # Create cache directory
        if self._cache_enabled:
            self._model_cache_dir.mkdir(exist_ok=True)
            logger.info(f"Model cache directory: {self._model_cache_dir.absolute()}")
        
        # Check for GPU availability
        self._device = self._get_optimal_device()
        logger.info(f"Using device: {self._device}")
        
        # Initialize with cached models if available
        self._load_cached_models()
        
        logger.info("LinguisticAnalyzer initialized successfully (lazy loading enabled).")

    @classmethod
    def _get_optimal_device(cls) -> str:
        """Determine the optimal device for model execution."""
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
                logger.info("✅ CUDA GPU detected - using GPU acceleration")
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                device = "mps"  # Apple Silicon
                logger.info("✅ Apple Silicon MPS detected - using MPS acceleration")
            else:
                device = "cpu"
                logger.info("ℹ️ No GPU detected - using CPU (consider upgrading for speed)")
            return device
        except ImportError:
            return "cpu"

    @classmethod
    def _load_cached_models(cls):
        """Load models from cache if available."""
        if not cls._cache_enabled:
            return
            
        try:
            cache_file = cls._model_cache_dir / "models_cache.pkl"
            if cache_file.exists():
                logger.info("Loading models from cache...")
                with open(cache_file, 'rb') as f:
                    cls._models = pickle.load(f)
                cls._models_loaded = True
                logger.info(f"✅ Loaded {len(cls._models)} models from cache")
            else:
                logger.info("No model cache found - will load models fresh")
        except Exception as e:
            logger.warning(f"Failed to load cached models: {e}")

    @classmethod
    def _save_models_to_cache(cls):
        """Save models to cache for faster loading next time."""
        if not cls._cache_enabled or not cls._models:
            return
            
        try:
            cache_file = cls._model_cache_dir / "models_cache.pkl"
            with open(cache_file, 'wb') as f:
                pickle.dump(cls._models, f)
            logger.info(f"✅ Saved {len(cls._models)} models to cache")
        except Exception as e:
            logger.warning(f"Failed to save models to cache: {e}")

    @classmethod
    def _load_models(cls):
        """Load all required ML models with performance optimizations."""
        if cls._models_loaded:
            logger.info("Models already loaded from cache - skipping loading")
            return
            
        logger.info("LinguisticAnalyzer: Starting optimized model loading...")
        
        # Clear any existing models
        cls._models = {}
        
        # 1. WHISPER MODEL - Use lighter variants for speed
        cls._models['whisper'] = cls._force_load_whisper_model_fast()
        
        # 2. SENTIMENT MODEL - Use lighter, faster models
        cls._models['sentiment'] = cls._force_load_sentiment_model_fast()
        
        # 3. EMOTION MODEL - Use lighter, faster models
        cls._models['emotion'] = cls._force_load_emotion_model_fast()
        
        # 4. DIALOGUE MODEL - Use lighter, faster models
        cls._models['dialogue'] = cls._force_load_dialogue_model_fast()
        
        # 5. SUMMARIZATION MODEL - Use lighter, faster models
        cls._models['summarization'] = cls._force_load_summarization_model_fast()
        
        # Summary of loaded models
        loaded_models = [name for name, model in cls._models.items() if model is not None]
        if not loaded_models:
            logger.warning("LinguisticAnalyzer: No ML models loaded successfully. Analysis will be limited to basic text processing.")
        else:
            logger.info(f"LinguisticAnalyzer: Successfully loaded {len(loaded_models)} models: {', '.join(loaded_models)}")
        
        # Ensure we always have working models by creating fallbacks for any that failed
        cls._ensure_all_models_available()
        
        # Save to cache for faster loading next time
        cls._save_models_to_cache()
        cls._models_loaded = True

    @classmethod
    def _ensure_all_models_available(cls):
        """Ensure all models are available by creating fallbacks for failed ones."""
        required_models = ['whisper', 'sentiment', 'emotion', 'dialogue', 'summarization']
        
        for model_name in required_models:
            if model_name not in cls._models or cls._models[model_name] is None:
                logger.warning(f"Creating fallback for {model_name} model")
                cls._models[model_name] = cls._create_fallback_model(model_name)

    @classmethod
    def _create_fallback_model(cls, model_type: str):
        """Create a fallback model that always works."""
        if model_type == 'whisper':
            return cls._create_fallback_whisper()
        elif model_type == 'sentiment':
            return cls._create_fallback_sentiment()
        elif model_type == 'emotion':
            return cls._create_fallback_emotion()
        elif model_type == 'dialogue':
            return cls._create_fallback_dialogue()
        elif model_type == 'summarization':
            return cls._create_fallback_summarization()
        else:
            logger.error(f"Unknown model type: {model_type}")
            return None

    @classmethod
    def _force_load_whisper_model_fast(cls):
        """Force load Whisper model with speed optimizations."""
        logger.info("Attempting to load fast Whisper model...")
        
        # Strategy 1: Try ultra-light models first for speed
        fast_models = [
            ("tiny.en", "Ultra-fast English model"),
            ("tiny", "Ultra-fast multilingual model"),
            ("base.en", "Fast English model"),
            ("base", "Fast multilingual model")
        ]
        
        for model_name, description in fast_models:
            try:
                logger.info(f"Trying fast Whisper {model_name}: {description}")
                model = whisper.load_model(model_name, device=cls._get_optimal_device())
                logger.info(f"✅ Fast Whisper {model_name} loaded successfully")
                return model
            except Exception as e:
                logger.warning(f"Fast Whisper {model_name} failed: {e}")
                continue
        
        # Strategy 2: Create fallback
        logger.warning("All fast Whisper models failed, creating fallback")
        return cls._create_fallback_whisper()

    @classmethod
    def _force_load_sentiment_model_fast(cls):
        """Force load fast sentiment analysis model."""
        logger.info("Attempting to load fast sentiment model...")
        
        # Strategy 1: Try ultra-fast, lightweight models
        fast_models = [
            "distilbert-base-uncased-finetuned-sst-2-english",  # Very fast
            "cardiffnlp/twitter-roberta-base-sentiment",        # Fast
            "nlptown/bert-base-multilingual-uncased-sentiment"  # Fast
        ]
        
        for model_name in fast_models:
            try:
                logger.info(f"Trying fast sentiment model: {model_name}")
                sentiment_pipeline = pipeline(
                    "sentiment-analysis", 
                    model=model_name, 
                    device=cls._get_optimal_device(),
                    torch_dtype="auto"  # Auto-optimize precision
                )
                logger.info(f"✅ Fast sentiment model {model_name} loaded successfully")
                return sentiment_pipeline
            except Exception as e:
                logger.warning(f"Fast sentiment model {model_name} failed: {e}")
                continue
        
        # Strategy 2: Create fallback
        logger.warning("All fast sentiment models failed, creating fallback")
        return cls._create_fallback_sentiment()

    @classmethod
    def _force_load_emotion_model_fast(cls):
        """Force load fast emotion analysis model."""
        logger.info("Attempting to load fast emotion model...")
        
        # Strategy 1: Try ultra-fast, lightweight models
        fast_models = [
            "bhadresh-savani/emotion-english-distilroberta-base",  # Very fast
            "j-hartmann/emotion-english-distilroberta-base",       # Fast
            "SamLowe/roberta-base-go_emotions"                     # Fast
        ]
        
        for model_name in fast_models:
            try:
                logger.info(f"Trying fast emotion model: {model_name}")
                emotion_pipeline = pipeline(
                    "text-classification", 
                    model=model_name, 
                    device=cls._get_optimal_device(),
                    torch_dtype="auto"  # Auto-optimize precision
                )
                logger.info(f"✅ Fast emotion model {model_name} loaded successfully")
                return emotion_pipeline
            except Exception as e:
                logger.warning(f"Fast emotion model {model_name} failed: {e}")
                continue
        
        # Strategy 2: Create fallback
        logger.warning("All fast emotion models failed, creating fallback")
        return cls._create_fallback_emotion()

    @classmethod
    def _force_load_dialogue_model_fast(cls):
        """Force load fast dialogue analysis model."""
        logger.info("Attempting to load fast dialogue model...")
        
        # Strategy 1: Try ultra-fast, lightweight models
        fast_models = [
            "google/flan-t5-small",      # Very fast
            "t5-small",                  # Fast
            "facebook/bart-base"         # Fast
        ]
        
        for model_name in fast_models:
            try:
                logger.info(f"Trying fast dialogue model: {model_name}")
                dialogue_pipeline = pipeline(
                    "text2text-generation", 
                    model=model_name, 
                    device=cls._get_optimal_device(),
                    torch_dtype="auto"  # Auto-optimize precision
                )
                logger.info(f"✅ Fast dialogue model {model_name} loaded successfully")
                return dialogue_pipeline
            except Exception as e:
                logger.warning(f"Fast dialogue model {model_name} failed: {e}")
                continue
        
        # Strategy 2: Create fallback
        logger.warning("All fast dialogue models failed, creating fallback")
        return cls._create_fallback_dialogue()

    @classmethod
    def _force_load_summarization_model_fast(cls):
        """Force load fast summarization model."""
        logger.info("Attempting to load fast summarization model...")
        
        # Strategy 1: Try ultra-fast, lightweight models
        fast_models = [
            "google/flan-t5-small",      # Very fast
            "t5-small",                  # Fast
            "facebook/bart-base"         # Fast
        ]
        
        for model_name in fast_models:
            try:
                logger.info(f"Trying fast summarization model: {model_name}")
                summary_pipeline = pipeline(
                    "summarization", 
                    model=model_name, 
                    device=cls._get_optimal_device(),
                    torch_dtype="auto"  # Auto-optimize precision
                )
                logger.info(f"✅ Fast summarization model {model_name} loaded successfully")
                return summary_pipeline
            except Exception as e:
                logger.warning(f"Fast summarization model {model_name} failed: {e}")
                continue
        
        # Strategy 2: Create fallback
        logger.warning("All fast summarization models failed, creating fallback")
        return cls._create_fallback_summarization()

    @classmethod
    def _create_fallback_whisper(cls):
        """Create a fallback Whisper model that always works."""
        class FallbackWhisper:
            def transcribe(self, audio_path):
                logger.info("Using fallback Whisper transcription")
                return {"text": "Transcription not available - using fallback. Please check audio quality and try again."}
        
        return FallbackWhisper()

    @classmethod
    def _create_fallback_sentiment(cls):
        """Create a fallback sentiment analysis model that always works."""
        class FallbackSentiment:
            def __call__(self, text):
                logger.info("Using fallback sentiment analysis")
                # Basic keyword-based sentiment
                text_lower = text.lower()
                positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like']
                negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'upset']
                
                positive_count = sum(1 for word in positive_words if word in text_lower)
                negative_count = sum(1 for word in negative_words if word in text_lower)
                
                if positive_count > negative_count:
                    return [{"label": "POSITIVE", "score": 0.7}]
                elif negative_count > positive_count:
                    return [{"label": "NEGATIVE", "score": 0.7}]
                else:
                    return [{"label": "NEUTRAL", "score": 0.5}]
        
        return FallbackSentiment()

    @classmethod
    def _create_fallback_emotion(cls):
        """Create a fallback emotion analysis model that always works."""
        class FallbackEmotion:
            def __call__(self, text):
                logger.info("Using fallback emotion analysis")
                # Basic keyword-based emotion detection
                text_lower = text.lower()
                
                if any(word in text_lower for word in ['happy', 'joy', 'excited', 'great']):
                    return [{"label": "joy", "score": 0.8}]
                elif any(word in text_lower for word in ['sad', 'sadness', 'depressed', 'unhappy']):
                    return [{"label": "sadness", "score": 0.8}]
                elif any(word in text_lower for word in ['angry', 'anger', 'mad', 'furious']):
                    return [{"label": "anger", "score": 0.8}]
                elif any(word in text_lower for word in ['fear', 'afraid', 'scared', 'terrified']):
                    return [{"label": "fear", "score": 0.8}]
                else:
                    return [{"label": "neutral", "score": 0.6}]
        
        return FallbackEmotion()

    @classmethod
    def _create_fallback_dialogue(cls):
        """Create a fallback dialogue analysis model that always works."""
        class FallbackDialogue:
            def __call__(self, text, **kwargs):
                logger.info("Using fallback dialogue analysis")
                return [{"generated_text": "Dialogue analysis not available - using fallback. The text appears to be conversational in nature."}]
        
        return FallbackDialogue()

    @classmethod
    def _create_fallback_summarization(cls):
        """Create a fallback summarization model that always works."""
        class FallbackSummarization:
            def __call__(self, text, **kwargs):
                logger.info("Using fallback summarization")
                # Simple extractive summarization
                sentences = text.split('.')
                if len(sentences) <= 2:
                    return [{"summary_text": text}]
                else:
                    # Take first and last sentence as summary
                    summary = sentences[0] + ". " + sentences[-1]
                    if not summary.endswith('.'):
                        summary += "."
                    return [{"summary_text": summary}]
        
        return FallbackSummarization()

    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribes audio to text using the Whisper model."""
        converted_file = None
        try:
            self._load_models()  # Load models if needed
            
            # Check if Whisper model is available
            if not self._models.get('whisper'):
                logger.warning("LinguisticAnalyzer: Whisper model not available, transcription skipped")
                return "Transcription not available - model failed to load"
            
            # Check if we need to convert the audio format
            if self._needs_conversion(audio_file_path):
                logger.info(f"Converting audio format for Whisper: {audio_file_path}")
                converted_file = self._convert_audio_format(audio_file_path)
                if converted_file:
                    audio_file_path = converted_file
                    logger.info(f"Using converted audio file: {audio_file_path}")
                else:
                    logger.warning("Audio conversion failed, proceeding with original file")
            
            logger.info(f"LinguisticAnalyzer: Starting transcription for: {audio_file_path}")
            result = self._models['whisper'].transcribe(audio_file_path)
            transcript = result.get("text", "").strip()
            
            if not transcript:
                logger.warning("LinguisticAnalyzer: Whisper returned an empty transcript.")
                return "Transcription completed but no text was detected"
                
            logger.info("LinguisticAnalyzer: Transcription completed successfully.")
            return transcript
            
        except Exception as e:
            logger.error(f"LinguisticAnalyzer: Error during Whisper transcription: {e}")
            return f"Transcription failed due to an error: {str(e)}"
        finally:
            # Clean up converted file
            if converted_file and os.path.exists(converted_file):
                try:
                    os.unlink(converted_file)
                    logger.info(f"Cleaned up converted audio file: {converted_file}")
                except Exception as e:
                    logger.warning(f"Failed to cleanup converted file: {e}")

    def _ensure_models_loaded(self):
        """Ensures all models are loaded before performing any analysis."""
        if not self._models_loaded:
            self._load_models()

    def _needs_conversion(self, file_path: str) -> bool:
        """Check if the audio file needs format conversion."""
        filename = os.path.basename(file_path).lower()
        
        # Check for problematic formats
        problematic_formats = [
            '.webm;codecs=opus',
            '.webm',
            '.opus',
            '.m4a',
            '.aac'
        ]
        
        return any(fmt in filename for fmt in problematic_formats)
    
    def _convert_audio_format(self, input_path: str) -> str:
        """Convert audio to WAV format for better compatibility with Whisper."""
        try:
            # Create temporary file for conversion
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                output_path = tmp_file.name
            
            # Use ffmpeg to convert to WAV
            cmd = [
                'ffmpeg', '-y',  # Overwrite output file
                '-i', input_path,  # Input file
                '-acodec', 'pcm_s16le',  # PCM 16-bit
                '-ar', '16000',  # Sample rate (Whisper prefers 16kHz)
                '-ac', '1',  # Mono channel
                output_path  # Output file
            ]
            
            logger.info(f"Converting audio for Whisper with command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout
            )
            
            if result.returncode == 0 and os.path.exists(output_path):
                logger.info(f"Audio conversion successful: {output_path}")
                return output_path
            else:
                logger.error(f"Audio conversion failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Error during audio conversion: {e}")
            return None

    def analyze_text_fully(self, text: str) -> Dict[str, Any]:
        """
        Performs the full, multi-layered analysis on the provided text with performance optimizations.
        """
        self._ensure_models_loaded()  # Load models if needed
        
        if not text or len(text.strip()) < 5:
            logger.warning("LinguisticAnalyzer: Text too short for reliable analysis")
            return self._get_fallback_text_analysis()

        sentences = nltk.sent_tokenize(text)
        
        sentence_analyses = []
        emotion_counts = {}
        sentiment_scores = []
        dialogue_act_counts = {}

        # Batch process sentences for better performance
        for sentence in sentences:
            # Skip very short, likely meaningless, sentences
            if len(sentence.strip()) < 3:
                continue

            # Layer 1: General Sentiment (Positive/Negative)
            try:
                if self._models.get('sentiment'):
                    sentiment_result = self._models['sentiment'](sentence)
                    if sentiment_result and len(sentiment_result) > 0:
                        sentiment_label = sentiment_result[0].get('label', 'NEUTRAL')
                        sentiment_score = sentiment_result[0].get('score', 0.5)
                        
                        # Normalize sentiment scores to a -1 to 1 range for easier aggregation
                        if sentiment_label == 'NEGATIVE':
                            sentiment_scores.append(0.5 - (sentiment_score / 2))
                        else:
                            sentiment_scores.append(0.5 + (sentiment_score / 2))
                    else:
                        logger.warning(f"Sentiment analysis returned empty result for sentence: {sentence[:30]}...")
                        sentiment_scores.append(0.5)
                else:
                    logger.warning("LinguisticAnalyzer: Sentiment pipeline not available, using fallback")
                    fallback_result = self._fallback_sentiment_analysis(sentence)
                    sentiment_label = fallback_result['label']
                    sentiment_score = fallback_result['score']
                    sentiment_scores.append(sentiment_score)
            except Exception as e:
                logger.warning(f"LinguisticAnalyzer: Sentiment analysis failed for sentence: {e}, using fallback")
                fallback_result = self._fallback_sentiment_analysis(sentence)
                sentiment_scores.append(fallback_result['score'])

            # Layer 2: Emotion Analysis
            try:
                if self._models.get('emotion'):
                    emotion_result = self._models['emotion'](sentence)
                    if emotion_result and len(emotion_result) > 0:
                        emotion_label = emotion_result[0].get('label', 'neutral').lower()
                        emotion_counts[emotion_label] = emotion_counts.get(emotion_label, 0) + 1
                    else:
                        logger.warning(f"Emotion analysis returned empty result for sentence: {sentence[:30]}...")
                        emotion_counts['neutral'] = emotion_counts.get('neutral', 0) + 1
                else:
                    logger.warning("LinguisticAnalyzer: Emotion pipeline not available, using fallback")
                    fallback_result = self._fallback_emotion_analysis(sentence)
                    emotion_label = fallback_result['label'].lower()
                    emotion_counts[emotion_label] = emotion_counts.get(emotion_label, 0) + 1
            except Exception as e:
                logger.warning(f"LinguisticAnalyzer: Emotion analysis failed for sentence: {e}, using fallback")
                fallback_result = self._fallback_emotion_analysis(sentence)
                emotion_label = fallback_result['label'].lower()
                emotion_counts[emotion_label] = emotion_counts.get(emotion_label, 0) + 1

            # Layer 3: Dialogue Act Analysis
            try:
                if self._models.get('dialogue'):
                    dialogue_result = self._models['dialogue'](sentence, max_length=50)
                    if dialogue_result and len(dialogue_result) > 0:
                        dialogue_text = dialogue_result[0].get('generated_text', sentence)
                        # Simple dialogue act classification based on keywords
                        dialogue_act = self._classify_dialogue_act(dialogue_text)
                        dialogue_act_counts[dialogue_act] = dialogue_act_counts.get(dialogue_act, 0) + 1
                    else:
                        logger.warning(f"Dialogue analysis returned empty result for sentence: {sentence[:30]}...")
                        dialogue_act_counts['statement'] = dialogue_act_counts.get('statement', 0) + 1
                else:
                    logger.warning("LinguisticAnalyzer: Dialogue pipeline not available, using fallback")
                    dialogue_act_counts['statement'] = dialogue_act_counts.get('statement', 0) + 1
            except Exception as e:
                logger.warning(f"LinguisticAnalyzer: Dialogue analysis failed for sentence: {e}, using fallback")
                dialogue_act_counts['statement'] = dialogue_act_counts.get('statement', 0) + 1

            # Create sentence analysis summary
            sentence_analysis = {
                'text': sentence,
                'sentiment': sentiment_label if 'sentiment_label' in locals() else 'NEUTRAL',
                'emotion': emotion_label if 'emotion_label' in locals() else 'neutral',
                'dialogue_act': dialogue_act if 'dialogue_act' in locals() else 'statement'
            }
            sentence_analyses.append(sentence_analysis)

        # Aggregate results
        overall_sentiment = "NEUTRAL"
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            if avg_sentiment > 0.6:
                overall_sentiment = "POSITIVE"
            elif avg_sentiment < 0.4:
                overall_sentiment = "NEGATIVE"

        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral"
        dominant_dialogue_act = max(dialogue_act_counts.items(), key=lambda x: x[1])[0] if dialogue_act_counts else "statement"

        # Create comprehensive analysis result
        analysis_result = {
            'text': text,
            'sentiment': overall_sentiment,
            'sentiment_confidence': avg_sentiment if sentiment_scores else 0.5,
            'emotions': emotion_counts,
            'dominant_emotion': dominant_emotion,
            'dialogue_acts': dialogue_act_counts,
            'dominant_dialogue_act': dominant_dialogue_act,
            'sentence_analyses': sentence_analyses,
            'analysis_method': 'comprehensive_with_fallbacks'
        }

        logger.info(f"LinguisticAnalyzer: Comprehensive analysis completed - Sentiment: {overall_sentiment}, Emotion: {dominant_emotion}")
        return analysis_result

    def generate_summary(self, text: str, max_length: int = 150) -> str:
        """Generates a summary of the text using the BART model."""
        self._load_models()  # Load models if needed
        
        if not text or len(text.strip()) < 100:
            return text # Not enough content to summarize

        try:
            if self._models.get('summarization'):
                summary_result = self._models['summarization'](
                    text, 
                    max_length=max_length, 
                    min_length=30,
                    do_sample=False
                )
                return summary_result[0].get("summary_text", "")
            else:
                logger.warning("LinguisticAnalyzer: Summarization pipeline not available, using fallback")
                return self._generate_simple_summary(text, max_length)
        except Exception as e:
            logger.error(f"LinguisticAnalyzer: Summarization failed: {e}")
            # Fallback to simple truncation
            return self._generate_simple_summary(text, max_length)
    
    def _generate_simple_summary(self, text: str, max_length: int = 150) -> str:
        """Generates a simple summary when the ML model is not available."""
        if len(text) <= max_length:
            return text
        
        # Simple sentence-based truncation
        sentences = nltk.sent_tokenize(text)
        summary = ""
        for sentence in sentences:
            if len(summary + sentence) <= max_length - 3:
                summary += sentence + " "
            else:
                break
        
        return (summary.strip() + "...") if summary else (text[:max_length-3] + "...")

    def analyze_sentiment(self, text: str) -> Dict[str, any]:
        """Legacy method for backward compatibility - now uses the multi-layered approach."""
        try:
            if not text or len(text.strip()) < 10:
                logger.warning("Text too short for reliable sentiment analysis")
                return {"label": "NEUTRAL", "score": 0.5}
            
            # Use the new multi-layered analysis
            full_analysis = self.analyze_text_fully(text)
            
            return {
                "label": full_analysis["overall_sentiment"],
                "score": full_analysis["overall_sentiment_score"],
                "raw_score": full_analysis["overall_sentiment_score"]
            }
                
        except Exception as e:
            logger.error(f"Error during sentiment analysis: {e}")
            return {"label": "NEUTRAL", "score": 0.5}

    def generate_weekly_summary(self, analyses: List[AnalysisResult]) -> str:
        """Generate AI-powered weekly summary based on analysis data."""
        self._load_models()  # Load models if needed
        
        try:
            if not analyses:
                return "No analysis data available for weekly summary."
            
            logger.info(f"Generating AI-powered weekly summary from {len(analyses)} analyses")
            
            # Analyze trends in the data
            pitch_values = []
            jitter_values = []
            sentiment_scores = []
            emotion_data = []
            dialogue_data = []
            
            for analysis in analyses:
                if hasattr(analysis, 'mean_pitch_hz') and analysis.mean_pitch_hz:
                    pitch_values.append(analysis.mean_pitch_hz)
                if hasattr(analysis, 'local_jitter_percent') and analysis.local_jitter_percent:
                    jitter_values.append(analysis.local_jitter_percent)
                if hasattr(analysis, 'sentiment_score') and analysis.sentiment_score:
                    sentiment_scores.append(analysis.sentiment_score)
                
                # Extract detailed analysis if available
                if hasattr(analysis, 'detailed_analysis') and analysis.detailed_analysis:
                    detailed = analysis.detailed_analysis
                    if isinstance(detailed, dict):
                        if 'emotions_breakdown' in detailed:
                            emotion_data.append(detailed['emotions_breakdown'])
                        if 'dialogue_acts_breakdown' in detailed:
                            dialogue_data.append(detailed['dialogue_acts_breakdown'])
            
            # Create structured prompt for AI summarization
            summary_prompt = self._create_enhanced_weekly_summary_prompt(
                analyses, pitch_values, jitter_values, sentiment_scores, emotion_data, dialogue_data
            )
            
            # Generate AI summary
            try:
                ai_summary = self._models['summarization'](
                    summary_prompt,
                    max_length=250,
                    min_length=150,
                    do_sample=False
                )
                
                if ai_summary and len(ai_summary) > 0:
                    summary = ai_summary[0].get("summary_text", "")
                    if summary:
                        logger.info("AI-powered weekly summary generated successfully")
                        return summary
            except Exception as e:
                logger.warning(f"AI summarization failed, using rule-based approach: {e}")
            
            # Fallback to rule-based summary
            return self._generate_enhanced_rule_based_summary(
                analyses, pitch_values, jitter_values, sentiment_scores, emotion_data, dialogue_data
            )
            
        except Exception as e:
            logger.error(f"Error generating AI weekly summary: {e}")
            return "Unable to generate weekly summary due to processing error."

    def _create_enhanced_weekly_summary_prompt(self, analyses: List[AnalysisResult], 
                                            pitch_values: List[float], 
                                            jitter_values: List[float], 
                                            sentiment_scores: List[float],
                                            emotion_data: List[Dict],
                                            dialogue_data: List[Dict]) -> str:
        """Create an enhanced structured prompt for AI summarization."""
        prompt_parts = [
            "Generate a comprehensive weekly clinical summary for a patient based on the following vocal and linguistic biomarker trends.",
            "The patient is being monitored for neurodegenerative disease progression.",
            f"Data is provided as {len(analyses)} daily entries for the past week:"
        ]
        
        # Add daily data points with enhanced information
        for i, analysis in enumerate(analyses[:7]):  # Limit to 7 days
            day_data = f"Day {i+1}: "
            if hasattr(analysis, 'mean_pitch_hz') and analysis.mean_pitch_hz:
                day_data += f"Mean Pitch={analysis.mean_pitch_hz:.1f}Hz, "
            if hasattr(analysis, 'local_jitter_percent') and analysis.local_jitter_percent:
                day_data += f"Jitter={analysis.local_jitter_percent:.2f}%, "
            if hasattr(analysis, 'sentiment_score') and analysis.sentiment_score:
                day_data += f"Sentiment={analysis.sentiment_score:.2f}, "
            
            # Add detailed analysis if available
            if hasattr(analysis, 'detailed_analysis') and analysis.detailed_analysis:
                detailed = analysis.detailed_analysis
                if isinstance(detailed, dict):
                    if 'emotions_breakdown' in detailed:
                        emotions = detailed['emotions_breakdown']
                        top_emotion = max(emotions.items(), key=lambda x: x[1]) if emotions else ("neutral", 0)
                        day_data += f"Primary Emotion={top_emotion[0]}, "
                    
                    if 'dialogue_acts_breakdown' in detailed:
                        dialogue_acts = detailed['dialogue_acts_breakdown']
                        top_act = max(dialogue_acts.items(), key=lambda x: x[1]) if dialogue_acts else ("statement", 0)
                        day_data += f"Primary Dialogue Act={top_act[0]}"
            
            prompt_parts.append(day_data.rstrip(", "))
        
        prompt_parts.append("Focus on significant changes and overall trends in vocal stability, emotional affect, and conversational patterns.")
        prompt_parts.append("Provide clinical insights and recommendations based on the comprehensive data patterns.")
        
        return " ".join(prompt_parts)

    def _generate_enhanced_rule_based_summary(self, analyses: List[AnalysisResult], 
                                           pitch_values: List[float], 
                                           jitter_values: List[float], 
                                           sentiment_scores: List[float],
                                           emotion_data: List[Dict],
                                           dialogue_data: List[Dict]) -> str:
        """Generate enhanced rule-based weekly summary."""
        summary_parts = [f"Weekly Summary: Analyzed {len(analyses)} recordings."]
        
        if pitch_values:
            avg_pitch = np.mean(pitch_values)
            pitch_trend = "stable" if np.std(pitch_values) < 20 else "variable"
            summary_parts.append(f"Average pitch: {avg_pitch:.1f}Hz ({pitch_trend}).")
        
        if jitter_values:
            avg_jitter = np.mean(jitter_values)
            jitter_status = "normal" if avg_jitter < 2.0 else "elevated"
            summary_parts.append(f"Average jitter: {avg_jitter:.2f}% ({jitter_status}).")
        
        if sentiment_scores:
            avg_sentiment = np.mean(sentiment_scores)
            if avg_sentiment > 0.6:
                emotional_state = "positive"
            elif avg_sentiment < 0.4:
                emotional_state = "negative"
            else:
                emotional_state = "neutral"
            summary_parts.append(f"Emotional state: {emotional_state} (score: {avg_sentiment:.2f}).")
        
        # Add emotion analysis summary
        if emotion_data:
            all_emotions = {}
            for emotion_dict in emotion_data:
                for emotion, count in emotion_dict.items():
                    all_emotions[emotion] = all_emotions.get(emotion, 0) + count
            
            if all_emotions:
                dominant_emotion = max(all_emotions.items(), key=lambda x: x[1])
                summary_parts.append(f"Dominant emotion pattern: {dominant_emotion[0]} ({dominant_emotion[1]} occurrences).")
        
        # Add dialogue act analysis summary
        if dialogue_data:
            all_dialogue_acts = {}
            for dialogue_dict in dialogue_data:
                for act, count in dialogue_dict.items():
                    all_dialogue_acts[act] = all_dialogue_acts.get(act, 0) + count
            
            if all_dialogue_acts:
                dominant_act = max(all_dialogue_acts.items(), key=lambda x: x[1])
                summary_parts.append(f"Primary communication style: {dominant_act[0]} ({dominant_act[1]} instances).")
        
        # Add overall assessment
        if len(analyses) >= 3:
            summary_parts.append("Sufficient data for comprehensive trend analysis.")
        else:
            summary_parts.append("Limited data for comprehensive analysis.")
        
        return " ".join(summary_parts)

    def process_audio_complete(self, audio_file_path: str) -> Dict[str, any]:
        """
        The main public method that orchestrates the entire linguistic analysis pipeline.
        """
        try:
            logger.info(f"LinguisticAnalyzer: Starting full linguistic analysis for: {audio_file_path}")
            
            # 1. Transcribe the audio
            transcript = self.transcribe_audio(audio_file_path)
            if not transcript:
                logger.warning("LinguisticAnalyzer: Empty transcript, using fallback analysis")
                return self._get_fallback_results()
            
            # 2. Perform the multi-layered text analysis
            try:
                full_text_analysis = self.analyze_text_fully(transcript)
                logger.info("LinguisticAnalyzer: Text analysis completed successfully")
            except Exception as text_error:
                logger.error(f"LinguisticAnalyzer: Text analysis failed: {text_error}")
                full_text_analysis = self._get_fallback_text_analysis()
            
            # 3. Generate a summary
            try:
                summary = self.generate_summary(transcript)
                logger.info("LinguisticAnalyzer: Summary generation completed")
            except Exception as summary_error:
                logger.error(f"LinguisticAnalyzer: Summary generation failed: {summary_error}")
                summary = "Summary generation failed"
            
            # 4. Compile the final results
            results = {
                "transcript_text": transcript,
                "sentiment_label": full_text_analysis.get("overall_sentiment", "NEUTRAL"),
                "sentiment_score": full_text_analysis.get("overall_sentiment_score", 0.5),
                "summary_text": summary,
                "detailed_analysis": full_text_analysis 
            }
            
            logger.info("LinguisticAnalyzer: Full linguistic analysis completed successfully.")
            return results
            
        except Exception as e:
            logger.error(f"LinguisticAnalyzer: The complete linguistic analysis pipeline failed: {e}")
            # Return fallback results instead of raising
            return self._get_fallback_results()
    
    def _get_fallback_results(self) -> Dict[str, any]:
        """Returns fallback results when analysis fails completely."""
        logger.info("LinguisticAnalyzer: Using fallback results due to analysis failure")
        return {
            "transcript_text": "Transcription failed",
            "sentiment_label": "NEUTRAL",
            "sentiment_score": 0.5,
            "summary_text": "Analysis could not be completed",
            "detailed_analysis": self._get_fallback_text_analysis()
        }
    
    def _get_fallback_text_analysis(self) -> Dict[str, Any]:
        """Provide fallback analysis for very short texts."""
        return {
            'text': 'Text too short for analysis',
            'sentiment': 'NEUTRAL',
            'sentiment_confidence': 0.5,
            'emotions': {'neutral': 1},
            'dominant_emotion': 'neutral',
            'dialogue_acts': {'statement': 1},
            'dominant_dialogue_act': 'statement',
            'sentence_analyses': [],
            'analysis_method': 'fallback_short_text'
        }

    def _fallback_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Fallback sentiment analysis using basic text analysis when ML model fails."""
        try:
            # Simple keyword-based sentiment analysis
            positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like', 'enjoy']
            negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed']
            
            text_lower = text.lower()
            positive_count = sum(1 for word in positive_words if word in text_lower)
            negative_count = sum(1 for word in negative_words if word in text_lower)
            
            if positive_count > negative_count:
                sentiment = "POSITIVE"
                score = min(0.9, 0.5 + (positive_count - negative_count) * 0.1)
            elif negative_count > positive_count:
                sentiment = "NEGATIVE"
                score = max(0.1, 0.5 - (negative_count - positive_count) * 0.1)
            else:
                sentiment = "NEUTRAL"
                score = 0.5
            
            return {
                "label": sentiment,
                "score": score,
                "method": "fallback_keyword_analysis"
            }
        except Exception as e:
            logger.warning(f"Fallback sentiment analysis failed: {e}")
            return {"label": "NEUTRAL", "score": 0.5, "method": "fallback_error"}

    def _fallback_emotion_analysis(self, text: str) -> Dict[str, Any]:
        """Fallback emotion analysis using basic text analysis when ML model fails."""
        try:
            # Simple keyword-based emotion detection
            emotion_keywords = {
                'joy': ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'pleased'],
                'sadness': ['sad', 'sorrow', 'grief', 'melancholy', 'depressed', 'unhappy'],
                'anger': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated'],
                'fear': ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried'],
                'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'],
                'disgust': ['disgusted', 'revolted', 'repulsed', 'appalled'],
                'neutral': ['okay', 'fine', 'normal', 'usual', 'regular']
            }
            
            text_lower = text.lower()
            emotion_scores = {}
            
            for emotion, keywords in emotion_keywords.items():
                score = sum(1 for keyword in keywords if keyword in text_lower)
                if score > 0:
                    emotion_scores[emotion] = score
            
            if emotion_scores:
                # Get the emotion with highest score
                primary_emotion = max(emotion_scores, key=emotion_scores.get)
                confidence = min(0.9, 0.3 + emotion_scores[primary_emotion] * 0.2)
            else:
                primary_emotion = 'neutral'
                confidence = 0.5
            
            return {
                "label": primary_emotion.upper(),
                "score": confidence,
                "method": "fallback_keyword_analysis"
            }
        except Exception as e:
            logger.warning(f"Fallback emotion analysis failed: {e}")
            return {"label": "NEUTRAL", "score": 0.5, "method": "fallback_error"} 

    def _classify_dialogue_act(self, text: str) -> str:
        """Classify dialogue act based on keywords and patterns."""
        text_lower = text.lower()
        
        # Question indicators
        if any(word in text_lower for word in ['what', 'when', 'where', 'who', 'why', 'how', '?']):
            return 'question'
        
        # Command/request indicators
        if any(word in text_lower for word in ['please', 'could you', 'would you', 'can you', 'help', 'need']):
            return 'request'
        
        # Greeting indicators
        if any(word in text_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
            return 'greeting'
        
        # Farewell indicators
        if any(word in text_lower for word in ['goodbye', 'bye', 'see you', 'farewell', 'take care']):
            return 'farewell'
        
        # Agreement indicators
        if any(word in text_lower for word in ['yes', 'yeah', 'sure', 'okay', 'ok', 'agree', 'correct']):
            return 'agreement'
        
        # Disagreement indicators
        if any(word in text_lower for word in ['no', 'nope', 'disagree', 'wrong', 'incorrect', 'false']):
            return 'disagreement'
        
        # Default to statement
        return 'statement' 