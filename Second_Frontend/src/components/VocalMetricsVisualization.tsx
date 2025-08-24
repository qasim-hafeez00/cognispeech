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
} from '@chakra-ui/react';
import { 
  FiRadio, 
  FiActivity, 
  FiBarChart, 
  FiMusic, 
  FiTrendingUp, 
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';

interface VocalMetricsData {
  // Core Pitch Metrics
  mean_pitch_hz: number;
  pitch_std_hz: number;
  intensity_db: number;
  
  // Jitter Metrics
  jitter_local_percent: number;
  jitter_rap_percent: number;
  
  // Shimmer Metrics
  shimmer_local_percent: number;
  shimmer_apq11_percent: number;
  
  // Voice Quality Metrics
  mean_hnr_db: number;
  mean_f1_hz: number;
  mean_f2_hz: number;
  
  // Spectral Features
  mfcc_1_mean: number;
  spectral_centroid_mean: number;
  spectral_bandwidth_mean: number;
  spectral_contrast_mean: number;
  spectral_flatness_mean: number;
  spectral_rolloff_mean: number;
  chroma_mean: number;
  
  // Speech Rate Metrics
  speech_rate_sps: number;
  articulation_rate_sps: number;
}

interface VocalMetricsVisualizationProps {
  data: VocalMetricsData;
  userId: string;
}

const VocalMetricsVisualization: React.FC<VocalMetricsVisualizationProps> = ({ data, userId }) => {
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Clinical ranges and descriptions for vocal metrics
  const metricInfo: Record<string, {
    name: string;
    unit: string;
    normalRange: { min: number; max: number };
    description: string;
    clinicalSignificance: string;
    category: 'pitch' | 'quality' | 'spectral' | 'rate';
  }> = {
    mean_pitch_hz: {
      name: 'Mean Pitch',
      unit: 'Hz',
      normalRange: { min: 80, max: 300 },
      description: 'Average fundamental frequency of the voice',
      clinicalSignificance: 'Indicates vocal register and age-related changes',
      category: 'pitch'
    },
    pitch_std_hz: {
      name: 'Pitch Standard Deviation',
      unit: 'Hz',
      normalRange: { min: 10, max: 50 },
      description: 'Variability in pitch during speech',
      clinicalSignificance: 'Higher values suggest emotional expression or vocal instability',
      category: 'pitch'
    },
    intensity_db: {
      name: 'Voice Intensity',
      unit: 'dB',
      normalRange: { min: 50, max: 80 },
      description: 'Average loudness of the voice',
      clinicalSignificance: 'Indicates vocal effort and respiratory support',
      category: 'pitch'
    },
    jitter_local_percent: {
      name: 'Local Jitter',
      unit: '%',
      normalRange: { min: 0, max: 1.04 },
      description: 'Cycle-to-cycle variation in frequency',
      clinicalSignificance: 'Normal range indicates healthy vocal fold vibration',
      category: 'quality'
    },
    jitter_rap_percent: {
      name: 'RAP Jitter',
      unit: '%',
      normalRange: { min: 0, max: 1.56 },
      description: 'Relative Average Perturbation of frequency',
      clinicalSignificance: 'Alternative measure of frequency stability',
      category: 'quality'
    },
    shimmer_local_percent: {
      name: 'Local Shimmer',
      unit: '%',
      normalRange: { min: 0, max: 3.81 },
      description: 'Cycle-to-cycle variation in amplitude',
      clinicalSignificance: 'Normal range indicates consistent vocal fold closure',
      category: 'quality'
    },
    shimmer_apq11_percent: {
      name: 'APQ11 Shimmer',
      unit: '%',
      normalRange: { min: 0, max: 5.62 },
      description: 'Amplitude Perturbation Quotient (11-point)',
      clinicalSignificance: 'Comprehensive measure of amplitude stability',
      category: 'quality'
    },
    mean_hnr_db: {
      name: 'Harmonic-to-Noise Ratio',
      unit: 'dB',
      normalRange: { min: 10, max: 35 },
      description: 'Ratio of harmonic to noise components',
      clinicalSignificance: 'Higher values indicate clearer, more resonant voice',
      category: 'quality'
    },
    mean_f1_hz: {
      name: 'Formant 1',
      unit: 'Hz',
      normalRange: { min: 200, max: 800 },
      description: 'First formant frequency',
      clinicalSignificance: 'Indicates vocal tract configuration and vowel production',
      category: 'spectral'
    },
    mean_f2_hz: {
      name: 'Formant 2',
      unit: 'Hz',
      normalRange: { min: 800, max: 2500 },
      description: 'Second formant frequency',
      clinicalSignificance: 'Further characterizes vowel production and articulation',
      category: 'spectral'
    },
    mfcc_1_mean: {
      name: 'MFCC 1',
      unit: '',
      normalRange: { min: -2, max: 2 },
      description: 'First Mel-frequency cepstral coefficient',
      clinicalSignificance: 'Represents overall spectral shape and voice characteristics',
      category: 'spectral'
    },
    spectral_centroid_mean: {
      name: 'Spectral Centroid',
      unit: 'Hz',
      normalRange: { min: 1000, max: 4000 },
      description: 'Center of mass of the spectrum',
      clinicalSignificance: 'Indicates brightness and energy distribution of voice',
      category: 'spectral'
    },
    spectral_bandwidth_mean: {
      name: 'Spectral Bandwidth',
      unit: 'Hz',
      normalRange: { min: 500, max: 2000 },
      description: 'Spread of the spectrum around the centroid',
      clinicalSignificance: 'Indicates spectral complexity and voice richness',
      category: 'spectral'
    },
    spectral_contrast_mean: {
      name: 'Spectral Contrast',
      unit: '',
      normalRange: { min: 0, max: 1 },
      description: 'Contrast between spectral peaks and valleys',
      clinicalSignificance: 'Higher values indicate more distinct spectral features',
      category: 'spectral'
    },
    spectral_flatness_mean: {
      name: 'Spectral Flatness',
      unit: '',
      normalRange: { min: 0, max: 1 },
      description: 'Measure of spectral uniformity',
      clinicalSignificance: 'Lower values indicate more tonal, less noisy voice',
      category: 'spectral'
    },
    spectral_rolloff_mean: {
      name: 'Spectral Rolloff',
      unit: 'Hz',
      normalRange: { min: 2000, max: 8000 },
      description: 'Frequency below which 85% of energy is contained',
      clinicalSignificance: 'Indicates upper frequency limit of voice energy',
      category: 'spectral'
    },
    chroma_mean: {
      name: 'Chroma Features',
      unit: '',
      normalRange: { min: 0, max: 1 },
      description: 'Pitch class distribution features',
      clinicalSignificance: 'Represents musical characteristics of voice',
      category: 'spectral'
    },
    speech_rate_sps: {
      name: 'Speech Rate',
      unit: 'syllables/sec',
      normalRange: { min: 2, max: 6 },
      description: 'Number of syllables produced per second',
      clinicalSignificance: 'Normal range indicates appropriate speaking pace',
      category: 'rate'
    },
    articulation_rate_sps: {
      name: 'Articulation Rate',
      unit: 'syllables/sec',
      normalRange: { min: 3, max: 7 },
      description: 'Speech rate excluding pauses',
      clinicalSignificance: 'Indicates pure articulation speed and clarity',
      category: 'rate'
    }
  };

  const getMetricStatus = (metricName: string, value: number) => {
    const info = metricInfo[metricName];
    if (!info) return { status: 'normal', color: 'green' };
    
    const { min, max } = info.normalRange;
    if (value < min) return { status: 'low', color: 'blue' };
    if (value > max) return { status: 'high', color: 'red' };
    return { status: 'normal', color: 'green' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pitch': return FiRadio;
      case 'quality': return FiActivity;
      case 'spectral': return FiMusic;
      case 'rate': return FiClock;
      default: return FiBarChart;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pitch': return 'blue';
      case 'quality': return 'green';
      case 'spectral': return 'purple';
      case 'rate': return 'orange';
      default: return 'gray';
    }
  };

  const renderMetricCard = (metricName: string, value: number) => {
    const info = metricInfo[metricName];
    if (!info) return null;

    const { status, color } = getMetricStatus(metricName, value);
    const IconComponent = getCategoryIcon(info.category);
    const categoryColor = getCategoryColor(info.category);

    return (
      <Card key={metricName} size="sm">
        <CardHeader pb={2}>
          <HStack spacing={2}>
            <Icon as={IconComponent} color={`${categoryColor}.500`} />
            <Heading size="sm" color={textColor}>
              {info.name}
            </Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
                {value.toFixed(info.unit === 'Hz' ? 1 : info.unit === '%' ? 2 : 3)}
              </Text>
              <Text color={mutedColor} fontSize="sm">
                {info.unit}
              </Text>
            </HStack>
            
            <Badge 
              colorScheme={color} 
              variant="subtle" 
              alignSelf="start"
              textTransform="capitalize"
            >
              {status}
            </Badge>
            
            <Text fontSize="sm" color={mutedColor}>
              {info.description}
            </Text>
            
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color={mutedColor}>Normal Range:</Text>
                <Text fontSize="xs" color={mutedColor}>
                  {info.normalRange.min} - {info.normalRange.max} {info.unit}
                </Text>
              </HStack>
              <Progress 
                value={Math.min(((value - info.normalRange.min) / (info.normalRange.max - info.normalRange.min)) * 100, 100)} 
                colorScheme={color}
                size="sm"
              />
            </Box>
            
            <Text fontSize="xs" color={mutedColor} fontStyle="italic">
              {info.clinicalSignificance}
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const categories = ['pitch', 'quality', 'spectral', 'rate'];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" color={textColor} mb={2}>
            Comprehensive Vocal Biomarker Analysis
          </Heading>
          <Text color={mutedColor}>
            Detailed analysis of 20+ vocal metrics with clinical significance
          </Text>
        </Box>

        {/* Category-based Metrics Display */}
        {categories.map(category => (
          <Box key={category}>
            <Heading size="md" color={textColor} mb={4} textTransform="capitalize">
              <Icon as={getCategoryIcon(category)} mr={2} color={`${getCategoryColor(category)}.500`} />
              {category} Metrics
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {Object.entries(data)
                .filter(([key]) => metricInfo[key]?.category === category)
                .map(([key, value]) => renderMetricCard(key, value))}
            </SimpleGrid>
          </Box>
        ))}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              <Icon as={FiBarChart} mr={2} />
              Summary Statistics
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat>
                <StatLabel color={mutedColor}>Metrics Analyzed</StatLabel>
                <StatNumber color="blue.500">
                  {Object.keys(metricInfo).length}
                </StatNumber>
                <StatHelpText>Comprehensive vocal analysis</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedColor}>Normal Range</StatLabel>
                <StatNumber color="green.500">
                  {Object.entries(data).filter(([key, value]) => {
                    const status = getMetricStatus(key, value);
                    return status.status === 'normal';
                  }).length}
                </StatNumber>
                <StatHelpText>Within clinical norms</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedColor}>Attention Needed</StatLabel>
                <StatNumber color="orange.500">
                  {Object.entries(data).filter(([key, value]) => {
                    const status = getMetricStatus(key, value);
                    return status.status !== 'normal';
                  }).length}
                </StatNumber>
                <StatHelpText>Outside normal range</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default VocalMetricsVisualization;
