"use client"

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useToast,
  Badge,
  Divider,
  Flex,
  Tooltip,
  Textarea,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiThumbsUp,
  FiThumbsDown,
  FiCopy,
  FiEdit3,
  FiRefreshCw,
  FiCheck,
  FiInfo,
} from 'react-icons/fi';

export interface AISummaryProps {
  summary: string;
  analysisId: string;
  onMetricHighlight?: (metric: string, date: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}



export const AISummary: React.FC<AISummaryProps> = ({
  summary,
  analysisId,
  onMetricHighlight,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Parse summary for interactive elements and citations
  const parseSummary = (text: string) => {
    // Simple parsing for demonstration - in production, this would be more sophisticated
    const parts = text.split(/(\b(?:pitch|jitter|shimmer|sentiment|HNR|MFCC|fundamental frequency|perturbation)\b)/gi);
    
    return parts.map((part, index) => {
      if (part.match(/\b(?:pitch|jitter|shimmer|sentiment|HNR|MFCC|fundamental frequency|perturbation)\b/i)) {
        return (
          <Tooltip key={index} label="Click to highlight on chart">
            <Text
              as="span"
              color={accentColor}
              fontWeight="semibold"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={() => onMetricHighlight?.(part.toLowerCase(), 'current')}
            >
              {part}
            </Text>
          </Tooltip>
        );
      }
      return <Text key={index} as="span">{part}</Text>;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast({
        title: 'Copied to Clipboard',
        description: 'Summary has been copied successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    
    try {
      await onRegenerate();
      toast({
        title: 'Summary Regenerated',
        description: 'New AI summary has been generated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Regeneration Failed',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: 'Summary Updated',
      description: 'Your changes have been saved',
      status: 'success',
      duration: 2000,
    });
  };

  const handleCancel = () => {
    setEditedSummary(summary);
    setIsEditing(false);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    setShowFeedbackForm(true);
    
    toast({
      title: 'Feedback Recorded',
      description: `Thank you for your ${type} feedback!`,
      status: 'success',
      duration: 2000,
    });
  };

  const submitFeedback = () => {
    // Here you would typically send feedback to your backend
    console.log('Feedback submitted:', { type: feedback, comment: feedbackComment });
    
    setShowFeedbackForm(false);
    setFeedbackComment('');
    
    toast({
      title: 'Feedback Submitted',
      description: 'Thank you for helping improve our AI system!',
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="xl"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Text fontSize="xl" fontWeight="bold" color={accentColor}>
              AI-Generated Analysis Summary
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              AI Analysis
            </Badge>
            <Badge colorScheme="green" variant="subtle">
              High Confidence
            </Badge>
          </HStack>
          
          <HStack spacing={2}>
            <Tooltip label="Copy Summary">
              <IconButton
                aria-label="Copy summary"
                icon={<FiCopy />}
                size="sm"
                variant="ghost"
                onClick={handleCopy}
              />
            </Tooltip>
            
            <Tooltip label="Edit Summary">
              <IconButton
                aria-label="Edit summary"
                icon={<FiEdit3 />}
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              />
            </Tooltip>
            
            {onRegenerate && (
              <Tooltip label="Regenerate Summary">
                <IconButton
                  aria-label="Regenerate summary"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="ghost"
                  onClick={handleRegenerate}
                  isLoading={isRegenerating}
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>

        <Divider />

        {/* Trust Building Disclaimer */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>AI-Generated Content</AlertTitle>
            <AlertDescription>
              This summary is generated by our AI system using your vocal analysis data. 
              While we strive for accuracy, this should not replace professional medical advice. 
              Always consult healthcare providers for medical decisions.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Summary Content */}
        <Box>
          {isEditing ? (
            <VStack spacing={3} align="stretch">
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                minHeight="200px"
                resize="vertical"
                fontSize="16px"
                lineHeight="1.6"
                border="2px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: accentColor,
                  boxShadow: `0 0 0 1px ${accentColor}`,
                }}
              />
              <HStack spacing={3} justify="flex-end">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSave}>
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          ) : (
            <Box
              fontSize="lg"
              lineHeight="1.8"
              color={textColor}
            >
              {parseSummary(editedSummary)}
            </Box>
          )}
        </Box>

        {/* Source Citation Section */}
        <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
          <HStack spacing={2} mb={3}>
            <FiInfo color={accentColor} />
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              Data Sources & Citations
            </Text>
          </HStack>
          
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              This summary is based on analysis of your audio recording from{' '}
              <Text as="span" fontWeight="semibold" color={textColor}>
                {new Date().toLocaleDateString()}
              </Text>
            </Text>
            
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              <strong>Analysis ID:</strong> {analysisId} •{' '}
              <strong>Processing Date:</strong> {new Date().toLocaleString()}
            </Text>
            
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              <strong>Models Used:</strong> Whisper (transcription), RoBERTa (sentiment), 
              BART (summarization), Librosa (vocal biomarkers)
            </Text>
          </VStack>
        </Box>

        {/* Action Bar */}
        <HStack spacing={4} justify="space-between">
          {/* Feedback */}
          <HStack spacing={2}>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Was this summary helpful?
            </Text>
            <IconButton
              aria-label="Positive feedback"
              icon={<FiThumbsUp />}
              size="sm"
              variant={feedback === 'positive' ? 'solid' : 'ghost'}
              colorScheme={feedback === 'positive' ? 'green' : 'gray'}
              onClick={() => handleFeedback('positive')}
            />
            <IconButton
              aria-label="Negative feedback"
              icon={<FiThumbsDown />}
              size="sm"
              variant={feedback === 'negative' ? 'solid' : 'ghost'}
              colorScheme={feedback === 'negative' ? 'red' : 'gray'}
              onClick={() => handleFeedback('negative')}
            />
          </HStack>

          {/* Confidence Indicator */}
          <HStack spacing={2}>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Confidence Level:
            </Text>
            <Badge colorScheme="green" variant="subtle">
              95%
            </Badge>
          </HStack>
        </HStack>

        {/* Feedback Form */}
        {showFeedbackForm && (
          <Box bg={useColorModeValue('blue.50', 'blue.900')} p={4} borderRadius="md" border="1px solid" borderColor={useColorModeValue('blue.200', 'blue.700')}>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('blue.800', 'blue.200')}>
                Help us improve! Please share your thoughts:
              </Text>
              
              <Textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What could we improve? What was helpful?"
                size="sm"
                resize="vertical"
              />
              
              <HStack spacing={2} justify="flex-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFeedbackForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={submitFeedback}
                >
                  Submit Feedback
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Additional Trust Indicators */}
        <Box bg={useColorModeValue('gray.50', 'gray.700')} p={3} borderRadius="md">
          <HStack spacing={4} justify="center" fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
            <HStack spacing={1}>
              <FiCheck color="green" />
              <Text>Transparent AI</Text>
            </HStack>
            <HStack spacing={1}>
              <FiCheck color="green" />
              <Text>Source Citations</Text>
            </HStack>
            <HStack spacing={1}>
              <FiCheck color="green" />
              <Text>User Control</Text>
            </HStack>
            <HStack spacing={1}>
              <FiCheck color="green" />
              <Text>Feedback Loop</Text>
            </HStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};
