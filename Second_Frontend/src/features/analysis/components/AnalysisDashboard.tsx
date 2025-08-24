import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Grid,
  GridItem,
  Progress,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { FiUpload, FiFileText, FiTrendingUp, FiDownload, FiEye, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { TimeSeriesChart } from './TimeSeriesChart';
import { AISummary } from './AISummary';
import { WeeklySummary } from './WeeklySummary';
import { useAnalysisStore, useCurrentAnalysis, useAnalysesList } from '@/store/analysis.store';
import { analysisService } from '@/services/analysis.service';

interface AnalysisDashboardProps {
  userId: string;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  
  const { 
    currentAnalysisId, 
    setCurrentAnalysisId, 
    analyses, 
    loadAnalysisDetails,
    loadUserAnalyses,
    visibleMetrics,
    toggleMetricVisibility,
    setDateRange
  } = useAnalysisStore();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[Date, Date] | null>(null);
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null);
  
  // Modal state for raw data
  const { isOpen: isRawDataOpen, onOpen: onRawDataOpen, onClose: onRawDataClose } = useDisclosure();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  const currentAnalysis = useCurrentAnalysis();
  const analysesList = useAnalysesList();

  // Load user analyses on component mount
  useEffect(() => {
    loadUserAnalyses(userId);
  }, [userId, loadUserAnalyses]);

  // Filter analyses based on selected time range
  const filteredAnalyses = React.useMemo(() => {
    if (!selectedTimeRange || !analysesList.length) return analysesList;

    const [startDate, endDate] = selectedTimeRange;
    return analysesList.filter((analysis: any) => {
      const analysisDate = new Date(analysis.createdAt);
      return analysisDate >= startDate && analysisDate <= endDate;
    });
  }, [analysesList, selectedTimeRange]);

  // Get completed analyses for charting
  const completedAnalyses = React.useMemo(() => {
    return filteredAnalyses.filter((analysis: any) => analysis.status === 'completed');
  }, [filteredAnalyses]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!completedAnalyses.length) return null;

    const totalAnalyses = completedAnalyses.length;
    const recentAnalyses = completedAnalyses.filter(
      (analysis: any) => new Date(analysis.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Calculate average metrics
    const avgPitch = completedAnalyses.reduce((sum: number, analysis: any) => {
      return sum + (analysis.results?.mean_pitch_hz || 0);
    }, 0) / totalAnalyses;

    const avgJitter = completedAnalyses.reduce((sum: number, analysis: any) => {
      return sum + (analysis.results?.jitter_percent || 0);
    }, 0) / totalAnalyses;

    const avgSentiment = completedAnalyses.reduce((sum: number, analysis: any) => {
      return sum + (analysis.results?.sentiment_score || 0);
    }, 0) / totalAnalyses;

    return {
      totalAnalyses,
      recentAnalyses,
      avgPitch: Math.round(avgPitch),
      avgJitter: avgJitter.toFixed(2),
      avgSentiment: avgSentiment.toFixed(2),
    };
  }, [completedAnalyses]);

  // Handle metric highlighting
  const handleMetricHighlight = useCallback((metric: string, date: string) => {
    // This would typically highlight the corresponding data point on the chart
    console.log('Highlighting metric:', metric, 'at date:', date);
  }, []);

  // Handle time range selection
  const handleTimeRangeSelect = useCallback((range: [Date, Date] | null) => {
    setSelectedTimeRange(range);
    if (range) {
      setDateRange({
        start: range[0].toISOString(),
        end: range[1].toISOString(),
      });
    } else {
      setDateRange(null);
    }
  }, [setDateRange]);

  // Handle analysis selection
  const handleAnalysisSelect = useCallback(async (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
    
    // Load detailed results for the selected analysis
    try {
      await loadAnalysisDetails(analysisId);
      console.log('Detailed results loaded for analysis:', analysisId);
    } catch (error) {
      console.error('Failed to load detailed results:', error);
    }
  }, [setCurrentAnalysisId, loadAnalysisDetails]);

  // Handle metric visibility toggle
  const handleMetricToggle = useCallback((metricKey: string) => {
    toggleMetricVisibility(metricKey);
  }, [toggleMetricVisibility]);

  // Generate mock AI summary (in production, this would come from the backend)
  const generateMockSummary = useCallback(() => {
    if (!completedAnalyses.length) return 'No analysis data available.';

    const latestAnalysis = completedAnalyses[0];
    if (!latestAnalysis) return 'No analysis data available.';
    
    const results = latestAnalysis.results;

    if (!results) return 'Analysis results not available.';

    return `Based on your recent vocal analysis, your mean fundamental frequency is ${results.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz, which falls within the normal range for your age group. 

Your jitter measurement of ${results.jitter_percent?.toFixed(2) || 'N/A'}% indicates ${(results.jitter_percent || 0) < 1.0 ? 'excellent' : 'good'} vocal stability, while your shimmer of ${results.shimmer_percent?.toFixed(2) || 'N/A'}% suggests ${(results.shimmer_percent || 0) < 3.0 ? 'healthy' : 'moderate'} amplitude control.

The sentiment analysis of your speech content shows a ${results.sentiment_label || 'neutral'} emotional tone with a confidence score of ${results.sentiment_score?.toFixed(2) || 'N/A'}.

Overall, your vocal biomarkers suggest ${(results.mean_pitch_hz || 0) > 150 ? 'good' : 'adequate'} vocal health. Consider maintaining regular vocal exercises and staying hydrated for optimal vocal performance.`;
  }, [completedAnalyses]);

  const [aiSummary] = useState(generateMockSummary());

  // Navigate to enhanced analysis page
  const handleViewEnhancedAnalysis = () => {
    navigate('/enhanced-analysis');
  };

  if (!analysesList.length) {
    return (
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
      >
        <VStack spacing={4}>
          <FiFileText size={48} color={accentColor} />
          <Heading size="lg" color={textColor}>
            Welcome to Your Vocal Health Dashboard
          </Heading>
          <Text color={useColorModeValue('gray.500', 'gray.400')} maxW="md">
            Upload your first audio recording to start tracking your vocal biomarkers and get AI-powered insights.
          </Text>
          <Button
            leftIcon={<FiUpload />}
            colorScheme="blue"
            size="lg"
            onClick={() => {/* Navigate to upload */}}
          >
            Upload Audio
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Dashboard Header */}
      <Box textAlign="center">
        <Heading size="lg" color={textColor} mb={2}>
          Vocal Health Dashboard
        </Heading>
        <Text color={useColorModeValue('gray.500', 'gray.400')}>
          Track your vocal biomarkers over time and get AI-powered insights
        </Text>
      </Box>

      {/* Summary Statistics */}
      {summaryStats && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <GridItem>
            <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Total Analyses</StatLabel>
                <StatNumber color={textColor}>{summaryStats.totalAnalyses}</StatNumber>
                <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>
                  <StatArrow type="increase" />
                  {summaryStats.recentAnalyses} this week
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>
          
          <GridItem>
            <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Avg Pitch</StatLabel>
                <StatNumber color={textColor}>{summaryStats.avgPitch} Hz</StatNumber>
                <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Fundamental frequency</StatHelpText>
              </Stat>
            </Box>
          </GridItem>
          
          <GridItem>
            <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Avg Jitter</StatLabel>
                <StatNumber color={textColor}>{summaryStats.avgJitter}%</StatNumber>
                <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Frequency perturbation</StatHelpText>
              </Stat>
            </Box>
          </GridItem>
          
          <GridItem>
            <Box bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Avg Sentiment</StatLabel>
                <StatNumber color={textColor}>{summaryStats.avgSentiment}</StatNumber>
                <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Emotional tone score</StatHelpText>
              </Stat>
            </Box>
          </GridItem>
        </Grid>
      )}

      {/* Main Dashboard Tabs */}
      <Box bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor} overflow="hidden">
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue">
          <TabList bg={useColorModeValue('gray.50', 'gray.700')} px={6}>
            <Tab color={useColorModeValue('gray.600', 'gray.300')} _selected={{ color: 'blue.500' }}>
              <HStack spacing={2}>
                <FiTrendingUp />
                <Text>Trends & Charts</Text>
              </HStack>
            </Tab>
            <Tab color={useColorModeValue('gray.600', 'gray.300')} _selected={{ color: 'blue.500' }}>
              <HStack spacing={2}>
                <FiFileText />
                <Text>AI Summary</Text>
              </HStack>
            </Tab>
            <Tab color={useColorModeValue('gray.600', 'gray.300')} _selected={{ color: 'blue.500' }}>
              <HStack spacing={2}>
                <FiFileText />
                <Text>Analysis History</Text>
              </HStack>
            </Tab>
            <Tab color={useColorModeValue('gray.600', 'gray.300')} _selected={{ color: 'blue.500' }}>
              <HStack spacing={2}>
                <FiTrendingUp />
                <Text>Weekly Summary</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Trends & Charts Tab */}
            <TabPanel p={6}>
              <VStack spacing={6} align="stretch">
                {/* Chart Controls */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3} color={textColor}>
                    Chart Controls
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {['mean_pitch_hz', 'jitter_percent', 'shimmer_percent', 'sentiment_score'].map(metric => (
                      <Badge
                        key={metric}
                        colorScheme={visibleMetrics.includes(metric) ? 'blue' : 'gray'}
                        variant={visibleMetrics.includes(metric) ? 'solid' : 'outline'}
                        px={3}
                        py={1}
                        borderRadius="full"
                        cursor="pointer"
                        onClick={() => handleMetricToggle(metric)}
                        _hover={{ opacity: 0.8 }}
                      >
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                {/* Time Series Chart */}
                <TimeSeriesChart
                  data={completedAnalyses.map(analysis => analysis.results!).filter(Boolean)}
                  visibleMetrics={visibleMetrics}
                  height={500}
                  width={800}
                  onMetricHighlight={handleMetricHighlight}
                  onTimeRangeSelect={handleTimeRangeSelect}
                />

                {/* Time Range Info */}
                {selectedTimeRange && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Time Range Selected</AlertTitle>
                      <AlertDescription>
                        Showing data from {selectedTimeRange[0].toLocaleDateString()} to {selectedTimeRange[1].toLocaleDateString()}
                        <Button
                          size="sm"
                          variant="ghost"
                          ml={3}
                          onClick={() => handleTimeRangeSelect(null)}
                        >
                          Clear Selection
                        </Button>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* AI Summary Tab */}
            <TabPanel p={6}>
              <AISummary
                summary={aiSummary}
                analysisId={currentAnalysisId || 'latest'}
                onMetricHighlight={handleMetricHighlight}
              />
            </TabPanel>

            {/* Analysis History Tab */}
            <TabPanel p={6}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                  Recent Analyses
                </Text>
                
                {analysesList.map(analysis => (
                  <Box
                    key={analysis.id}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                    onClick={() => handleAnalysisSelect(analysis.id)}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color={textColor}>
                          Analysis #{analysis.id}
                        </Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      
                      <HStack spacing={3}>
                        <Badge
                          colorScheme={
                            analysis.status === 'completed' ? 'green' :
                            analysis.status === 'processing' ? 'yellow' :
                            analysis.status === 'failed' ? 'red' : 'gray'
                          }
                        >
                          {analysis.status}
                        </Badge>
                        
                        {analysis.status === 'completed' && analysis.results && (
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            Pitch: {analysis.results.mean_pitch_hz?.toFixed(1)} Hz
                          </Text>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            {/* Weekly Summary Tab */}
            <TabPanel p={6}>
              <WeeklySummary
                userId={userId}
                defaultPeriod={7}
                autoRefresh={true}
                onError={(error) => {
                  console.error('Weekly summary error:', error);
                }}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Current Analysis Details */}
      {currentAnalysis && (
        <Box bg={bgColor} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="md" color={textColor}>
                Analysis #{currentAnalysis.id} - Detailed Results
              </Heading>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentAnalysisId(null)}
                leftIcon={<FiX />}
              >
                Close
              </Button>
            </HStack>
            
            {/* Analysis Status and Basic Info */}
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Status</Text>
                <Badge
                  colorScheme={
                    currentAnalysis.status === 'completed' ? 'green' :
                    currentAnalysis.status === 'processing' ? 'yellow' :
                    currentAnalysis.status === 'failed' ? 'red' : 'gray'
                  }
                  variant="solid"
                >
                  {currentAnalysis.status}
                </Badge>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Created</Text>
                <Text fontWeight="semibold" color={textColor}>{new Date(currentAnalysis.createdAt).toLocaleString()}</Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>Analysis ID</Text>
                <Text fontWeight="semibold" color={textColor}>{currentAnalysis.id}</Text>
              </Box>
            </Grid>

            {/* Only show detailed results if analysis is completed */}
            {currentAnalysis.status === 'completed' && currentAnalysis.results && (
              <>
                <Divider />
                
                {/* Vocal Biomarkers Section */}
                <Box>
                  <Heading size="sm" color={textColor} mb={4}>
                    🎤 Vocal Biomarkers
                  </Heading>
                  
                  {/* Core Biomarker Values */}
                  <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={6}>
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Mean Pitch</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Fundamental frequency</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Jitter</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.jitter_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Frequency stability</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Shimmer</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.shimmer_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Amplitude stability</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>Pitch Range</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.pitch_range_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Frequency variation</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>HNR</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.mean_hnr_db?.toFixed(1) || 'N/A'} dB</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Harmonic-to-noise ratio</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel color={useColorModeValue('gray.600', 'gray.300')}>MFCC 1</StatLabel>
                      <StatNumber color={textColor}>{currentAnalysis.results.mfcc_1?.toFixed(3) || 'N/A'}</StatNumber>
                      <StatHelpText color={useColorModeValue('gray.500', 'gray.400')}>Mel-frequency cepstral</StatHelpText>
                    </Stat>
                  </Grid>

                  {/* Biomarker Visualization */}
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={3}>
                      Biomarker Health Indicators:
                    </Text>
                    <VStack spacing={3} align="stretch">
                      {currentAnalysis.results.jitter_percent && (
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Jitter (Lower is better)</Text>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>{currentAnalysis.results.jitter_percent.toFixed(2)}%</Text>
                          </HStack>
                          <Progress 
                            value={Math.min(currentAnalysis.results.jitter_percent * 100, 100)} 
                            colorScheme={currentAnalysis.results.jitter_percent < 1 ? 'green' : currentAnalysis.results.jitter_percent < 3 ? 'yellow' : 'red'}
                            size="sm"
                          />
                        </Box>
                      )}
                      
                      {currentAnalysis.results.shimmer_percent && (
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Shimmer (Lower is better)</Text>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>{currentAnalysis.results.shimmer_percent.toFixed(2)}%</Text>
                          </HStack>
                          <Progress 
                            value={Math.min(currentAnalysis.results.shimmer_percent * 100, 100)} 
                            colorScheme={currentAnalysis.results.shimmer_percent < 3 ? 'green' : currentAnalysis.results.shimmer_percent < 8 ? 'yellow' : 'red'}
                            size="sm"
                          />
                        </Box>
                      )}
                      
                      {currentAnalysis.results.mean_hnr_db && (
                        <Box>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>HNR (Higher is better)</Text>
                            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>{currentAnalysis.results.mean_hnr_db.toFixed(1)} dB</Text>
                          </HStack>
                          <Progress 
                            value={Math.min((currentAnalysis.results.mean_hnr_db / 20) * 100, 100)} 
                            colorScheme={currentAnalysis.results.mean_hnr_db > 15 ? 'green' : currentAnalysis.results.mean_hnr_db > 10 ? 'yellow' : 'red'}
                            size="sm"
                          />
                        </Box>
                      )}
                    </VStack>
                  </Box>
              </Box>
              
                <Divider />

                {/* Speech Analysis Section */}
                <Box>
                  <Heading size="sm" color={textColor} mb={4}>
                    🗣️ Speech Analysis
                  </Heading>
                  
                  {/* Transcript */}
                  {currentAnalysis.results.transcript_text && (
                    <Box mb={4}>
                      <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                        Transcript:
                      </Text>
                      <Box 
                        p={3} 
                        bg={useColorModeValue('gray.50', 'gray.700')} 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                      >
                        <Text fontSize="sm" color={useColorModeValue('gray.800', 'gray.200')}>
                          {currentAnalysis.results.transcript_text}
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {/* Sentiment Analysis */}
                  {currentAnalysis.results.sentiment_label && (
                    <Box mb={4}>
                      <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                        Sentiment Analysis:
                      </Text>
                      <HStack spacing={4}>
                        <Badge 
                          colorScheme={
                            currentAnalysis.results.sentiment_label === 'POSITIVE' ? 'green' :
                            currentAnalysis.results.sentiment_label === 'NEGATIVE' ? 'red' : 'gray'
                          } 
                          variant="solid"
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          {currentAnalysis.results.sentiment_label}
                        </Badge>
                        {currentAnalysis.results.sentiment_score && (
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            Confidence: {(currentAnalysis.results.sentiment_score * 100).toFixed(1)}%
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {/* AI Summary */}
                  {currentAnalysis.results.summary_text && (
                <Box>
                      <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                        AI Summary:
                      </Text>
                      <Box 
                        p={3} 
                        bg={useColorModeValue('blue.50', 'blue.900')} 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor={useColorModeValue('blue.200', 'blue.700')}
                      >
                        <Text fontSize="sm" color={useColorModeValue('blue.800', 'blue.200')}>
                          {currentAnalysis.results.summary_text}
                        </Text>
                      </Box>
                </Box>
              )}
                </Box>

                <Divider />

                {/* Action Buttons */}
                <HStack spacing={3} justify="center">
                  <Button
                    leftIcon={<FiDownload />}
                    variant="outline"
                    colorScheme="blue"
                    size="md"
                    onClick={() => {
                      const dataStr = JSON.stringify(currentAnalysis.results, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `analysis_${currentAnalysis.id}_results.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Results
                  </Button>
                  <Button
                    leftIcon={<FiEye />}
                    colorScheme="green"
                    size="md"
                    onClick={() => {
                      console.log('View Raw Data button clicked!');
                      console.log('Modal state:', { isRawDataOpen, onRawDataOpen, onRawDataClose });
                      console.log('Current analysis:', currentAnalysis);
                      onRawDataOpen();
                    }}
                  >
                    View Raw Data
                  </Button>
                  <Button
                    leftIcon={<FiTrendingUp />}
                    colorScheme="purple"
                    size="md"
                    onClick={handleViewEnhancedAnalysis}
                  >
                    Enhanced Analysis
                  </Button>
                </HStack>
              </>
            )}

            {/* Show message if analysis is not completed */}
            {currentAnalysis.status !== 'completed' && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  This analysis is still {currentAnalysis.status}. Detailed results will be available once processing is complete.
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </Box>
      )}

      {/* Raw Data Modal */}
      {currentAnalysis && (
        <Modal isOpen={isRawDataOpen} onClose={onRawDataClose} size="6xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>
              📊 Raw Analysis Data - Analysis #{currentAnalysis.id}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                  <Tab>Vocal Biomarkers</Tab>
                  <Tab>Speech Analysis</Tab>
                  <Tab>Raw JSON</Tab>
                  <Tab>Metadata</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Vocal Biomarkers Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md" color={textColor}>🎤 Vocal Biomarker Measurements</Heading>
                      
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th color={mutedColor}>Biomarker</Th>
                              <Th color={mutedColor}>Value</Th>
                              <Th color={mutedColor}>Unit</Th>
                              <Th color={mutedColor}>Health Status</Th>
                              <Th color={mutedColor}>Description</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Mean Pitch</Td>
                              <Td color={textColor}>{currentAnalysis.results?.mean_pitch_hz?.toFixed(1) || 'N/A'}</Td>
                              <Td color={mutedColor}>Hz</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">Fundamental</Badge>
                              </Td>
                              <Td color={mutedColor}>Average fundamental frequency of the voice</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Jitter</Td>
                              <Td color={textColor}>{currentAnalysis.results?.jitter_percent?.toFixed(3) || 'N/A'}</Td>
                              <Td color={mutedColor}>%</Td>
                              <Td>
                                <Badge 
                                  colorScheme={currentAnalysis.results?.jitter_percent && currentAnalysis.results.jitter_percent < 1.0 ? 'green' : 'red'} 
                                  variant="subtle"
                                >
                                  {currentAnalysis.results?.jitter_percent && currentAnalysis.results.jitter_percent < 1.0 ? 'Healthy' : 'High'}
                                </Badge>
                              </Td>
                              <Td color={mutedColor}>Frequency perturbation measure (lower is better)</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Shimmer</Td>
                              <Td color={textColor}>{currentAnalysis.results?.shimmer_percent?.toFixed(3) || 'N/A'}</Td>
                              <Td color={mutedColor}>%</Td>
                              <Td>
                                <Badge 
                                  colorScheme={currentAnalysis.results?.shimmer_percent && currentAnalysis.results.shimmer_percent < 3.0 ? 'green' : 'red'} 
                                  variant="subtle"
                                >
                                  {currentAnalysis.results?.shimmer_percent && currentAnalysis.results.shimmer_percent < 3.0 ? 'Healthy' : 'High'}
                                </Badge>
                              </Td>
                              <Td color={mutedColor}>Amplitude perturbation measure (lower is better)</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Pitch Range</Td>
                              <Td color={textColor}>{currentAnalysis.results?.pitch_range_hz?.toFixed(1) || 'N/A'}</Td>
                              <Td color={mutedColor}>Hz</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">Variation</Badge>
                              </Td>
                              <Td color={mutedColor}>Range of pitch variation during speech</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>HNR</Td>
                              <Td color={textColor}>{currentAnalysis.results?.mean_hnr_db?.toFixed(1) || 'N/A'}</Td>
                              <Td color={mutedColor}>dB</Td>
                              <Td>
                                <Badge 
                                  colorScheme={currentAnalysis.results?.mean_hnr_db && currentAnalysis.results.mean_hnr_db > 15 ? 'green' : 'red'} 
                                  variant="subtle"
                                >
                                  {currentAnalysis.results?.mean_hnr_db && currentAnalysis.results.mean_hnr_db > 15 ? 'Healthy' : 'Low'}
                                </Badge>
                              </Td>
                              <Td color={mutedColor}>Harmonics-to-noise ratio (higher is better)</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>MFCC 1</Td>
                              <Td color={textColor}>{currentAnalysis.results?.mfcc_1?.toFixed(4) || 'N/A'}</Td>
                              <Td color={mutedColor}>-</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">Feature</Badge>
                              </Td>
                              <Td color={mutedColor}>Mel-frequency cepstral coefficient 1</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </VStack>
                  </TabPanel>
                  
                  {/* Speech Analysis Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md" color={textColor}>🗣️ Speech Analysis Results</Heading>
                      
                      {/* Transcript */}
                      {currentAnalysis.results?.transcript_text && (
                        <Box>
                          <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={3}>
                            📝 Speech Transcript
                          </Text>
                          <Box 
                            p={4} 
                            bg={useColorModeValue('gray.50', 'gray.700')} 
                            borderRadius="md" 
                            border="1px solid" 
                            borderColor={borderColor}
                            maxH="200px"
                            overflowY="auto"
                          >
                            <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                              {currentAnalysis.results.transcript_text}
                            </Text>
                          </Box>
                        </Box>
                      )}
                      
                      {/* Sentiment Analysis */}
                      {currentAnalysis.results?.sentiment_label && (
                        <Box>
                          <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={3}>
                            😊 Sentiment Analysis
                          </Text>
                          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                            <Box p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                              <Text fontSize="sm" color={mutedColor}>Label</Text>
                              <Badge 
                                colorScheme={
                                  currentAnalysis.results.sentiment_label === 'POSITIVE' ? 'green' :
                                  currentAnalysis.results.sentiment_label === 'NEGATIVE' ? 'red' : 'gray'
                                } 
                                variant="solid"
                                fontSize="md"
                                px={3}
                                py={1}
                              >
                                {currentAnalysis.results.sentiment_label}
                              </Badge>
                            </Box>
                            <Box p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                              <Text fontSize="sm" color={mutedColor}>Confidence</Text>
                              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                {currentAnalysis.results?.sentiment_score ? (currentAnalysis.results.sentiment_score * 100).toFixed(1) : 'N/A'}%
                              </Text>
                            </Box>
                          </Grid>
                        </Box>
                      )}
                      
                      {/* AI Summary */}
                      {currentAnalysis.results?.summary_text && (
                        <Box>
                          <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={3}>
                            🤖 AI Summary
                          </Text>
                          <Box 
                            p={4} 
                            bg={useColorModeValue('green.50', 'green.900')} 
                            borderRadius="md" 
                            border="1px solid" 
                            borderColor={useColorModeValue('green.200', 'green.700')}
                            maxH="200px"
                            overflowY="auto"
                          >
                            <Text fontSize="sm" color={useColorModeValue('green.800', 'green.200')} whiteSpace="pre-wrap">
                              {currentAnalysis.results.summary_text}
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>
                  
                  {/* Raw JSON Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color={textColor}>🔧 Raw JSON Data</Heading>
                      <Box 
                        p={4} 
                        bg={useColorModeValue('gray.900', 'gray.100')} 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor={borderColor}
                        maxH="400px"
                        overflowY="auto"
                      >
                        <Code 
                          colorScheme="gray" 
                          variant="subtle" 
                          p={4} 
                          borderRadius="md"
                          fontSize="xs"
                          whiteSpace="pre-wrap"
                          display="block"
                        >
                          {JSON.stringify(currentAnalysis.results, null, 2)}
                        </Code>
                      </Box>
                    </VStack>
                  </TabPanel>
                  
                  {/* Metadata Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color={textColor}>📋 Analysis Metadata</Heading>
                      
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th color={mutedColor}>Property</Th>
                              <Th color={mutedColor}>Value</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Analysis ID</Td>
                              <Td color={textColor}>{currentAnalysis.id}</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Status</Td>
                              <Td>
                                <Badge 
                                  colorScheme={
                                    currentAnalysis.status === 'completed' ? 'green' :
                                    currentAnalysis.status === 'processing' ? 'yellow' :
                                    currentAnalysis.status === 'failed' ? 'red' : 'gray'
                                  }
                                >
                                  {currentAnalysis.status}
                                </Badge>
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Created At</Td>
                              <Td color={textColor}>{new Date(currentAnalysis.createdAt).toLocaleString()}</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Updated At</Td>
                              <Td color={textColor}>{new Date(currentAnalysis.updatedAt).toLocaleString()}</Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="semibold" color={textColor}>Processing Time</Td>
                              <Td color={textColor}>
                                {currentAnalysis.results ? 
                                  `${Math.round((new Date(currentAnalysis.updatedAt).getTime() - new Date(currentAnalysis.createdAt).getTime()) / 1000)}s` : 
                                  'N/A'
                                }
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={onRawDataClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </VStack>
  );
};


