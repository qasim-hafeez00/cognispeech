import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  AnalysisResult, 
  EmotionBreakdown, 
  DialogueActBreakdown, 
  SentenceAnalysis,
  EmotionChartData,
  DialogueActChartData
} from '@/types/analysis.types';

interface EnhancedLinguisticAnalysisProps {
  analysis: AnalysisResult;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#10b981',      // Green
  sadness: '#3b82f6',  // Blue
  fear: '#8b5cf6',     // Purple
  anger: '#ef4444',    // Red
  disgust: '#f59e0b',  // Amber
  surprise: '#ec4899',  // Pink
  neutral: '#6b7280'   // Gray
};

const DIALOGUE_ACT_COLORS: Record<string, string> = {
  statement: '#3b82f6',    // Blue
  question: '#10b981',     // Green
  agreement: '#059669',    // Emerald
  disagreement: '#dc2626', // Red
  request: '#f59e0b',      // Amber
  other: '#6b7280'         // Gray
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😀',
  sadness: '😭',
  fear: '😨',
  anger: '🤬',
  disgust: '🤢',
  surprise: '😲',
  neutral: '😐'
};

const DIALOGUE_ACT_ICONS: Record<string, string> = {
  statement: '💬',
  question: '❓',
  agreement: '✅',
  disagreement: '❌',
  request: '🙏',
  other: '📝'
};

export const EnhancedLinguisticAnalysis: React.FC<EnhancedLinguisticAnalysisProps> = ({ analysis }) => {
  if (!analysis.emotions_breakdown && !analysis.dialogue_acts_breakdown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linguistic Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No enhanced linguistic analysis data available.</p>
        </CardContent>
      </Card>
    );
  }

  const prepareEmotionChartData = (): EmotionChartData[] => {
    if (!analysis.emotions_breakdown) return [];
    
    const total = Object.values(analysis.emotions_breakdown).reduce((sum, count) => sum + (count || 0), 0);
    
    return Object.entries(analysis.emotions_breakdown)
      .filter(([_, count]) => (count || 0) > 0)
      .map(([emotion, count]) => ({
        emotion,
        count: count || 0,
        percentage: total > 0 ? ((count || 0) / total) * 100 : 0,
        color: EMOTION_COLORS[emotion] || '#6b7280'
      }))
      .sort((a, b) => b.count - a.count);
  };

  const prepareDialogueActChartData = (): DialogueActChartData[] => {
    if (!analysis.dialogue_acts_breakdown) return [];
    
    const total = Object.values(analysis.dialogue_acts_breakdown).reduce((sum, count) => sum + (count || 0), 0);
    
    return Object.entries(analysis.dialogue_acts_breakdown)
      .filter(([_, count]) => (count || 0) > 0)
      .map(([act, count]) => ({
        act,
        count: count || 0,
        percentage: total > 0 ? ((count || 0) / total) * 100 : 0,
        color: DIALOGUE_ACT_COLORS[act] || '#6b7280'
      }))
      .sort((a, b) => b.count - a.count);
  };

  const emotionData = prepareEmotionChartData();
  const dialogueData = prepareDialogueActChartData();

  return (
    <div className="space-y-6">
      {/* Overall Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Overall Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysis.overall_sentiment || analysis.sentiment_label || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Sentiment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analysis.overall_sentiment_score !== undefined 
                  ? (analysis.overall_sentiment_score * 100).toFixed(1) + '%'
                  : analysis.sentiment_score !== undefined 
                    ? (analysis.sentiment_score * 100).toFixed(1) + '%'
                    : 'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.sentence_count || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Sentences</div>
            </div>
          </div>
          
          {analysis.overall_sentiment_score !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sentiment Score</span>
                <span>{(analysis.overall_sentiment_score * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={analysis.overall_sentiment_score * 100} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Analysis */}
      {emotionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              😊 Emotion Analysis
              {analysis.dominant_emotion && (
                <Badge variant="outline" className="ml-2">
                  Dominant: {analysis.dominant_emotion} {EMOTION_EMOJIS[analysis.dominant_emotion]}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {emotionData.map((item) => (
                <div key={item.emotion} className="text-center space-y-2">
                  <div className="text-3xl">{EMOTION_EMOJIS[item.emotion]}</div>
                  <div className="text-lg font-semibold">{item.emotion}</div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            
            {analysis.emotion_confidence !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emotion Detection Confidence</span>
                  <span>{(analysis.emotion_confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={analysis.emotion_confidence * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogue Act Analysis */}
      {dialogueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 Communication Pattern Analysis
              {analysis.primary_dialogue_act && (
                <Badge variant="outline" className="ml-2">
                  Primary: {analysis.primary_dialogue_act} {DIALOGUE_ACT_ICONS[analysis.primary_dialogue_act]}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dialogueData.map((item) => (
                <div key={item.act} className="text-center space-y-2">
                  <div className="text-3xl">{DIALOGUE_ACT_ICONS[item.act]}</div>
                  <div className="text-lg font-semibold capitalize">{item.act}</div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentence-by-Sentence Analysis */}
      {analysis.sentence_analysis && analysis.sentence_analysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Detailed Sentence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.sentence_analysis.map((sentence, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Sentence {index + 1}
                  </div>
                  <div className="text-base font-medium">
                    "{sentence.text}"
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1"
                      style={{ 
                        borderColor: sentence.sentiment === 'POSITIVE' ? '#10b981' : 
                                   sentence.sentiment === 'NEGATIVE' ? '#ef4444' : '#6b7280'
                      }}
                    >
                      {sentence.sentiment === 'POSITIVE' ? '😊' : 
                       sentence.sentiment === 'NEGATIVE' ? '😔' : '😐'} {sentence.sentiment}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1"
                      style={{ borderColor: EMOTION_COLORS[sentence.emotion] || '#6b7280' }}
                    >
                      {EMOTION_EMOJIS[sentence.emotion]} {sentence.emotion}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1"
                      style={{ borderColor: DIALOGUE_ACT_COLORS[sentence.dialogue_act] || '#6b7280' }}
                    >
                      {DIALOGUE_ACT_ICONS[sentence.dialogue_act]} {sentence.dialogue_act}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analysis.transcript_text && (
          <Card>
            <CardHeader>
              <CardTitle>📝 Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <p className="text-sm leading-relaxed">{analysis.transcript_text}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.summary_text && (
          <Card>
            <CardHeader>
              <CardTitle>🤖 AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.summary_text}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
