import React, { useState } from 'react';
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
  Grid,
  GridItem,
  Progress,
  Divider,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Icon,
  Flex,
  Container,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiDownload, 
  FiShare2, 
  FiBarChart, 
  FiCpu,
  FiMic,
  FiTrendingUp,
  FiActivity,
  FiTarget,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import EnhancedAnalysisDashboard from '@/components/EnhancedAnalysisDashboard';
import VocalMetricsVisualization from '@/components/VocalMetricsVisualization';
import LinguisticAnalysisVisualization from '@/components/LinguisticAnalysisVisualization';

interface EnhancedAnalysisPageProps {
  userId: string;
}

// Sample enhanced analysis data for demonstration
const sampleEnhancedData = {
  // Enhanced Linguistic Analysis
  overall_sentiment: "POSITIVE",
  overall_sentiment_score: 0.85,
  emotions_breakdown: {
    joy: 3,
    surprise: 1,
    neutral: 1,
    fear: 1
  },
  dominant_emotion: "joy",
  emotion_confidence: 0.92,
  dialogue_acts_breakdown: {
    statement: 4,
    question: 1,
    agreement: 1
  },
  primary_dialogue_act: "statement",
  sentence_count: 6,
  sentence_analysis: [
    {
      text: "I am feeling really happy today!",
      sentiment: "POSITIVE",
      emotion: "joy",
      dialogue_act: "statement"
    },
    {
      text: "The weather is absolutely beautiful.",
      sentiment: "POSITIVE",
      emotion: "joy",
      dialogue_act: "statement"
    },
    {
      text: "I had an amazing conversation with my friend.",
      sentiment: "POSITIVE",
      emotion: "joy",
      dialogue_act: "statement"
    },
    {
      text: "However, I'm also a bit worried about my upcoming presentation.",
      sentiment: "NEGATIVE",
      emotion: "fear",
      dialogue_act: "statement"
    },
    {
      text: "What do you think about this approach?",
      sentiment: "NEUTRAL",
      emotion: "neutral",
      dialogue_act: "question"
    },
    {
      text: "I completely agree with your suggestion.",
      sentiment: "POSITIVE",
      emotion: "surprise",
      dialogue_act: "agreement"
    }
  ],
  
  // Enhanced Vocal Analysis
  mean_pitch_hz: 125.3,
  pitch_std_hz: 18.7,
  intensity_db: 67.2,
  jitter_local_percent: 0.9,
  jitter_rap_percent: 1.4,
  shimmer_local_percent: 2.3,
  shimmer_apq11_percent: 3.8,
  mean_hnr_db: 26.1,
  mean_f1_hz: 520.0,
  mean_f2_hz: 1550.0,
  mfcc_1_mean: -0.3,
  spectral_centroid_mean: 2100.0,
  spectral_bandwidth_mean: 1100.0,
  spectral_contrast_mean: 0.35,
  spectral_flatness_mean: 0.12,
  spectral_rolloff_mean: 4200.0,
  chroma_mean: 0.42,
  speech_rate_sps: 4.5,
  articulation_rate_sps: 5.3
};

const EnhancedAnalysisPage: React.FC<EnhancedAnalysisPageProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Preparing your enhanced analysis report for download...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleShare = () => {
    toast({
      title: 'Share Feature',
      description: 'Sharing functionality coming soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box bg={bgColor} borderRadius="xl" p={6}>
      {/* Header with Actions */}
      <VStack spacing={6} align="stretch" mb={8}>
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="xl" color={textColor}>
              Enhanced Analysis Dashboard
            </Heading>
            <Text color={mutedColor} fontSize="lg">
              Comprehensive vocal and linguistic biomarker analysis powered by AI
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<Icon as={FiUpload} />}
              colorScheme="blue"
              variant="outline"
              onClick={() => {}}
            >
              Upload New
            </Button>
            <Button
              leftIcon={<Icon as={FiDownload} />}
              colorScheme="green"
              variant="outline"
              onClick={handleExport}
            >
              Export Report
            </Button>
            <Button
              leftIcon={<Icon as={FiShare2} />}
              colorScheme="purple"
              variant="outline"
              onClick={handleShare}
            >
              Share
            </Button>
          </HStack>
        </Flex>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color={mutedColor}>Sentiment Score</StatLabel>
                <StatNumber color="green.500">
                  {(sampleEnhancedData.overall_sentiment_score * 100).toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Positive
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color={mutedColor}>Dominant Emotion</StatLabel>
                <StatNumber color="orange.500" textTransform="capitalize">
                  {sampleEnhancedData.dominant_emotion}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {sampleEnhancedData.emotion_confidence * 100}% confidence
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color={mutedColor}>Vocal Quality</StatLabel>
                <StatNumber color="blue.500">
                  {sampleEnhancedData.mean_hnr_db.toFixed(1)} dB
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Excellent HNR
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel color={mutedColor}>Speech Rate</StatLabel>
                <StatNumber color="purple.500">
                  {sampleEnhancedData.speech_rate_sps} sps
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Normal range
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>

      {/* Main Analysis Tabs */}
      <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>
            <Icon as={FiBarChart} mr={2} />
            Overview
          </Tab>
          <Tab>
            <Icon as={FiCpu} mr={2} />
            Linguistic Analysis
          </Tab>
          <Tab>
            <Icon as={FiMic} mr={2} />
            Vocal Analysis
          </Tab>
          <Tab>
            <Icon as={FiActivity} mr={2} />
            Sentence Details
          </Tab>
          <Tab>
            <Icon as={FiTrendingUp} mr={2} />
            Trends
          </Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <EnhancedAnalysisDashboard 
              data={sampleEnhancedData}
              userId={userId}
            />
          </TabPanel>

          {/* Linguistic Analysis Tab */}
          <TabPanel>
            <LinguisticAnalysisVisualization 
              data={sampleEnhancedData}
              userId={userId}
            />
          </TabPanel>

          {/* Vocal Analysis Tab */}
          <TabPanel>
            <VocalMetricsVisualization 
              data={sampleEnhancedData}
              userId={userId}
            />
          </TabPanel>

          {/* Sentence Details Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color={textColor}>
                Sentence-by-Sentence Analysis
              </Heading>
              
              {sampleEnhancedData.sentence_analysis.map((sentence, index) => (
                <Card key={index}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="lg" fontWeight="medium" color={textColor}>
                        "{sentence.text}"
                      </Text>
                      
                      <HStack spacing={4} wrap="wrap">
                        <Badge 
                          colorScheme={
                            sentence.sentiment === 'POSITIVE' ? 'green' : 
                            sentence.sentiment === 'NEGATIVE' ? 'red' : 'gray'
                          }
                          variant="subtle"
                        >
                          {sentence.sentiment}
                        </Badge>
                        
                        <Badge colorScheme="blue" variant="subtle">
                          {sentence.emotion}
                        </Badge>
                        
                        <Badge colorScheme="purple" variant="subtle">
                          {sentence.dialogue_act}
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </TabPanel>

          {/* Trends Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color={textColor}>
                Analysis Trends & Insights
              </Heading>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Trend Analysis Coming Soon!</AlertTitle>
                  <AlertDescription>
                    We're working on comprehensive trend analysis that will show your vocal and linguistic patterns over time.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md" color={textColor}>
                      <Icon as={FiTrendingUp} mr={2} />
                      Sentiment Trends
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Text color={mutedColor}>
                      Track your emotional communication patterns over time to identify long-term trends.
                    </Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Heading size="md" color={textColor}>
                      <Icon as={FiActivity} mr={2} />
                      Vocal Health Trends
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Text color={mutedColor}>
                      Monitor changes in your vocal biomarkers to track vocal health improvements.
                    </Text>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default EnhancedAnalysisPage;
