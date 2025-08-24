import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  AnalysisResult,
  VocalMetricDisplay
} from '@/types/analysis.types';

interface VocalAnalysisTrendsProps {
  analyses: AnalysisResult[];
  days?: number;
}

interface TrendData {
  date: string;
  pitch_stability: number;
  voice_quality: number;
  frequency_stability: number;
  amplitude_stability: number;
  speech_fluency: number;
}

const calculateVocalScore = (analysis: AnalysisResult): number => {
  let score = 0;
  let factors = 0;
  
  // Pitch stability (25% weight)
  if (analysis.pitch_std_hz !== undefined) {
    if (analysis.pitch_std_hz < 20) score += 25;
    else if (analysis.pitch_std_hz < 50) score += 20;
    else if (analysis.pitch_std_hz < 100) score += 15;
    else score += 5;
    factors += 1;
  }
  
  // Voice quality (25% weight)
  if (analysis.mean_hnr_db !== undefined) {
    if (analysis.mean_hnr_db > 15) score += 25;
    else if (analysis.mean_hnr_db > 10) score += 20;
    else if (analysis.mean_hnr_db > 5) score += 15;
    else score += 5;
    factors += 1;
  }
  
  // Frequency stability (25% weight)
  if (analysis.jitter_local_percent !== undefined) {
    if (analysis.jitter_local_percent < 1) score += 25;
    else if (analysis.jitter_local_percent < 2) score += 20;
    else if (analysis.jitter_local_percent < 3) score += 15;
    else score += 5;
    factors += 1;
  }
  
  // Amplitude stability (25% weight)
  if (analysis.shimmer_local_percent !== undefined) {
    if (analysis.shimmer_local_percent < 3) score += 25;
    else if (analysis.shimmer_local_percent < 5) score += 20;
    else if (analysis.shimmer_local_percent < 7) score += 15;
    else score += 5;
    factors += 1;
  }
  
  return factors > 0 ? score / factors : 0;
};

const getTrendDirection = (current: number, previous: number): 'improving' | 'declining' | 'stable' => {
  const diff = current - previous;
  if (Math.abs(diff) < 5) return 'stable';
  return diff > 0 ? 'improving' : 'declining';
};

const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'improving': return '#10b981';
    case 'declining': return '#ef4444';
    case 'stable': return '#6b7280';
    default: return '#6b7280';
  }
};

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'improving': return '📈';
    case 'declining': return '📉';
    case 'stable': return '➡️';
    default: return '➡️';
  }
};

const getMetricTrend = (analyses: AnalysisResult[], metricKey: keyof AnalysisResult): {
  current: number;
  previous: number;
  trend: string;
  change: number;
} => {
  const validAnalyses = analyses
    .filter(a => a[metricKey] !== undefined)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  if (validAnalyses.length < 2) {
    return { current: 0, previous: 0, trend: 'stable', change: 0 };
  }
  
  const currentAnalysis = validAnalyses[0];
  const previousAnalysis = validAnalyses[1];
  
  if (!currentAnalysis || !previousAnalysis) {
    return { current: 0, previous: 0, trend: 'stable', change: 0 };
  }
  
  const current = currentAnalysis[metricKey] as number;
  const previous = previousAnalysis[metricKey] as number;
  const change = current - previous;
  const trend = getTrendDirection(current, previous);
  
  return { current, previous, trend, change };
};

const getOverallTrend = (analyses: AnalysisResult[]): string => {
  if (analyses.length < 2) return 'stable';
  
  const recentScores = analyses
    .slice(0, Math.min(3, analyses.length))
    .map(calculateVocalScore);
  
  if (recentScores.length < 2) return 'stable';
  
  const avgRecent = recentScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const avgOlder = recentScores.slice(2).reduce((a, b) => a + b, 0) / (recentScores.length - 2);
  
  const diff = avgRecent - avgOlder;
  if (Math.abs(diff) < 5) return 'stable';
  return diff > 0 ? 'improving' : 'declining';
};

export const VocalAnalysisTrends: React.FC<VocalAnalysisTrendsProps> = ({ analyses, days = 30 }) => {
  if (analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Vocal Analysis Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analysis data available for trend analysis.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Filter analyses by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const recentAnalyses = analyses.filter(a => new Date(a.created_at) >= cutoffDate);
  
  if (recentAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Vocal Analysis Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analysis data available for the specified period.</p>
        </CardContent>
      </Card>
    );
  }
  
  const overallTrend = getOverallTrend(recentAnalyses);
  const overallTrendColor = getTrendColor(overallTrend);
  const overallTrendIcon = getTrendIcon(overallTrend);
  
  // Calculate trends for key metrics
  const pitchTrend = getMetricTrend(recentAnalyses, 'pitch_std_hz');
  const hnrTrend = getMetricTrend(recentAnalyses, 'mean_hnr_db');
  const jitterTrend = getMetricTrend(recentAnalyses, 'jitter_local_percent');
  const shimmerTrend = getMetricTrend(recentAnalyses, 'shimmer_local_percent');
  const speechRateTrend = getMetricTrend(recentAnalyses, 'speech_rate_sps');
  
  // Calculate average scores
  const avgScores = recentAnalyses.map(calculateVocalScore);
  const avgScore = avgScores.reduce((a, b) => a + b, 0) / avgScores.length;
  
  // Get best and worst recordings
  const bestRecording = recentAnalyses.reduce((best, current) => 
    calculateVocalScore(current) > calculateVocalScore(best) ? current : best
  );
  const worstRecording = recentAnalyses.reduce((worst, current) => 
    calculateVocalScore(current) < calculateVocalScore(worst) ? current : worst
  );
  
  return (
    <div className="space-y-6">
      {/* Overall Trend Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Vocal Health Trends ({days} days)
            <Badge 
              variant="outline" 
              style={{ borderColor: overallTrendColor, color: overallTrendColor }}
            >
              {overallTrendIcon} {overallTrend.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Average Score</h4>
              <div className="text-3xl font-bold" style={{ color: overallTrendColor }}>
                {avgScore.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Overall vocal health</p>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Recordings Analyzed</h4>
              <div className="text-3xl font-bold text-blue-600">
                {recentAnalyses.length}
              </div>
              <p className="text-sm text-muted-foreground">In the last {days} days</p>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Trend Direction</h4>
              <div className="text-3xl font-bold" style={{ color: overallTrendColor }}>
                {overallTrendIcon}
              </div>
              <p className="text-sm text-muted-foreground capitalize">{overallTrend}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Metric Trends */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Key Metric Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pitch Stability Trend */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Pitch Stability</h4>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getTrendColor(pitchTrend.trend),
                    color: getTrendColor(pitchTrend.trend)
                  }}
                >
                  {getTrendIcon(pitchTrend.trend)} {pitchTrend.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-semibold">{pitchTrend.current.toFixed(1)} Hz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Previous:</span>
                  <span className="text-muted-foreground">{pitchTrend.previous.toFixed(1)} Hz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span 
                    className={pitchTrend.change > 0 ? 'text-red-600' : 'text-green-600'}
                  >
                    {pitchTrend.change > 0 ? '+' : ''}{pitchTrend.change.toFixed(1)} Hz
                  </span>
                </div>
              </div>
            </div>
            
            {/* Voice Quality Trend */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Voice Quality (HNR)</h4>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getTrendColor(hnrTrend.trend),
                    color: getTrendColor(hnrTrend.trend)
                  }}
                >
                  {getTrendIcon(hnrTrend.trend)} {hnrTrend.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-semibold">{hnrTrend.current.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Previous:</span>
                  <span className="text-muted-foreground">{hnrTrend.previous.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span 
                    className={hnrTrend.change > 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {hnrTrend.change > 0 ? '+' : ''}{hnrTrend.change.toFixed(1)} dB
                  </span>
                </div>
              </div>
            </div>
            
            {/* Frequency Stability Trend */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Frequency Stability</h4>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getTrendColor(jitterTrend.trend),
                    color: getTrendColor(jitterTrend.trend)
                  }}
                >
                  {getTrendIcon(jitterTrend.trend)} {jitterTrend.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-semibold">{jitterTrend.current.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Previous:</span>
                  <span className="text-muted-foreground">{jitterTrend.previous.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span 
                    className={jitterTrend.change < 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {jitterTrend.change > 0 ? '+' : ''}{jitterTrend.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Amplitude Stability Trend */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Amplitude Stability</h4>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getTrendColor(shimmerTrend.trend),
                    color: getTrendColor(shimmerTrend.trend)
                  }}
                >
                  {getTrendIcon(shimmerTrend.trend)} {shimmerTrend.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-semibold">{shimmerTrend.current.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Previous:</span>
                  <span className="text-muted-foreground">{shimmerTrend.previous.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span 
                    className={shimmerTrend.change < 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {shimmerTrend.change > 0 ? '+' : ''}{shimmerTrend.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Speech Rate Trend */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Speech Rate</h4>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getTrendColor(speechRateTrend.trend),
                    color: getTrendColor(speechRateTrend.trend)
                  }}
                >
                  {getTrendIcon(speechRateTrend.trend)} {speechRateTrend.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-semibold">{speechRateTrend.current.toFixed(1)} syl/sec</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Previous:</span>
                  <span className="text-muted-foreground">{speechRateTrend.previous.toFixed(1)} syl/sec</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span 
                    className={Math.abs(speechRateTrend.change) < 0.5 ? 'text-gray-600' : 
                              speechRateTrend.change > 0 ? 'text-blue-600' : 'text-orange-600'}
                  >
                    {speechRateTrend.change > 0 ? '+' : ''}{speechRateTrend.change.toFixed(1)} syl/sec
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Performance */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-lg text-green-600">🥇 Best Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(bestRecording.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Score:</span>
                  <span className="text-sm font-bold text-green-600">
                    {calculateVocalScore(bestRecording).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pitch Stability:</span>
                  <span className="text-sm">
                    {bestRecording.pitch_std_hz ? bestRecording.pitch_std_hz.toFixed(1) + ' Hz' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Voice Quality:</span>
                  <span className="text-sm">
                    {bestRecording.mean_hnr_db ? bestRecording.mean_hnr_db.toFixed(1) + ' dB' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Areas for Improvement */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-lg text-orange-600">📈 Areas for Improvement</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(worstRecording.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Score:</span>
                  <span className="text-sm font-bold text-orange-600">
                    {calculateVocalScore(worstRecording).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pitch Stability:</span>
                  <span className="text-sm">
                    {worstRecording.pitch_std_hz ? worstRecording.pitch_std_hz.toFixed(1) + ' Hz' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Voice Quality:</span>
                  <span className="text-sm">
                    {worstRecording.mean_hnr_db ? worstRecording.mean_hnr_db.toFixed(1) + ' dB' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Trend-Based Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overallTrend === 'improving' && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600 text-lg">✅</div>
                <div>
                  <h4 className="font-semibold text-green-800">Excellent Progress!</h4>
                  <p className="text-sm text-green-700">
                    Your vocal health is improving. Continue with current practices and maintain regular monitoring.
                  </p>
                </div>
              </div>
            )}
            
            {overallTrend === 'declining' && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="text-red-600 text-lg">⚠️</div>
                <div>
                  <h4 className="font-semibold text-red-800">Attention Required</h4>
                  <p className="text-sm text-red-700">
                    Your vocal health has declined. Consider voice therapy evaluation and review vocal hygiene practices.
                  </p>
                </div>
              </div>
            )}
            
            {overallTrend === 'stable' && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-blue-800">Stable Performance</h4>
                  <p className="text-sm text-blue-700">
                    Your vocal health is stable. Continue monitoring and consider preventive measures to maintain health.
                  </p>
                </div>
              </div>
            )}
            
            {/* Specific metric recommendations */}
            {jitterTrend.trend === 'declining' && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600 text-lg">🎵</div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Pitch Stability Concern</h4>
                  <p className="text-sm text-yellow-700">
                    Your pitch stability has declined. Consider vocal exercises and stress management techniques.
                  </p>
                </div>
              </div>
            )}
            
            {hnrTrend.trend === 'declining' && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600 text-lg">🎤</div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Voice Quality Concern</h4>
                  <p className="text-sm text-yellow-700">
                    Your voice quality has declined. Review vocal hygiene and consider professional evaluation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
