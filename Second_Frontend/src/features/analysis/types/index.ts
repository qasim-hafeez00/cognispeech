// Re-export types from main types file to avoid conflicts
export type { 
  AnalysisResult, 
  User, 
  AnalysisState, 
  MetricConfig,
  DateRange,
  AnalysisFilters 
} from '@/types/analysis.types';

// Local analysis types
export interface ChartData {
  label: string;
  value: number;
}

export interface AnalysisRequest {
  fileId: string;
  options: {
    includeSentiment: boolean;
    includeKeywords: boolean;
    includeSummary: boolean;
  };
}

// Additional analysis-specific types
export interface AnalysisFilter {
  dateRange?: [Date, Date];
  status?: string[];
  metrics?: string[];
}

export interface AnalysisMetrics {
  mean_pitch_hz?: number;
  jitter_percent?: number;
  shimmer_percent?: number;
  sentiment_score?: number;
}
