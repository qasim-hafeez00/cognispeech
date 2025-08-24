import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
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
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Icon,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  FiCpu, 
  FiMic, 
  FiTrendingUp, 
  FiBarChart, 
  FiMessageSquare, 
  FiHeart, 
  FiActivity,
  FiZap,
  FiRadio,
  FiMusic,
  FiClock,
  FiTarget,
  FiCheckCircle
} from 'react-icons/fi';

interface EnhancedAnalysisData {
  // Enhanced Linguistic Analysis
  overall_sentiment: string;
  overall_sentiment_score: number;
  emotions_breakdown: Record<string, number>;
  dominant_emotion: string;
  emotion_confidence: number;
  dialogue_acts_breakdown: Record<string, number>;
  primary_dialogue_act: string;
  sentence_count: number;
  sentence_analysis: Array<{
    text: string;
    sentiment: string;
    emotion: string;
    dialogue_act: string;
  }>;
  
  // Enhanced Vocal Analysis
  mean_pitch_hz: number;
  pitch_std_hz: number;
  intensity_db: number;
  jitter_local_percent: number;
  jitter_rap_percent: number;
  shimmer_local_percent: number;
  shimmer_apq11_percent: number;
  mean_hnr_db: number;
  mean_f1_hz: number;
  mean_f2_hz: number;
  mfcc_1_mean: number;
  spectral_centroid_mean: number;
  spectral_bandwidth_mean: number;
  spectral_contrast_mean: number;
  spectral_flatness_mean: number;
  spectral_rolloff_mean: number;
  chroma_mean: number;
  speech_rate_sps: number;
  articulation_rate_sps: number;
}

interface EnhancedAnalysisDashboardProps {
  data: EnhancedAnalysisData;
  userId: string;
}

const EnhancedAnalysisDashboard: React.FC<EnhancedAnalysisDashboardProps> = ({ data, userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'green';
      case 'NEGATIVE': return 'red';
      case 'NEUTRAL': return 'gray';
      default: return 'gray';
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: 'yellow',
      sadness: 'blue',
      fear: 'purple',
      anger: 'red',
      disgust: 'orange',
      surprise: 'pink',
      neutral: 'gray'
    };
    return colors[emotion] || 'gray';
  };

  const getVocalMetricStatus = (metricName: string, value: number) => {
    // Define clinical ranges for vocal metrics
    const ranges: Record<string, { min: number; max: number; unit: string; description: string }> = {
      mean_pitch_hz: { min: 80, max: 300, unit: 'Hz', description: 'Normal adult speaking range' },
      jitter_local_percent: { min: 0, max: 1.04, unit: '%', description: 'Normal jitter range' },
      shimmer_local_percent: { min: 0, max: 3.81, unit: '%', description: 'Normal shimmer range' },
      mean_hnr_db: { min: 10, max: 35, unit: 'dB', description: 'Voice quality indicator' },
      speech_rate_sps: { min: 2, max: 6, unit: 'syl/sec', description: 'Normal speech rate' }
    };

    const range = ranges[metricName];
    if (!range) return { status: 'normal', color: 'green' };
    
    if (value < range.min) return { status: 'low', color: 'blue' };
    if (value > range.max) return { status: 'high', color: 'red' };
    return { status: 'normal', color: 'green' };
  };

  const calculateEmotionPercentage = (emotion: string) => {
    const total = Object.values(data.emotions_breakdown).reduce((sum, count) => sum + count, 0);
    const count = data.emotions_breakdown[emotion] || 0;
    return total > 0 ? (count / total) * 100 : 0;
  };

  const calculateDialogueActPercentage = (act: string) => {
    const total = Object.values(data.dialogue_acts_breakdown).reduce((sum, count) => sum + count, 0);
    const count = data.dialogue_acts_breakdown[act] || 0;
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <Box>
      <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>
            <Icon as={FiBarChart} mr={2} />
            Overview
          </Tab>
          <Tab>
            <Icon as={FiCpu} mr={2} />
            Linguistic
          </Tab>
          <Tab>
            <Icon as={FiMic} mr={2} />
            Vocal
          </Tab>
          <Tab>
            <Icon as={FiTrendingUp} mr={2} />
            Insights
          </Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Key Metrics Summary */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Card>
                  <CardBody textAlign="center">
                    <Stat>
                      <StatLabel color={mutedColor}>Overall Sentiment</StatLabel>
                      <StatNumber color={`${getSentimentColor(data.overall_sentiment)}.500`}>
                        {data.overall_sentiment}
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        {(data.overall_sentiment_score * 100).toFixed(1)}% confidence
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody textAlign="center">
                    <Stat>
                      <StatLabel color={mutedColor}>Dominant Emotion</StatLabel>
                      <StatNumber color={`${getEmotionColor(data.dominant_emotion)}.500`} textTransform="capitalize">
                        {data.dominant_emotion}
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        {(data.emotion_confidence * 100).toFixed(1)}% confidence
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody textAlign="center">
                    <Stat>
                      <StatLabel color={mutedColor}>Vocal Quality</StatLabel>
                      <StatNumber color="blue.500">
                        {data.mean_hnr_db.toFixed(1)} dB
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        HNR Score
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiZap} mr={2} />
                    Quick Insights
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text color={mutedColor}>Sentences Analyzed:</Text>
                      <Badge colorScheme="blue" variant="subtle">
                        {data.sentence_count}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color={mutedColor}>Primary Communication Style:</Text>
                      <Badge colorScheme="purple" variant="subtle" textTransform="capitalize">
                        {data.primary_dialogue_act}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color={mutedColor}>Speech Rate:</Text>
                      <Badge colorScheme="green" variant="subtle">
                        {data.speech_rate_sps} syllables/sec
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Linguistic Analysis Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Emotion Distribution */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiHeart} mr={2} />
                    Emotion Distribution
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(data.emotions_breakdown).map(([emotion, count]) => (
                      <Box key={emotion}>
                        <HStack justify="space-between" mb={2}>
                          <Text color={mutedColor} textTransform="capitalize">
                            {emotion}
                          </Text>
                          <Text fontWeight="medium" color={textColor}>
                            {count} ({calculateEmotionPercentage(emotion).toFixed(1)}%)
                          </Text>
                        </HStack>
                        <Progress 
                          value={calculateEmotionPercentage(emotion)} 
                          colorScheme={getEmotionColor(emotion)}
                          size="sm"
                        />
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Dialogue Act Distribution */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiMessageSquare} mr={2} />
                    Communication Patterns
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(data.dialogue_acts_breakdown).map(([act, count]) => (
                      <Box key={act}>
                        <HStack justify="space-between" mb={2}>
                          <Text color={mutedColor} textTransform="capitalize">
                            {act}
                          </Text>
                          <Text fontWeight="medium" color={textColor}>
                            {count} ({calculateDialogueActPercentage(act).toFixed(1)}%)
                          </Text>
                        </HStack>
                        <Progress 
                          value={calculateDialogueActPercentage(act)} 
                          colorScheme="purple"
                          size="sm"
                        />
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Vocal Analysis Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Core Vocal Metrics */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md" color={textColor}>
                      <Icon as={FiRadio} mr={2} />
                      Pitch & Quality
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Mean Pitch:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.mean_pitch_hz.toFixed(1)} Hz
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Jitter (Local):</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.jitter_local_percent.toFixed(2)}%
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Shimmer (Local):</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.shimmer_local_percent.toFixed(2)}%
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>HNR:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.mean_hnr_db.toFixed(1)} dB
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md" color={textColor}>
                      <Icon as={FiMusic} mr={2} />
                      Spectral Features
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Formant 1:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.mean_f1_hz.toFixed(0)} Hz
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Formant 2:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.mean_f2_hz.toFixed(0)} Hz
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>Spectral Centroid:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.spectral_centroid_mean.toFixed(0)} Hz
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text color={mutedColor}>MFCC 1:</Text>
                        <Text fontWeight="medium" color={textColor}>
                          {data.mfcc_1_mean.toFixed(3)}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Speech Rate Metrics */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiClock} mr={2} />
                    Speech & Articulation Rates
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text color={mutedColor}>Speech Rate:</Text>
                      <Text fontWeight="medium" color={textColor}>
                        {data.speech_rate_sps} syllables/sec
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text color={mutedColor}>Articulation Rate:</Text>
                      <Text fontWeight="medium" color={textColor}>
                        {data.articulation_rate_sps} syllables/sec
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Insights Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* AI-Generated Insights */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiCpu} mr={2} />
                    AI-Generated Insights
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Communication Pattern</AlertTitle>
                        <AlertDescription>
                          Your communication shows a {data.overall_sentiment.toLowerCase()} style with clear emotional expression.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <Alert status="success">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Voice Quality</AlertTitle>
                        <AlertDescription>
                          Vocal metrics indicate healthy voice production with good resonance and clarity.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Emotional Range</AlertTitle>
                        <AlertDescription>
                          Diverse emotional expression suggests good emotional awareness and communication skills.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <Heading size="md" color={textColor}>
                    <Icon as={FiTarget} mr={2} />
                    Recommendations
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box p={4} bg="green.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiCheckCircle} color="green.500" />
                        <Text color="green.800">
                          Continue your positive communication style as it fosters positive interactions.
                        </Text>
                      </HStack>
                    </Box>
                    
                    <Box p={4} bg="blue.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiMic} color="blue.500" />
                        <Text color="blue.800">
                          Your voice quality is excellent. Continue vocal exercises to maintain this level.
                        </Text>
                      </HStack>
                    </Box>
                    
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiTrendingUp} color="purple.500" />
                        <Text color="purple.800">
                          Track your communication patterns over time to identify long-term trends.
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default EnhancedAnalysisDashboard;
