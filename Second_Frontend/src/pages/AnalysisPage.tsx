import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Download, Share2, Calendar, User, Microphone } from 'lucide-react';
import { 
  AnalysisResult, 
  AudioRecording,
  User as UserType 
} from '@/types/analysis.types';
import { ComprehensiveAnalysisDashboard } from '@/components/ComprehensiveAnalysisDashboard';
import { EnhancedLinguisticAnalysis } from '@/components/EnhancedLinguisticAnalysis';
import { EnhancedVocalAnalysis } from '@/components/EnhancedVocalAnalysis';
import { VocalAnalysisTrends } from '@/components/VocalAnalysisTrends';

interface AnalysisPageProps {
  // Add any props if needed
}

export const AnalysisPage: React.FC<AnalysisPageProps> = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'linguistic' | 'vocal' | 'trends'>('dashboard');

  useEffect(() => {
    if (analysisId) {
      fetchAnalysisData();
    }
  }, [analysisId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the specific analysis
      const analysisResponse = await fetch(`/api/v1/analyses/${analysisId}`);
      if (!analysisResponse.ok) {
        throw new Error('Failed to fetch analysis data');
      }
      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData);
      
      // Fetch the associated recording
      if (analysisData.recording_id) {
        const recordingResponse = await fetch(`/api/v1/recordings/${analysisData.recording_id}`);
        if (recordingResponse.ok) {
          const recordingData = await recordingResponse.json();
          setRecording(recordingData);
          
          // Fetch user data
          if (recordingData.user_id) {
            const userResponse = await fetch(`/api/v1/users/${recordingData.user_id}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
              
              // Fetch user's other analyses for trends
              const userAnalysesResponse = await fetch(`/api/v1/users/${recordingData.user_id}/analyses`);
              if (userAnalysesResponse.ok) {
                const userAnalysesData = await userAnalysesResponse.json();
                setUserAnalyses(userAnalysesData);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!analysis) return;
    
    try {
      const response = await fetch(`/api/v1/analyses/${analysisId}/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-${analysisId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Voice Analysis Report',
          text: `Check out my voice analysis results: ${analysis.overall_sentiment || 'Analysis'} - Score: ${analysis.overall_sentiment_score ? (analysis.overall_sentiment_score * 100).toFixed(0) + '%' : 'N/A'}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load the requested analysis.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchAnalysisData}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasLinguisticData = analysis.overall_sentiment || analysis.emotions_breakdown || analysis.dialogue_acts_breakdown;
  const hasVocalData = analysis.mean_pitch_hz || analysis.jitter_local_percent || analysis.shimmer_local_percent || analysis.mean_hnr_db;
  const hasTrendData = userAnalyses.length > 1;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Voice Analysis Report</h1>
            <p className="text-muted-foreground">
              Analysis ID: {analysisId} • {recording ? new Date(recording.created_at).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Recording Info */}
      {recording && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microphone className="h-5 w-5" />
              Recording Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recorded:</span>
                <span className="font-medium">
                  {new Date(recording.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">User:</span>
                <span className="font-medium">
                  {user ? `${user.first_name} ${user.last_name}` : 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Microphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {recording.duration ? `${recording.duration.toFixed(1)}s` : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant={analysis.status === 'COMPLETED' ? 'default' : 'secondary'}
              className={
                analysis.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                analysis.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }
            >
              {analysis.status}
            </Badge>
            
            {analysis.status === 'COMPLETED' && (
              <div className="flex items-center gap-4 text-sm">
                {analysis.overall_sentiment && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Sentiment:</span>
                    <Badge variant="outline">
                      {analysis.overall_sentiment}
                    </Badge>
                  </div>
                )}
                
                {analysis.dominant_emotion && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Emotion:</span>
                    <Badge variant="outline">
                      {analysis.dominant_emotion}
                    </Badge>
                  </div>
                )}
                
                {analysis.primary_dialogue_act && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Style:</span>
                    <Badge variant="outline">
                      {analysis.primary_dialogue_act}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Views */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="linguistic" disabled={!hasLinguisticData}>Linguistic</TabsTrigger>
          <TabsTrigger value="vocal" disabled={!hasVocalData}>Vocal</TabsTrigger>
          <TabsTrigger value="trends" disabled={!hasTrendData}>Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ComprehensiveAnalysisDashboard 
            analysis={analysis} 
            userAnalyses={userAnalyses}
          />
        </TabsContent>
        
        <TabsContent value="linguistic" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="vocal" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
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
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              📋 Generate Report
            </Button>
            <Button variant="outline">
              🔄 Re-analyze
            </Button>
            <Button variant="outline">
              📊 Compare with Others
            </Button>
            <Button variant="outline">
              🏥 Schedule Consultation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
