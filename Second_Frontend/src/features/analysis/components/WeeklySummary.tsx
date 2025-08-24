import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  useToast,
  Select,
  Divider,
  Progress,
  Grid,
  GridItem,
  Icon,
} from '@chakra-ui/react';
import { FiRefreshCw, FiCalendar, FiTrendingUp, FiBarChart, FiTrendingDown, FiActivity, FiHeart, FiZap } from 'react-icons/fi';
import { useAnalysisStore } from '@/store/analysis.store';

export interface WeeklySummaryProps {
  userId: string;
  defaultPeriod?: number;
  autoRefresh?: boolean;
  onError?: (error: string) => void;
}

/**
 * Enhanced WeeklySummary component that provides meaningful vocal health insights
 * Uses existing analysis data for fast loading and comprehensive insights
 */
export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  userId,
  defaultPeriod = 7,
  autoRefresh = false,
  onError,
}) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const { analyses } = useAnalysisStore();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Calculate date range
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    return { startDate, endDate };
  }, [period]);

  // Filter analyses for the selected period
  const periodAnalyses = useMemo(() => {
    if (!analyses || Object.keys(analyses).length === 0) return [];
    
    return Object.values(analyses)
      .filter(analysis => {
        const analysisDate = new Date(analysis.createdAt);
        return analysisDate >= dateRange.startDate && analysisDate <= dateRange.endDate;
      })
      .filter(analysis => analysis.status === 'completed' && analysis.results)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [analyses, dateRange]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    if (periodAnalyses.length === 0) return null;

    const completedAnalyses = periodAnalyses.filter(a => a.results);
    
    // Vocal biomarker averages
    const avgPitch = completedAnalyses.reduce((sum, a) => sum + (a.results?.mean_pitch_hz || 0), 0) / completedAnalyses.length;
    const avgJitter = completedAnalyses.reduce((sum, a) => sum + (a.results?.jitter_percent || 0), 0) / completedAnalyses.length;
    const avgShimmer = completedAnalyses.reduce((sum, a) => sum + (a.results?.shimmer_percent || 0), 0) / completedAnalyses.length;
    const avgHNR = completedAnalyses.reduce((sum, a) => sum + (a.results?.mean_hnr_db || 0), 0) / completedAnalyses.length;
    
    // Sentiment analysis
    const sentimentScores = completedAnalyses
      .map(a => a.results?.sentiment_score)
      .filter(score => score !== undefined) as number[];
    const avgSentiment = sentimentScores.length > 0 ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length : 0;
    
    // Trend analysis (comparing first half vs second half of period)
    const midPoint = Math.floor(completedAnalyses.length / 2);
    const firstHalf = completedAnalyses.slice(0, midPoint);
    const secondHalf = completedAnalyses.slice(midPoint);
    
    const firstHalfAvgPitch = firstHalf.reduce((sum, a) => sum + (a.results?.mean_pitch_hz || 0), 0) / Math.max(firstHalf.length, 1);
    const secondHalfAvgPitch = secondHalf.reduce((sum, a) => sum + (a.results?.mean_pitch_hz || 0), 0) / Math.max(secondHalf.length, 1);
    const pitchTrend = secondHalfAvgPitch > firstHalfAvgPitch ? 'improving' : 'declining';
    
    // Health indicators
    const healthyJitter = avgJitter < 1.0;
    const healthyShimmer = avgShimmer < 3.0;
    const healthyHNR = avgHNR > 15;
    
    return {
      totalAnalyses: periodAnalyses.length,
      completedAnalyses: completedAnalyses.length,
      avgPitch: Math.round(avgPitch),
      avgJitter: avgJitter.toFixed(2),
      avgShimmer: avgShimmer.toFixed(2),
      avgHNR: avgHNR.toFixed(1),
      avgSentiment: (avgSentiment * 100).toFixed(1),
      pitchTrend,
      healthScore: Math.round(
        (healthyJitter ? 25 : 0) + 
        (healthyShimmer ? 25 : 0) + 
        (healthyHNR ? 25 : 0) + 
        (avgSentiment > 0.6 ? 25 : 0)
      ),
      recommendations: []
    };
  }, [periodAnalyses]);

  // Generate health recommendations
  const recommendations = useMemo(() => {
    if (!statistics) return [];
    
    const recs = [];
    
    if (parseFloat(statistics.avgJitter) > 1.0) {
      recs.push('Consider vocal exercises to reduce frequency perturbation');
    }
    if (parseFloat(statistics.avgShimmer) > 3.0) {
      recs.push('Practice breathing exercises for better amplitude stability');
    }
    if (parseFloat(statistics.avgHNR) < 15) {
      recs.push('Stay hydrated and avoid vocal strain for better harmonics');
    }
    if (parseFloat(statistics.avgSentiment) < 60) {
      recs.push('Consider stress management techniques for vocal health');
    }
    
    if (recs.length === 0) {
      recs.push('Excellent vocal health! Keep maintaining your current routine');
    }
    
    return recs;
  }, [statistics]);

  // Handle period change
  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh by updating the store
    setTimeout(() => setIsLoading(false), 500);
    
    toast({
      title: 'Refreshing summary',
      description: 'Updated with latest analysis data',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Just update the view without API calls
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Render loading state
  const renderLoading = () => (
    <Card bg={bgColor} borderColor={borderColor}>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" color={textColor}>
            Weekly Summary
          </Heading>
          <Spinner size="sm" color={accentColor} />
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Box h="20px" bg={useColorModeValue('gray.200', 'gray.600')} borderRadius="md" />
          <Box h="60px" bg={useColorModeValue('gray.200', 'gray.600')} borderRadius="md" />
          <Box h="40px" bg={useColorModeValue('gray.200', 'gray.600')} borderRadius="md" />
        </VStack>
      </CardBody>
    </Card>
  );

  // Render no data state
  const renderNoData = () => (
    <Card bg={bgColor} borderColor={borderColor}>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" color={textColor}>
            Weekly Summary
          </Heading>
          <HStack spacing={2}>
            <Select
              size="sm"
              value={period}
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
              w="auto"
              variant="outline"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </Select>
            
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            isLoading={isLoading}
              colorScheme="blue"
          >
              Refresh
          </Button>
          </HStack>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="center" textAlign="center">
          <Icon as={FiBarChart} boxSize={16} color={mutedColor} />
          <Box>
            <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={2}>
              No Analysis Data Available
            </Text>
            <Text color={mutedColor}>
              Complete your first vocal analysis to see weekly insights and trends.
            </Text>
          </Box>
          <Text fontSize="sm" color={mutedColor}>
            Period: {period} days • {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );

  // Render comprehensive summary
  const renderSummary = () => {
    if (!statistics) return renderNoData();

    return (
      <Card bg={bgColor} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Heading size="md" color={textColor}>
                Weekly Summary
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme="blue" variant="subtle">
                  <HStack spacing={1}>
                    <FiCalendar size={12} />
                    <Text>{period} days</Text>
                  </HStack>
                </Badge>
                <Badge colorScheme="green" variant="subtle">
                  <HStack spacing={1}>
                    <FiBarChart size={12} />
                    <Text>{statistics.completedAnalyses} analyses</Text>
                  </HStack>
                </Badge>
                <Badge colorScheme={statistics.healthScore > 75 ? 'green' : statistics.healthScore > 50 ? 'yellow' : 'red'} variant="solid">
                  <HStack spacing={1}>
                    <FiHeart size={12} />
                    <Text>{statistics.healthScore}% Health</Text>
                  </HStack>
                </Badge>
              </HStack>
            </VStack>
            
            <HStack spacing={2}>
              <Select
                size="sm"
                value={period}
                onChange={(e) => handlePeriodChange(Number(e.target.value))}
                w="auto"
                variant="outline"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </Select>
              
              <Button
                leftIcon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                isLoading={isLoading}
                colorScheme="blue"
              >
                Refresh
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Health Score Overview */}
            <Box textAlign="center" p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg">
              <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('blue.800', 'blue.200')} mb={2}>
                🎯 Overall Vocal Health Score
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color={useColorModeValue('blue.600', 'blue.300')}>
                {statistics.healthScore}%
              </Text>
              <Progress 
                value={statistics.healthScore} 
                colorScheme={statistics.healthScore > 75 ? 'green' : statistics.healthScore > 50 ? 'yellow' : 'red'}
                size="lg"
                borderRadius="full"
                mt={2}
              />
            </Box>

            {/* Key Metrics Grid */}
            <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Avg Pitch</StatLabel>
                <StatNumber color={textColor}>{statistics.avgPitch} Hz</StatNumber>
                <StatHelpText color={mutedColor}>
                  <HStack spacing={1} justify="center">
                    <Icon as={statistics.pitchTrend === 'improving' ? FiTrendingUp : FiTrendingDown} />
                    <Text>{statistics.pitchTrend}</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Avg Jitter</StatLabel>
                <StatNumber color={textColor}>{statistics.avgJitter}%</StatNumber>
                <StatHelpText color={mutedColor}>
                  <Text>{parseFloat(statistics.avgJitter) < 1.0 ? '✅ Healthy' : '⚠️ High'}</Text>
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Avg Shimmer</StatLabel>
                <StatNumber color={textColor}>{statistics.avgShimmer}%</StatNumber>
                <StatHelpText color={mutedColor}>
                  <Text>{parseFloat(statistics.avgShimmer) < 3.0 ? '✅ Healthy' : '⚠️ High'}</Text>
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Avg HNR</StatLabel>
                <StatNumber color={textColor}>{statistics.avgHNR} dB</StatNumber>
                <StatHelpText color={mutedColor}>
                  <Text>{parseFloat(statistics.avgHNR) > 15 ? '✅ Healthy' : '⚠️ Low'}</Text>
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Sentiment</StatLabel>
                <StatNumber color={textColor}>{statistics.avgSentiment}%</StatNumber>
                <StatHelpText color={mutedColor}>
                  <Text>Emotional tone</Text>
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color={mutedColor}>Analyses</StatLabel>
                <StatNumber color={textColor}>{statistics.totalAnalyses}</StatNumber>
                <StatHelpText color={mutedColor}>
                  <Text>Total recordings</Text>
                </StatHelpText>
              </Stat>
            </Grid>
            
            <Divider />
            
            {/* Health Recommendations */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={3}>
                💡 Health Recommendations
              </Text>
              <VStack spacing={3} align="stretch">
                {recommendations.map((rec, index) => (
                  <Box 
                    key={index}
                    p={3} 
                    bg={useColorModeValue('green.50', 'green.900')} 
                    borderRadius="md" 
                    border="1px solid" 
                    borderColor={useColorModeValue('green.200', 'green.700')}
                  >
                    <Text fontSize="sm" color={useColorModeValue('green.800', 'green.200')}>
                      {rec}
              </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
            
            {/* Period Info */}
            <Box textAlign="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <Text fontSize="sm" color={mutedColor}>
                📅 Analysis Period: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
              </Text>
              <Text fontSize="xs" color={mutedColor} mt={1}>
                Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Main render logic
  if (isLoading && !statistics) {
    return renderLoading();
  }

  return renderSummary();
};

export default WeeklySummary;
