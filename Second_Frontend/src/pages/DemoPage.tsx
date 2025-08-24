import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Mic, 
  BarChart3, 
  Zap, 
  ArrowRight,
  Play,
  Download,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          CogniSpeech Enhanced Analysis
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Experience the future of speech analysis with our comprehensive AI-powered platform. 
          Analyze 20+ vocal biomarkers and multi-layered linguistic insights in an intuitive, 
          user-friendly dashboard.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/enhanced-analysis">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Play className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Advanced Analysis Capabilities
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Enhanced Linguistic Analysis */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Enhanced Linguistic Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Multi-layered AI analysis using 5 different models for comprehensive 
                sentiment, emotion, and dialogue act analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• OpenAI Whisper transcription</li>
                <li>• RoBERTa sentiment analysis</li>
                <li>• DistilRoBERTa emotion classification</li>
                <li>• BART dialogue act analysis</li>
                <li>• AI-powered summarization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Comprehensive Vocal Analysis */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mic className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Comprehensive Vocal Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Extract 20+ vocal biomarkers using industry-standard tools including 
                Praat and Librosa for clinical-grade analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• Pitch and intensity metrics</li>
                <li>• Jitter and shimmer analysis</li>
                <li>• Formant frequency analysis</li>
                <li>• Spectral feature extraction</li>
                <li>• Speech rate calculations</li>
              </ul>
            </CardContent>
          </Card>

          {/* User-Friendly Dashboard */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">User-Friendly Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Intuitive interface designed for both technical and non-technical users, 
                with clear visualizations and actionable insights.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• Tabbed interface organization</li>
                <li>• Color-coded status indicators</li>
                <li>• Interactive visualizations</li>
                <li>• Mobile-responsive design</li>
                <li>• Accessibility features</li>
              </ul>
            </CardContent>
          </Card>

          {/* AI-Powered Insights */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Automated analysis and recommendations based on comprehensive 
                data analysis and clinical knowledge.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• Communication pattern analysis</li>
                <li>• Voice quality assessment</li>
                <li>• Personalized recommendations</li>
                <li>• Trend identification</li>
                <li>• Clinical significance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Real-time Processing */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Real-time Processing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Fast and efficient analysis pipeline with background processing 
                and real-time updates for seamless user experience.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• Background task processing</li>
                <li>• Real-time status updates</li>
                <li>• Efficient model caching</li>
                <li>• Scalable architecture</li>
                <li>• Performance optimization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Export & Sharing */}
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-teal-600" />
              </div>
              <CardTitle className="text-xl">Export & Sharing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Comprehensive reporting and sharing capabilities for 
                research, clinical use, and collaboration.
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li>• PDF report generation</li>
                <li>• CSV data export</li>
                <li>• Shareable dashboards</li>
                <li>• API integration</li>
                <li>• Data visualization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Experience Advanced Speech Analysis?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Explore our comprehensive dashboard and see how AI-powered analysis 
            can transform your understanding of speech patterns and vocal health.
          </p>
          <Link to="/enhanced-analysis">
            <Button size="lg" variant="outline" className="text-blue-600">
              <ArrowRight className="h-5 w-5 mr-2" />
              Launch Enhanced Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">CogniSpeech Enhanced Analysis</h3>
          <p className="text-gray-400 mb-6">
            Revolutionizing speech analysis with AI-powered insights and comprehensive vocal biomarker extraction.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>© 2024 CogniSpeech</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
