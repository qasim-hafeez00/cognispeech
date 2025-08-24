// Comprehensive types matching the CogniSpeech backend API structure

export interface User {
  id: string | number;
  external_id: string;
  created_at: string;
}

export interface AudioRecording {
  id: number;
  user_id: number;
  filename: string;
  file_path: string;
  created_at: string;
}

export interface VocalMetric {
  metric_name: string;
  full_name: string;
  value: number;
  unit: string;
  description: string;
}

export interface VocalAnalysisResult {
  metrics: VocalMetric[];
}

// Enhanced Linguistic Analysis Types
export interface SentenceAnalysis {
  text: string;
  sentiment: string;
  emotion: string;
  dialogue_act: string;
  confidence?: number;
}

export interface EmotionBreakdown {
  joy?: number;
  sadness?: number;
  fear?: number;
  anger?: number;
  disgust?: number;
  surprise?: number;
  neutral?: number;
}

export interface DialogueActBreakdown {
  statement?: number;
  question?: number;
  agreement?: number;
  disagreement?: number;
  request?: number;
  other?: number;
}

export interface DetailedLinguisticAnalysis {
  overall_sentiment: string;
  overall_sentiment_score: number;
  emotions_breakdown: EmotionBreakdown;
  dialogue_acts_breakdown: DialogueActBreakdown;
  sentence_by_sentence_analysis: SentenceAnalysis[];
  sentence_count: number;
}

// Backend-aligned status types
export type BackendAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

// Frontend status types for enhanced UX
export type FrontendAnalysisStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AnalysisResult {
  id: number;
  recording_id: number;
  status: BackendAnalysisStatus;
  
  // Enhanced Linguistic Analysis Results
  transcript_text?: string;
  sentiment_label?: string; // Legacy field for backward compatibility
  sentiment_score?: number; // Legacy field for backward compatibility
  summary_text?: string;
  
  // New Enhanced Linguistic Fields
  overall_sentiment?: string;
  overall_sentiment_score?: number;
  emotions_breakdown?: EmotionBreakdown;
  dominant_emotion?: string;
  emotion_confidence?: number;
  dialogue_acts_breakdown?: DialogueActBreakdown;
  primary_dialogue_act?: string;
  sentence_count?: number;
  sentence_analysis?: SentenceAnalysis[];
  
  // Enhanced Vocal Biomarker Results (Praat + Librosa)
  // Core Pitch Metrics
  mean_pitch_hz?: number;
  pitch_std_hz?: number;
  intensity_db?: number;
  
  // Jitter Metrics (Frequency Perturbation)
  jitter_local_percent?: number;
  jitter_rap_percent?: number;
  
  // Shimmer Metrics (Amplitude Perturbation)
  shimmer_local_percent?: number;
  shimmer_apq11_percent?: number;
  
  // Voice Quality Metrics
  mean_hnr_db?: number;
  mean_f1_hz?: number;
  mean_f2_hz?: number;
  
  // Spectral Features (Librosa)
  mfcc_1_mean?: number;
  spectral_centroid_mean?: number;
  spectral_bandwidth_mean?: number;
  spectral_contrast_mean?: number;
  spectral_flatness_mean?: number;
  spectral_rolloff_mean?: number;
  chroma_mean?: number;
  
  // Speech Rate Metrics
  speech_rate_sps?: number;
  articulation_rate_sps?: number;
  
  // Legacy fields for backward compatibility
  jitter_percent?: number;
  shimmer_percent?: number;
  pitch_range_hz?: number;
  mfcc_1?: number;
  spectral_contrast?: number;
  zero_crossing_rate?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relationships
  recording?: AudioRecording;
}

export interface AnalysisStatusResponse {
  analysis_id: number;
  status: BackendAnalysisStatus;
  message: string;
  results?: AnalysisResult;
}

export interface FileUploadResponse {
  message: string;
  analysis_id: number;
  filename: string;
}

export interface WeeklySummaryResponse {
  user_id: string;
  period_days: number;
  analyses_count: number;
  weekly_summary: string;
  generated_at?: string;
}

// Enhanced Weekly Summary Types
export interface EnhancedWeeklySummary {
  period_summary: {
    start_date: string;
    end_date: string;
    total_recordings: number;
    completion_rate: number;
  };
  emotional_analysis: {
    overall_mood: number;
    dominant_emotions: Record<string, number>;
    emotion_stability: string;
    trends: EmotionTrend[];
  };
  communication_analysis: {
    primary_style: Record<string, number>;
    engagement_level: string;
    patterns: DialogueTrend[];
  };
  clinical_insights: {
    ai_summary: string;
    key_observations: string[];
    recommendations: string[];
  };
}

export interface EmotionTrend {
  date: string;
  dominant_emotion: string;
  emotion_distribution: Record<string, number>;
  confidence: number;
}

export interface DialogueTrend {
  date: string;
  primary_dialogue_act: string;
  dialogue_distribution: Record<string, number>;
}

export interface EnhancedWeeklySummaryResponse {
  user_id: string;
  period_days: number;
  enhanced_summary: EnhancedWeeklySummary;
  generated_at: string;
}

export interface RetryResponse {
  analysis_id: number;
  status: string;
  message: string;
  retried_at: string;
}

// Frontend-specific types for enhanced UX
export interface AnalysisState {
  id: string;
  status: FrontendAnalysisStatus;
  progress: number;
  results?: AnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  visibleMetrics: string[];
  // Additional properties for enhanced functionality
  userId?: string;
  filename?: string;
  fileSize?: number;
  duration?: number;
}

// Utility function to convert backend status to frontend status
export const mapBackendStatusToFrontend = (backendStatus: BackendAnalysisStatus): FrontendAnalysisStatus => {
  switch (backendStatus) {
    case 'PENDING':
      return 'processing';
    case 'PROCESSING':
      return 'processing';
    case 'COMPLETE':
      return 'completed';
    case 'FAILED':
      return 'failed';
    default:
      return 'idle';
  }
};

// Utility function to convert frontend status to backend status
export const mapFrontendStatusToBackend = (frontendStatus: FrontendAnalysisStatus): BackendAnalysisStatus => {
  switch (frontendStatus) {
    case 'uploading':
    case 'processing':
      return 'PROCESSING';
    case 'completed':
      return 'COMPLETE';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
};

export interface ChartDataPoint {
  timestamp: string;
  metrics: Record<string, number>;
  transcriptionSegment?: string;
}

export interface MetricConfig {
  key: string;
  label: string;
  color: string;
  visible: boolean;
  unit: string;
  description: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
  speed?: number;
  timeRemaining?: number;
}

export interface AnalysisFilters {
  dateRange?: DateRange;
  status?: BackendAnalysisStatus[];
  metrics?: string[];
  sentiment?: string[];
  emotions?: string[];
  dialogue_acts?: string[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeTimeSeries: boolean;
  includeSummary: boolean;
  includeEmotions: boolean;
  includeDialogueActs: boolean;
  dateRange?: DateRange;
  metrics?: string[];
}

// New types for enhanced analysis display
export interface EmotionChartData {
  emotion: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DialogueActChartData {
  act: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalysisInsights {
  emotionalState: string;
  communicationStyle: string;
  keyFindings: string[];
  recommendations: string[];
}

// Enhanced Vocal Analysis Types
export interface VocalAnalysisInsights {
  pitchStability: string;
  voiceQuality: string;
  articulationClarity: string;
  speechFluency: string;
  keyFindings: string[];
  clinicalRecommendations: string[];
}

export interface VocalMetricDisplay {
  metric: VocalMetric;
  category: 'pitch' | 'jitter' | 'shimmer' | 'quality' | 'spectral' | 'rate';
  status: 'normal' | 'elevated' | 'low' | 'warning';
  clinicalSignificance: string;
  color: string;
}

export interface VocalAnalysisSummary {
  overallQuality: string;
  primaryConcerns: string[];
  strengths: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
