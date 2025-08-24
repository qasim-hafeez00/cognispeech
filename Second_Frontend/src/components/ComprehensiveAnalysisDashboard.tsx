import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabPanels, TabPanel } from './ui/tabs';
import { Button } from './ui/button';
import { 
  AnalysisResult,
  VocalAnalysisSummary,
  VocalAnalysisInsights
} from '@/types/analysis.types';
import { EnhancedLinguisticAnalysis } from './EnhancedLinguisticAnalysis';
import { EnhancedVocalAnalysis } from './EnhancedVocalAnalysis';
import { VocalAnalysisTrends } from './VocalAnalysisTrends';

interface ComprehensiveAnalysisDashboardProps {
  analysis: AnalysisResult;
  userAnalyses?: AnalysisResult[]; // For trend analysis
}

const getOverallHealthScore = (analysis: AnalysisResult): number => {
  let score = 0;
  let totalFactors = 0;
  
  // Linguistic factors (40% weight)
  if (analysis.overall_sentiment_score !== undefined) {
    score += analysis.overall_sentiment_score * 0.4;
    totalFactors += 0.4;
  }
  
  // Vocal factors (60% weight)
  let vocalScore = 0;
  let vocalFactors = 0;
  
  // Pitch stability
  if (analysis.pitch_std_hz !== undefined) {
    if (analysis.pitch_std_hz < 20) vocalScore += 1;
    else if (analysis.pitch_std_hz < 50) vocalScore += 0.7;
    else if (analysis.pitch_std_hz < 100) vocalScore += 0.4;
    vocalFactors += 1;
  }
  
  // Jitter
  if (analysis.jitter_local_percent !== undefined) {
    if (analysis.jitter_local_percent < 1) vocalScore += 1;
    else if (analysis.jitter_local_percent < 2) vocalScore += 0.7;
    else if (analysis.jitter_local_percent < 3) vocalScore += 0.4;
    vocalFactors += 1;
  }
  
  // Shimmer
  if (analysis.shimmer_local_percent !== undefined) {
    if (analysis.shimmer_local_percent < 3) vocalScore += 1;
    else if (analysis.shimmer_local_percent < 5) vocalScore += 0.7;
    else if (analysis.shimmer_local_percent < 7) vocalScore += 0.4;
    vocalFactors += 1;
  }
  
  // Voice quality
  if (analysis.mean_hnr_db !== undefined) {
    if (analysis.mean_hnr_db > 15) vocalScore += 1;
    else if (analysis.mean_hnr_db > 10) vocalScore += 0.7;
    else if (analysis.mean_hnr_db > 5) vocalScore += 0.4;
    vocalFactors += 1;
  }
  
  if (vocalFactors > 0) {
    score += (vocalScore / vocalFactors) * 0.6;
    totalFactors += 0.6;
  }
  
  return totalFactors > 0 ? (score / totalFactors) * 100 : 0;
};

const getHealthStatus = (score: number): { status: string; color: string; description: string } => {
  if (score >= 80) {
    return { 
      status: 'Excellent', 
      color: '#10b981', 
      description: 'Your voice and communication patterns indicate excellent health and stability.' 
    };
  } else if (score >= 60) {
    return { 
      status: 'Good', 
      color: '#3b82f6', 
      description: 'Your voice and communication patterns are generally healthy with minor variations.' 
    };
  } else if (score >= 40) {
    return { 
      status: 'Fair', 
      color: '#f59e0b', 
      description: 'Some areas of concern detected. Consider monitoring and potential intervention.' 
    };
  } else {
    return { 
      status: 'Poor', 
      color: '#ef4444', 
      description: 'Significant concerns detected. Professional evaluation recommended.' 
    };
  }
};

const getTrendIndicators = (analysis: AnalysisResult): { trend: string; icon: string; color: string }[] => {
  const indicators = [];
  
  // Linguistic trends
  if (analysis.overall_sentiment_score !== undefined) {
    if (analysis.overall_sentiment_score > 0.7) {
      indicators.push({ 
        trend: 'Positive Emotional State', 
        icon: '😊', 
        color: '#10b981' 
      });
    } else if (analysis.overall_sentiment_score < 0.3) {
      indicators.push({ 
        trend: 'Negative Emotional State', 
        icon: '😔', 
        color: '#ef4444' 
      });
    }
  }
  
  // Vocal trends
  if (analysis.pitch_std_hz !== undefined && analysis.pitch_std_hz < 30) {
    indicators.push({ 
      trend: 'Excellent Pitch Stability', 
      icon: '🎵', 
      color: '#10b981' 
    });
  }
  
  if (analysis.mean_hnr_db !== undefined && analysis.mean_hnr_db > 15) {
    indicators.push({ 
      trend: 'High Voice Quality', 
      icon: '🎤', 
      color: '#10b981' 
    });
  }
  
  if (analysis.jitter_local_percent !== undefined && analysis.jitter_local_percent > 2) {
    indicators.push({ 
      trend: 'Elevated Frequency Perturbation', 
      icon: '⚠️', 
      color: '#f59e0b' 
    });
  }
  
  if (analysis.shimmer_local_percent !== undefined && analysis.shimmer_local_percent > 5) {
    indicators.push({ 
      trend: 'Elevated Amplitude Perturbation', 
      icon: '⚠️', 
      color: '#f59e0b' 
    });
  }
  
  return indicators;
};

export const ComprehensiveAnalysisDashboard: React.FC<ComprehensiveAnalysisDashboardProps> = ({ 
  analysis, 
  userAnalyses = [] 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const healthScore = getOverallHealthScore(analysis);
  const healthStatus = getHealthStatus(healthScore);
  const trendIndicators = getTrendIndicators(analysis);
  
  const hasLinguisticData = analysis.overall_sentiment || analysis.emotions_breakdown || analysis.dialogue_acts_breakdown;
  const hasVocalData = analysis.mean_pitch_hz || analysis.jitter_local_percent || analysis.shimmer_local_percent || analysis.mean_hnr_db;
  const hasTrendData = userAnalyses.length > 1;
  
  return (
    <div className="space-y-6">
      {/* Header with Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏥 Comprehensive Health Analysis Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Health Score */}
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold" style={{ color: healthStatus.color }}>
                {healthScore.toFixed(0)}%
              </div>
              <div className="text-lg font-semibold">{healthStatus.status}</div>
              <p className="text-sm text-muted-foreground">{healthStatus.description}</p>
            </div>
            
            {/* Health Status Badge */}
            <div className="flex items-center justify-center">
              <Badge 
                variant="outline" 
                className="text-lg px-6 py-3"
                style={{ borderColor: healthStatus.color, color: healthStatus.color }}
              >
                {healthStatus.status} Health
              </Badge>
            </div>
            
            {/* Trend Indicators */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Key Indicators</h4>
              <div className="space-y-1">
                {trendIndicators.slice(0, 3).map((indicator, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{indicator.icon}</span>
                    <span style={{ color: indicator.color }}>{indicator.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Analysis Tabs */}
      <Tabs defaultIndex={['overview', 'linguistic', 'vocal', 'trends'].indexOf(activeTab)} onChange={(index) => {
        const tabNames = ['overview', 'linguistic', 'vocal', 'trends'];
        if (index !== undefined && index >= 0 && index < tabNames.length) {
          setActiveTab(tabNames[index]!);
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="linguistic">Linguistic Analysis</TabsTrigger>
          <TabsTrigger value="vocal">Vocal Analysis</TabsTrigger>
          <TabsTrigger value="trends" disabled={!hasTrendData}>Trends</TabsTrigger>
        </TabsList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linguistic Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🧠 Linguistic Health Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasLinguisticData ? (
                    <div className="space-y-4">
                      {analysis.overall_sentiment && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Overall Sentiment</h4>
                          <Badge 
                            variant="outline" 
                            className={
                              analysis.overall_sentiment === 'POSITIVE' ? 'border-green-500 text-green-700' :
                              analysis.overall_sentiment === 'NEGATIVE' ? 'border-red-500 text-red-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {analysis.overall_sentiment}
                          </Badge>
                        </div>
                      )}
                      
                      {analysis.dominant_emotion && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Dominant Emotion</h4>
                          <Badge variant="outline">{analysis.dominant_emotion}</Badge>
                        </div>
                      )}
                      
                      {analysis.primary_dialogue_act && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Communication Style</h4>
                          <Badge variant="outline">{analysis.primary_dialogue_act}</Badge>
                        </div>
                      )}
                      
                      {analysis.sentence_count && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Analysis Depth</h4>
                          <p className="text-lg font-bold">{analysis.sentence_count} sentences analyzed</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No linguistic analysis data available.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Vocal Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎤 Vocal Health Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasVocalData ? (
                    <div className="space-y-4">
                      {analysis.mean_pitch_hz && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Mean Pitch</h4>
                          <p className="text-lg font-bold">{analysis.mean_pitch_hz.toFixed(1)} Hz</p>
                        </div>
                      )}
                      
                      {analysis.pitch_std_hz && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Pitch Stability</h4>
                          <Badge 
                            variant="outline" 
                            className={
                              analysis.pitch_std_hz < 20 ? 'border-green-500 text-green-700' :
                              analysis.pitch_std_hz < 50 ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }
                          >
                            {analysis.pitch_std_hz < 20 ? 'Excellent' : 
                             analysis.pitch_std_hz < 50 ? 'Good' : 'Poor'}
                          </Badge>
                        </div>
                      )}
                      
                      {analysis.mean_hnr_db && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Voice Quality</h4>
                          <Badge 
                            variant="outline" 
                            className={
                              analysis.mean_hnr_db > 15 ? 'border-green-500 text-green-700' :
                              analysis.mean_hnr_db > 10 ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }
                          >
                            {analysis.mean_hnr_db > 15 ? 'Excellent' : 
                             analysis.mean_hnr_db > 10 ? 'Good' : 'Poor'}
                          </Badge>
                        </div>
                      )}
                      
                      {analysis.speech_rate_sps && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Speech Rate</h4>
                          <p className="text-lg font-bold">{analysis.speech_rate_sps.toFixed(1)} syl/sec</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No vocal analysis data available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('linguistic')}
                    disabled={!hasLinguisticData}
                  >
                    📊 View Detailed Linguistic Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('vocal')}
                    disabled={!hasVocalData}
                  >
                    🎤 View Detailed Vocal Analysis
                  </Button>
                  {hasTrendData && (
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('trends')}
                    >
                      📈 View Vocal Trends
                    </Button>
                  )}
                  <Button variant="outline">
                    📋 Export Analysis Report
                  </Button>
                  <Button variant="outline">
                    �� Schedule Follow-up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabPanel>
          
          {/* Linguistic Analysis Tab */}
          <TabPanel>
            {hasLinguisticData ? (
              <EnhancedLinguisticAnalysis analysis={analysis} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>🧠 Linguistic Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No linguistic analysis data available for this recording.</p>
                </CardContent>
              </Card>
            )}
          </TabPanel>
          
          {/* Vocal Analysis Tab */}
          <TabPanel>
            {hasVocalData ? (
              <EnhancedVocalAnalysis analysis={analysis} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>🎤 Vocal Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No vocal analysis data available for this recording.</p>
                </CardContent>
              </Card>
            )}
          </TabPanel>
          
          {/* Trends Tab */}
          <TabPanel>
            {hasTrendData ? (
              <VocalAnalysisTrends analyses={userAnalyses} days={30} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Vocal Analysis Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    At least 2 recordings are needed to analyze trends. Continue recording to see your vocal health progress over time.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};
