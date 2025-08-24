import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { 
  FiCpu, 
  FiMessageSquare, 
  FiHeart, 
  FiTrendingUp, 
  FiBarChart, 
  FiActivity,
  FiZap,
  FiTarget,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo
} from 'react-icons/fi';

interface LinguisticAnalysisData {
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
}

interface LinguisticAnalysisVisualizationProps {
  data: LinguisticAnalysisData;
  userId: string;
}

const LinguisticAnalysisVisualization: React.FC<LinguisticAnalysisVisualizationProps> = ({ data, userId }) => {
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

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, any> = {
      joy: FiHeart,
      sadness: FiActivity,
      fear: FiAlertTriangle,
      anger: FiZap,
      disgust: FiInfo,
      surprise: FiTarget,
      neutral: FiBarChart
    };
    return icons[emotion] || FiBarChart;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return FiCheckCircle;
      case 'NEGATIVE': return FiAlertTriangle;
      case 'NEUTRAL': return FiInfo;
      default: return FiInfo;
    }
  };

  const getDialogueActIcon = (act: string) => {
    const icons: Record<string, any> = {
      statement: FiMessageSquare,
      question: FiTarget,
      agreement: FiCheckCircle,
      disagreement: FiAlertTriangle,
      greeting: FiHeart,
      farewell: FiActivity,
      request: FiZap
    };
    return icons[act] || FiMessageSquare;
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

  const getCommunicationStyle = () => {
    const sentimentScore = data.overall_sentiment_score;
    const emotionCount = Object.keys(data.emotions_breakdown).length;
    
    if (sentimentScore > 0.7 && emotionCount > 3) {
      return { style: 'Expressive & Positive', description: 'You communicate with enthusiasm and emotional clarity' };
    } else if (sentimentScore > 0.5) {
      return { style: 'Balanced & Clear', description: 'Your communication is well-balanced and understandable' };
    } else {
      return { style: 'Reserved & Thoughtful', description: 'You communicate with careful consideration and reflection' };
    }
  };

  const getInsights = () => {
    const insights = [];
    
    if (data.overall_sentiment_score > 0.8) {
      insights.push('Your communication shows strong positive sentiment, indicating optimism and enthusiasm.');
    }
    
    if (Object.keys(data.emotions_breakdown).length > 4) {
      insights.push('You display a wide range of emotions, suggesting good emotional awareness and expression.');
    }
    
    if ((data.dialogue_acts_breakdown.statement || 0) > 3) {
      insights.push('You tend to make clear statements, showing confidence in your communication.');
    }
    
    if ((data.dialogue_acts_breakdown.question || 0) > 0) {
      insights.push('You ask questions, indicating engagement and interest in dialogue.');
    }
    
    return insights.length > 0 ? insights : ['Your communication patterns show a balanced and effective approach.'];
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" color={textColor} mb={2}>
            Advanced Linguistic Analysis
          </Heading>
          <Text color={mutedColor}>
            AI-powered analysis of sentiment, emotions, and communication patterns
          </Text>
        </Box>

        {/* Overall Sentiment Analysis */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={getSentimentIcon(data.overall_sentiment)} mr={2} color={`${getSentimentColor(data.overall_sentiment)}.500`} />
              Overall Sentiment Analysis
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text color={mutedColor}>Sentiment:</Text>
                <Badge 
                  colorScheme={getSentimentColor(data.overall_sentiment)} 
                  variant="solid"
                  fontSize="md"
                  px={3}
                  py={1}
                >
                  {data.overall_sentiment}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text color={mutedColor}>Confidence Score:</Text>
                <Text fontWeight="medium" color={textColor}>
                  {(data.overall_sentiment_score * 100).toFixed(1)}%
                </Text>
              </HStack>
              
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color={mutedColor}>Sentiment Strength</Text>
                  <Text fontSize="sm" color={mutedColor}>
                    {(data.overall_sentiment_score * 100).toFixed(1)}%
                  </Text>
                </HStack>
                <Progress 
                  value={data.overall_sentiment_score * 100} 
                  colorScheme={getSentimentColor(data.overall_sentiment)}
                  size="lg"
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Emotion Distribution */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={FiHeart} mr={2} color="pink.500" />
              Emotion Distribution Analysis
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" mb={2}>
                <Text color={mutedColor}>Dominant Emotion:</Text>
                <Badge 
                  colorScheme={getEmotionColor(data.dominant_emotion)} 
                  variant="solid"
                  textTransform="capitalize"
                >
                  {data.dominant_emotion}
                </Badge>
              </HStack>
              
              <HStack justify="space-between" mb={2}>
                <Text color={mutedColor}>Emotion Confidence:</Text>
                <Text fontWeight="medium" color={textColor}>
                  {(data.emotion_confidence * 100).toFixed(1)}%
                </Text>
              </HStack>
              
              <Divider />
              
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                Emotion Breakdown:
              </Text>
              
              {Object.entries(data.emotions_breakdown).map(([emotion, count]) => (
                <Box key={emotion}>
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Icon as={getEmotionIcon(emotion)} color={`${getEmotionColor(emotion)}.500`} />
                      <Text color={mutedColor} textTransform="capitalize">
                        {emotion}
                      </Text>
                    </HStack>
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

        {/* Dialogue Act Analysis */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={FiMessageSquare} mr={2} color="blue.500" />
              Communication Pattern Analysis
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" mb={2}>
                <Text color={mutedColor}>Primary Style:</Text>
                <Badge 
                  colorScheme="purple" 
                  variant="solid"
                  textTransform="capitalize"
                >
                  {data.primary_dialogue_act}
                </Badge>
              </HStack>
              
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                Dialogue Act Distribution:
              </Text>
              
              {Object.entries(data.dialogue_acts_breakdown).map(([act, count]) => (
                <Box key={act}>
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Icon as={getDialogueActIcon(act)} color="purple.500" />
                      <Text color={mutedColor} textTransform="capitalize">
                        {act}
                      </Text>
                    </HStack>
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

        {/* Communication Style Analysis */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={FiCpu} mr={2} color="indigo.500" />
              Communication Style Analysis
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box p={4} bg="blue.50" borderRadius="md">
                <HStack>
                  <Icon as={FiTarget} color="blue.500" />
                  <Text color="blue.800" fontWeight="medium">
                    {getCommunicationStyle().style}
                  </Text>
                </HStack>
                <Text color="blue.700" fontSize="sm" mt={2}>
                  {getCommunicationStyle().description}
                </Text>
              </Box>
              
              <Divider />
              
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                Key Insights:
              </Text>
              
              {getInsights().map((insight, index) => (
                <Box key={index} p={3} bg="gray.50" borderRadius="md">
                  <HStack>
                    <Icon as={FiCheckCircle} color="green.500" />
                    <Text color="gray.700" fontSize="sm">
                      {insight}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Sentence Analysis Summary */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={FiBarChart} mr={2} color="teal.500" />
              Sentence Analysis Summary
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat>
                <StatLabel color={mutedColor}>Total Sentences</StatLabel>
                <StatNumber color="blue.500">
                  {data.sentence_count}
                </StatNumber>
                <StatHelpText>Analyzed for patterns</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedColor}>Emotions Detected</StatLabel>
                <StatNumber color="pink.500">
                  {Object.keys(data.emotions_breakdown).length}
                </StatNumber>
                <StatHelpText>Emotional range</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedColor}>Communication Acts</StatLabel>
                <StatNumber color="purple.500">
                  {Object.keys(data.dialogue_acts_breakdown).length}
                </StatNumber>
                <StatHelpText>Interaction patterns</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default LinguisticAnalysisVisualization;
