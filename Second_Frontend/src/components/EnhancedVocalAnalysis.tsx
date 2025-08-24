import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  AnalysisResult, 
  VocalMetric,
  VocalAnalysisInsights,
  VocalMetricDisplay,
  VocalAnalysisSummary
} from '@/types/analysis.types';

interface EnhancedVocalAnalysisProps {
  analysis: AnalysisResult;
}

const VOCAL_CATEGORIES = {
  pitch: { name: 'Pitch Analysis', color: '#3b82f6', icon: '🎵' },
  jitter: { name: 'Frequency Stability', color: '#ef4444', icon: '📊' },
  shimmer: { name: 'Amplitude Stability', color: '#f59e0b', icon: '📈' },
  quality: { name: 'Voice Quality', color: '#10b981', icon: '🎤' },
  spectral: { name: 'Spectral Features', color: '#8b5cf6', icon: '🌈' },
  rate: { name: 'Speech Dynamics', color: '#ec4899', icon: '⏱️' }
};

const CLINICAL_RANGES = {
  // Pitch metrics (Hz)
  mean_pitch_hz: { normal: [80, 300], elevated: [300, 500], low: [50, 80] },
  pitch_std_hz: { normal: [0, 50], elevated: [50, 100], low: [0, 10] },
  intensity_db: { normal: [50, 80], elevated: [80, 100], low: [30, 50] },
  
  // Jitter metrics (%)
  jitter_local_percent: { normal: [0, 1], elevated: [1, 3], low: [0, 0.5] },
  jitter_rap_percent: { normal: [0, 1.5], elevated: [1.5, 3], low: [0, 0.8] },
  
  // Shimmer metrics (%)
  shimmer_local_percent: { normal: [0, 3], elevated: [3, 6], low: [0, 1.5] },
  shimmer_apq11_percent: { normal: [0, 4], elevated: [4, 8], low: [0, 2] },
  
  // Voice quality metrics
  mean_hnr_db: { normal: [10, 20], elevated: [20, 30], low: [5, 10] },
  mean_f1_hz: { normal: [300, 800], elevated: [800, 1200], low: [200, 300] },
  mean_f2_hz: { normal: [800, 2000], elevated: [2000, 3000], low: [600, 800] },
  
  // Speech rate metrics (syllables/sec)
  speech_rate_sps: { normal: [2, 5], elevated: [5, 7], low: [1, 2] },
  articulation_rate_sps: { normal: [3, 6], elevated: [6, 8], low: [2, 3] }
};

const getMetricStatus = (metricName: string, value: number): 'normal' | 'elevated' | 'low' | 'warning' => {
  const ranges = CLINICAL_RANGES[metricName as keyof typeof CLINICAL_RANGES];
  if (!ranges) return 'normal';
  
  if (value >= ranges.normal[0] && value <= ranges.normal[1]) return 'normal';
  if (value >= ranges.elevated[0] && value <= ranges.elevated[1]) return 'elevated';
  if (value >= ranges.low[0] && value <= ranges.low[1]) return 'low';
  return 'warning';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'normal': return '#10b981';
    case 'elevated': return '#f59e0b';
    case 'low': return '#3b82f6';
    case 'warning': return '#ef4444';
    default: return '#6b7280';
  }
};

const getClinicalSignificance = (metricName: string, value: number): string => {
  const status = getMetricStatus(metricName, value);
  
  switch (metricName) {
    case 'mean_pitch_hz':
      if (status === 'elevated') return 'High pitch may indicate stress or vocal strain';
      if (status === 'low') return 'Low pitch may indicate fatigue or vocal cord issues';
      return 'Normal pitch range for healthy voice';
      
    case 'jitter_local_percent':
    case 'jitter_rap_percent':
      if (status === 'elevated') return 'Elevated jitter indicates vocal instability';
      if (status === 'warning') return 'High jitter may indicate voice disorder';
      return 'Normal frequency stability';
      
    case 'shimmer_local_percent':
    case 'shimmer_apq11_percent':
      if (status === 'elevated') return 'Elevated shimmer indicates amplitude instability';
      if (status === 'warning') return 'High shimmer may indicate voice disorder';
      return 'Normal amplitude stability';
      
    case 'mean_hnr_db':
      if (status === 'low') return 'Low HNR indicates breathiness or noise';
      if (status === 'elevated') return 'Excellent voice quality';
      return 'Good voice quality';
      
    case 'speech_rate_sps':
    case 'articulation_rate_sps':
      if (status === 'elevated') return 'Fast speech may indicate anxiety or mania';
      if (status === 'low') return 'Slow speech may indicate depression or cognitive decline';
      return 'Normal speech rate';
      
    default:
      return 'Clinical significance varies by individual';
  }
};

const generateVocalInsights = (analysis: AnalysisResult): VocalAnalysisInsights => {
  const insights: VocalAnalysisInsights = {
    pitchStability: 'Unknown',
    voiceQuality: 'Unknown',
    articulationClarity: 'Unknown',
    speechFluency: 'Unknown',
    keyFindings: [],
    clinicalRecommendations: []
  };
  
  // Analyze pitch stability
  if (analysis.pitch_std_hz !== undefined) {
    if (analysis.pitch_std_hz < 20) insights.pitchStability = 'Excellent';
    else if (analysis.pitch_std_hz < 50) insights.pitchStability = 'Good';
    else if (analysis.pitch_std_hz < 100) insights.pitchStability = 'Moderate';
    else insights.pitchStability = 'Poor';
  }
  
  // Analyze voice quality
  if (analysis.mean_hnr_db !== undefined) {
    if (analysis.mean_hnr_db > 15) insights.voiceQuality = 'Excellent';
    else if (analysis.mean_hnr_db > 10) insights.voiceQuality = 'Good';
    else if (analysis.mean_hnr_db > 5) insights.voiceQuality = 'Fair';
    else insights.voiceQuality = 'Poor';
  }
  
  // Analyze articulation clarity
  if (analysis.mean_f1_hz !== undefined && analysis.mean_f2_hz !== undefined) {
    insights.articulationClarity = 'Normal formant patterns';
  }
  
  // Analyze speech fluency
  if (analysis.speech_rate_sps !== undefined) {
    if (analysis.speech_rate_sps >= 2 && analysis.speech_rate_sps <= 5) {
      insights.speechFluency = 'Normal';
    } else if (analysis.speech_rate_sps > 5) {
      insights.speechFluency = 'Fast';
    } else {
      insights.speechFluency = 'Slow';
    }
  }
  
  // Generate key findings
  if (analysis.jitter_local_percent && analysis.jitter_local_percent > 2) {
    insights.keyFindings.push('Elevated frequency perturbation detected');
  }
  if (analysis.shimmer_local_percent && analysis.shimmer_local_percent > 5) {
    insights.keyFindings.push('Elevated amplitude perturbation detected');
  }
  if (analysis.mean_hnr_db && analysis.mean_hnr_db < 10) {
    insights.keyFindings.push('Reduced voice quality (low HNR)');
  }
  
  // Generate clinical recommendations
  if (insights.keyFindings.length > 0) {
    insights.clinicalRecommendations.push('Consider voice therapy evaluation');
    insights.clinicalRecommendations.push('Monitor for voice fatigue symptoms');
  } else {
    insights.clinicalRecommendations.push('Maintain current vocal hygiene practices');
    insights.clinicalRecommendations.push('Regular voice monitoring recommended');
  }
  
  return insights;
};

const generateVocalSummary = (analysis: AnalysisResult): VocalAnalysisSummary => {
  const summary: VocalAnalysisSummary = {
    overallQuality: 'Unknown',
    primaryConcerns: [],
    strengths: [],
    recommendations: [],
    riskLevel: 'low'
  };
  
  let score = 0;
  let totalMetrics = 0;
  
  // Score pitch metrics
  if (analysis.mean_pitch_hz !== undefined) {
    totalMetrics++;
    if (analysis.mean_pitch_hz >= 80 && analysis.mean_pitch_hz <= 300) score += 1;
  }
  
  if (analysis.pitch_std_hz !== undefined) {
    totalMetrics++;
    if (analysis.pitch_std_hz < 50) score += 1;
  }
  
  // Score jitter metrics
  if (analysis.jitter_local_percent !== undefined) {
    totalMetrics++;
    if (analysis.jitter_local_percent < 2) score += 1;
  }
  
  if (analysis.jitter_rap_percent !== undefined) {
    totalMetrics++;
    if (analysis.jitter_rap_percent < 2) score += 1;
  }
  
  // Score shimmer metrics
  if (analysis.shimmer_local_percent !== undefined) {
    totalMetrics++;
    if (analysis.shimmer_local_percent < 5) score += 1;
  }
  
  if (analysis.shimmer_apq11_percent !== undefined) {
    totalMetrics++;
    if (analysis.shimmer_apq11_percent < 6) score += 1;
  }
  
  // Score voice quality
  if (analysis.mean_hnr_db !== undefined) {
    totalMetrics++;
    if (analysis.mean_hnr_db > 10) score += 1;
  }
  
  // Calculate overall quality
  if (totalMetrics > 0) {
    const percentage = (score / totalMetrics) * 100;
    if (percentage >= 80) summary.overallQuality = 'Excellent';
    else if (percentage >= 60) summary.overallQuality = 'Good';
    else if (percentage >= 40) summary.overallQuality = 'Fair';
    else summary.overallQuality = 'Poor';
    
    // Determine risk level
    if (percentage >= 80) summary.riskLevel = 'low';
    else if (percentage >= 60) summary.riskLevel = 'low';
    else if (percentage >= 40) summary.riskLevel = 'medium';
    else summary.riskLevel = 'high';
  }
  
  // Generate strengths and concerns
  if (analysis.mean_hnr_db && analysis.mean_hnr_db > 15) {
    summary.strengths.push('Excellent voice quality (high HNR)');
  }
  if (analysis.pitch_std_hz && analysis.pitch_std_hz < 20) {
    summary.strengths.push('Excellent pitch stability');
  }
  
  if (analysis.jitter_local_percent && analysis.jitter_local_percent > 3) {
    summary.primaryConcerns.push('Elevated frequency perturbation');
  }
  if (analysis.shimmer_local_percent && analysis.shimmer_local_percent > 6) {
    summary.primaryConcerns.push('Elevated amplitude perturbation');
  }
  if (analysis.mean_hnr_db && analysis.mean_hnr_db < 8) {
    summary.primaryConcerns.push('Reduced voice quality');
  }
  
  // Generate recommendations
  if (summary.riskLevel === 'high') {
    summary.recommendations.push('Immediate voice therapy evaluation recommended');
    summary.recommendations.push('Consider ENT consultation');
  } else if (summary.riskLevel === 'medium') {
    summary.recommendations.push('Voice therapy evaluation recommended');
    summary.recommendations.push('Monitor for voice fatigue');
  } else {
    summary.recommendations.push('Maintain current vocal hygiene');
    summary.recommendations.push('Regular monitoring recommended');
  }
  
  return summary;
};

const getVocalMetrics = (analysis: AnalysisResult): VocalMetricDisplay[] => {
  const metrics: VocalMetricDisplay[] = [];
  
  // Pitch metrics
  if (analysis.mean_pitch_hz !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'mean_pitch_hz',
        full_name: 'Mean Pitch',
        value: analysis.mean_pitch_hz,
        unit: 'Hz',
        description: 'Average fundamental frequency'
      },
      category: 'pitch',
      status: getMetricStatus('mean_pitch_hz', analysis.mean_pitch_hz),
      clinicalSignificance: getClinicalSignificance('mean_pitch_hz', analysis.mean_pitch_hz),
      color: VOCAL_CATEGORIES.pitch.color
    });
  }
  
  if (analysis.pitch_std_hz !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'pitch_std_hz',
        full_name: 'Pitch Stability',
        value: analysis.pitch_std_hz,
        unit: 'Hz',
        description: 'Standard deviation of pitch'
      },
      category: 'pitch',
      status: getMetricStatus('pitch_std_hz', analysis.pitch_std_hz),
      clinicalSignificance: getClinicalSignificance('pitch_std_hz', analysis.pitch_std_hz),
      color: VOCAL_CATEGORIES.pitch.color
    });
  }
  
  if (analysis.intensity_db !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'intensity_db',
        full_name: 'Voice Intensity',
        value: analysis.intensity_db,
        unit: 'dB',
        description: 'Average acoustic intensity'
      },
      category: 'pitch',
      status: getMetricStatus('intensity_db', analysis.intensity_db),
      clinicalSignificance: getClinicalSignificance('intensity_db', analysis.intensity_db),
      color: VOCAL_CATEGORIES.pitch.color
    });
  }
  
  // Jitter metrics
  if (analysis.jitter_local_percent !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'jitter_local_percent',
        full_name: 'Local Jitter',
        value: analysis.jitter_local_percent,
        unit: '%',
        description: 'Cycle-to-cycle frequency variation'
      },
      category: 'jitter',
      status: getMetricStatus('jitter_local_percent', analysis.jitter_local_percent),
      clinicalSignificance: getClinicalSignificance('jitter_local_percent', analysis.jitter_local_percent),
      color: VOCAL_CATEGORIES.jitter.color
    });
  }
  
  if (analysis.jitter_rap_percent !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'jitter_rap_percent',
        full_name: 'RAP Jitter',
        value: analysis.jitter_rap_percent,
        unit: '%',
        description: 'Relative Average Perturbation'
      },
      category: 'jitter',
      status: getMetricStatus('jitter_rap_percent', analysis.jitter_rap_percent),
      clinicalSignificance: getClinicalSignificance('jitter_rap_percent', analysis.jitter_rap_percent),
      color: VOCAL_CATEGORIES.jitter.color
    });
  }
  
  // Shimmer metrics
  if (analysis.shimmer_local_percent !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'shimmer_local_percent',
        full_name: 'Local Shimmer',
        value: analysis.shimmer_local_percent,
        unit: '%',
        description: 'Cycle-to-cycle amplitude variation'
      },
      category: 'shimmer',
      status: getMetricStatus('shimmer_local_percent', analysis.shimmer_local_percent),
      clinicalSignificance: getClinicalSignificance('shimmer_local_percent', analysis.shimmer_local_percent),
      color: VOCAL_CATEGORIES.shimmer.color
    });
  }
  
  if (analysis.shimmer_apq11_percent !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'shimmer_apq11_percent',
        full_name: 'APQ11 Shimmer',
        value: analysis.shimmer_apq11_percent,
        unit: '%',
        description: '11-point Amplitude Perturbation Quotient'
      },
      category: 'shimmer',
      status: getMetricStatus('shimmer_apq11_percent', analysis.shimmer_apq11_percent),
      clinicalSignificance: getClinicalSignificance('shimmer_apq11_percent', analysis.shimmer_apq11_percent),
      color: VOCAL_CATEGORIES.shimmer.color
    });
  }
  
  // Voice quality metrics
  if (analysis.mean_hnr_db !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'mean_hnr_db',
        full_name: 'Harmonics-to-Noise Ratio',
        value: analysis.mean_hnr_db,
        unit: 'dB',
        description: 'Voice quality indicator'
      },
      category: 'quality',
      status: getMetricStatus('mean_hnr_db', analysis.mean_hnr_db),
      clinicalSignificance: getClinicalSignificance('mean_hnr_db', analysis.mean_hnr_db),
      color: VOCAL_CATEGORIES.quality.color
    });
  }
  
  if (analysis.mean_f1_hz !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'mean_f1_hz',
        full_name: 'First Formant (F1)',
        value: analysis.mean_f1_hz,
        unit: 'Hz',
        description: 'Vocal tract characteristics'
      },
      category: 'quality',
      status: getMetricStatus('mean_f1_hz', analysis.mean_f1_hz),
      clinicalSignificance: getClinicalSignificance('mean_f1_hz', analysis.mean_f1_hz),
      color: VOCAL_CATEGORIES.quality.color
    });
  }
  
  if (analysis.mean_f2_hz !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'mean_f2_hz',
        full_name: 'Second Formant (F2)',
        value: analysis.mean_f2_hz,
        unit: 'Hz',
        description: 'Vocal tract characteristics'
      },
      category: 'quality',
      status: getMetricStatus('mean_f2_hz', analysis.mean_f2_hz),
      clinicalSignificance: getClinicalSignificance('mean_f2_hz', analysis.mean_f2_hz),
      color: VOCAL_CATEGORIES.quality.color
    });
  }
  
  // Spectral features
  if (analysis.mfcc_1_mean !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'mfcc_1_mean',
        full_name: 'MFCC Coefficient 1',
        value: analysis.mfcc_1_mean,
        unit: '',
        description: 'Vocal tract shape characteristics'
      },
      category: 'spectral',
      status: 'normal',
      clinicalSignificance: 'Represents vocal tract configuration',
      color: VOCAL_CATEGORIES.spectral.color
    });
  }
  
  if (analysis.spectral_centroid_mean !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'spectral_centroid_mean',
        full_name: 'Spectral Centroid',
        value: analysis.spectral_centroid_mean,
        unit: 'Hz',
        description: 'Voice brightness indicator'
      },
      category: 'spectral',
      status: 'normal',
      clinicalSignificance: 'Indicates voice timbre characteristics',
      color: VOCAL_CATEGORIES.spectral.color
    });
  }
  
  // Speech rate metrics
  if (analysis.speech_rate_sps !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'speech_rate_sps',
        full_name: 'Speech Rate',
        value: analysis.speech_rate_sps,
        unit: 'syl/sec',
        description: 'Syllables per second (including pauses)'
      },
      category: 'rate',
      status: getMetricStatus('speech_rate_sps', analysis.speech_rate_sps),
      clinicalSignificance: getClinicalSignificance('speech_rate_sps', analysis.speech_rate_sps),
      color: VOCAL_CATEGORIES.rate.color
    });
  }
  
  if (analysis.articulation_rate_sps !== undefined) {
    metrics.push({
      metric: {
        metric_name: 'articulation_rate_sps',
        full_name: 'Articulation Rate',
        value: analysis.articulation_rate_sps,
        unit: 'syl/sec',
        description: 'Syllables per second (excluding pauses)'
      },
      category: 'rate',
      status: getMetricStatus('articulation_rate_sps', analysis.articulation_rate_sps),
      clinicalSignificance: getClinicalSignificance('articulation_rate_sps', analysis.articulation_rate_sps),
      color: VOCAL_CATEGORIES.rate.color
    });
  }
  
  return metrics;
};

export const EnhancedVocalAnalysis: React.FC<EnhancedVocalAnalysisProps> = ({ analysis }) => {
  const vocalMetrics = getVocalMetrics(analysis);
  const insights = generateVocalInsights(analysis);
  const summary = generateVocalSummary(analysis);
  
  if (vocalMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎤 Vocal Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No vocal analysis data available.</p>
        </CardContent>
      </Card>
    );
  }
  
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Vocal Analysis Summary
            <Badge 
              variant="outline" 
              style={{ borderColor: getRiskLevelColor(summary.riskLevel), color: getRiskLevelColor(summary.riskLevel) }}
            >
              Risk: {summary.riskLevel.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Overall Quality</h4>
              <p className="text-lg font-bold">{summary.overallQuality}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Pitch Stability</h4>
              <p className="text-lg font-bold">{insights.pitchStability}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Voice Quality</h4>
              <p className="text-lg font-bold">{insights.voiceQuality}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Speech Fluency</h4>
              <p className="text-lg font-bold">{insights.speechFluency}</p>
            </div>
          </div>
          
          {summary.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {summary.strengths.map((strength, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    ✅ {strength}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {summary.primaryConcerns.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Primary Concerns</h4>
              <div className="flex flex-wrap gap-2">
                {summary.primaryConcerns.map((concern, index) => (
                  <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                    ⚠️ {concern}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Metrics by Category */}
      {Object.entries(VOCAL_CATEGORIES).map(([categoryKey, category]) => {
        const categoryMetrics = vocalMetrics.filter(m => m.category === categoryKey);
        if (categoryMetrics.length === 0) return null;
        
        return (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon} {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryMetrics.map((metricDisplay, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{metricDisplay.metric.full_name}</h4>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: getStatusColor(metricDisplay.status),
                          color: getStatusColor(metricDisplay.status)
                        }}
                      >
                        {metricDisplay.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-2xl font-bold" style={{ color: metricDisplay.color }}>
                      {metricDisplay.metric.value.toFixed(2)} {metricDisplay.metric.unit}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {metricDisplay.metric.description}
                    </p>
                    
                    <div className="text-xs">
                      <strong>Clinical Significance:</strong> {metricDisplay.clinicalSignificance}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Clinical Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏥 Clinical Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600 text-lg">💡</div>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Key Findings */}
      {insights.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.keyFindings.map((finding, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600">📋</span>
                  <span className="text-sm">{finding}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
