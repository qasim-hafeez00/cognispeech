import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Progress,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Card,
  CardBody,
  Heading,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiFile,
  FiMusic,
  FiX,
  FiInfo,
  FiDownload,
  FiEye,
  FiTrendingUp,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '@/services/analysis.service';
import { 
  BACKEND_CONFIG, 
  validateAudioFile, 
  formatFileSize 
} from '@/lib/config';
import { WeeklySummary } from '@/features/analysis/components/WeeklySummary';

interface FileUploadProps {
  userId: string;
  acceptedTypes?: readonly string[] | string[];
  maxFileSize?: number;
  maxDuration?: number;
  showPreview?: boolean;
  variant?: 'default' | 'minimal' | 'drag-drop';
  multiple?: boolean;
}

interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  userId,
  acceptedTypes = BACKEND_CONFIG.ALLOWED_AUDIO_TYPES,
  maxFileSize = BACKEND_CONFIG.MAX_FILE_SIZE,
  maxDuration = BACKEND_CONFIG.MAX_RECORDING_DURATION,
  variant = 'default',
  multiple = false,
}) => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // SIMPLIFIED ANALYSIS STATE
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    id: string;
    status: 'uploading' | 'analyzing' | 'complete' | 'failed';
    results: any;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // SIMPLIFIED FILE VALIDATION
  const validateFile = useCallback((file: File): string | null => {
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      return validation.error || 'File validation failed';
    }
    return null;
  }, []);

  // SIMPLIFIED POLLING FUNCTION
  const pollForResults = useCallback(async (analysisId: string) => {
    console.log('🔍 Starting to poll for analysis ID:', analysisId);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('📡 Polling for results...');
        const response = await analysisService.getAnalysisResults(parseInt(analysisId));
        console.log('📥 Poll response:', response);
        
        if (response.status === 'COMPLETE') {
          console.log('✅ Analysis completed!');
          
          // Update the current analysis with results
          setCurrentAnalysis(prev => prev ? {
            ...prev,
            status: 'complete',
            results: response.results || response // Use response.results or response itself
          } : null);
          
          clearInterval(pollInterval);
          
          toast({
            title: 'Analysis Complete!',
            description: 'Your audio has been analyzed successfully',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
        } else if (response.status === 'FAILED') {
          console.log('❌ Analysis failed');
          setCurrentAnalysis(prev => prev ? { ...prev, status: 'failed' } : null);
          clearInterval(pollInterval);
          
          toast({
            title: 'Analysis Failed',
            description: 'The analysis could not be completed',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          
        } else if (response.status === 'PROCESSING') {
          console.log('🔄 Analysis still processing...');
          setCurrentAnalysis(prev => prev ? { ...prev, status: 'analyzing' } : null);
        }
        
      } catch (error) {
        console.error('❌ Error polling for results:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [toast]);

  // SIMPLIFIED FILE UPLOAD HANDLER
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      toast({
        title: 'File validation failed',
        description: errors.join('\n'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (newFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...newFiles]);
      } else {
        setSelectedFiles(newFiles);
      }

      // Auto-upload each valid file immediately
      newFiles.forEach(file => {
        console.log('🚀 Starting upload for file:', file.name);
        
        // Set initial progress
        setUploadProgress({
          progress: 0,
          loaded: 0,
          total: file.size,
        });

        // Set current analysis state
        setCurrentAnalysis({
          id: '',
          status: 'uploading',
          results: null,
          fileName: file.name
        });

        // Upload file using analysis service
        analysisService.uploadAudio(
          file, 
          userId,
          (progress: number) => {
            setUploadProgress(prev => prev ? {
              ...prev,
              progress,
              loaded: (progress / 100) * file.size,
            } : null);
          }
        ).then(response => {
          console.log('🎉 Upload successful! Response:', response);
          
          // Update progress to 100%
          setUploadProgress({
            progress: 100,
            loaded: file.size,
            total: file.size,
          });

          // Update current analysis with ID and status
          setCurrentAnalysis(prev => prev ? {
            ...prev,
            id: response.analysis_id.toString(),
            status: 'analyzing'
          } : null);

          toast({
            title: 'Upload successful',
            description: `${file.name} uploaded and analysis initiated (ID: ${response.analysis_id})`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Start polling for results
          console.log('🔍 Starting to poll for results...');
          pollForResults(response.analysis_id.toString());
          
        }).catch(error => {
          console.error('❌ Upload failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setError(errorMessage);
          setCurrentAnalysis(prev => prev ? { ...prev, status: 'failed' } : null);
          
          toast({
            title: 'Upload failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
      });
    }
  }, [validateFile, multiple, userId, toast, pollForResults]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files and analysis
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
    setUploadProgress(null);
    setCurrentAnalysis(null);
  }, []);

  // Format file size
  const formatFileSizeDisplay = (bytes: number): string => {
    return formatFileSize(bytes);
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) return FiMusic;
    return FiFile;
  };

  // Navigate to enhanced analysis page
  const handleViewEnhancedAnalysis = () => {
    navigate('/enhanced-analysis');
  };

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <Box>
        <HStack spacing={2}>
          <Button
            leftIcon={<FiUpload />}
            colorScheme="blue"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          {selectedFiles.length > 0 && (
            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
              {selectedFiles.length} file(s) selected
            </Text>
          )}
        </HStack>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  // Render drag-and-drop variant
  if (variant === 'drag-drop') {
    return (
      <Box>
        <Box
          border="2px dashed"
          borderColor={dragActive ? accentColor : borderColor}
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg={dragActive ? `${accentColor}10` : bgColor}
          transition="all 0.2s"
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          _hover={{
            borderColor: accentColor,
            bg: `${accentColor}10`,
          }}
        >
          <VStack spacing={4}>
            <Icon as={FiUpload} boxSize={12} color={accentColor} />
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={2}>
                Drop audio files here or click to browse
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                Supported formats: {acceptedTypes.join(', ')}
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                Max size: {formatFileSizeDisplay(maxFileSize)}
              </Text>
            </Box>
          </VStack>
        </Box>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />

        {/* File List */}
        {selectedFiles.length > 0 && (
          <Box mt={4}>
            <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
              Selected Files ({selectedFiles.length})
            </Text>
            <VStack spacing={3} align="stretch">
              {selectedFiles.map((file, index) => {
                if (!file) return null;
                
                return (
                  <Box
                    key={`${file.name}-${index}`}
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <HStack justify="space-between" align="start">
                      <HStack spacing={3} align="start" flex={1}>
                        <Icon as={getFileIcon(file)} boxSize={6} color={accentColor} />
                        <Box flex={1}>
                          <Text fontWeight="medium" color={textColor} noOfLines={1}>
                            {file.name}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                            {formatFileSizeDisplay(file.size)} • {file.type}
                          </Text>
                        </Box>
                      </HStack>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeFile(index)}
                        leftIcon={<FiX />}
                      >
                        Remove
                      </Button>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
            
            {/* Clear All Button */}
            <Box mt={3} textAlign="center">
              <Button
                leftIcon={<FiX />}
                variant="outline"
                colorScheme="gray"
                size="md"
                onClick={clearFiles}
                px={6}
              >
                Clear All Files
              </Button>
            </Box>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Box mt={4}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription whiteSpace="pre-line">{error}</AlertDescription>
            </Alert>
          </Box>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Box mt={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                Upload Progress
              </Text>
              <Badge colorScheme="blue" variant="solid">
                {uploadProgress.progress.toFixed(1)}%
              </Badge>
            </HStack>
            <Progress
              value={uploadProgress.progress}
              colorScheme="blue"
              size="lg"
              borderRadius="full"
            />
            <HStack justify="space-between" mt={2}>
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                {formatFileSizeDisplay(uploadProgress.loaded)} / {formatFileSizeDisplay(uploadProgress.total)}
              </Text>
            </HStack>
          </Box>
        )}

        {/* CURRENT ANALYSIS SECTION - ALWAYS SHOW WHEN WE HAVE AN ANALYSIS */}
        {currentAnalysis && (
          <Box mt={6} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <VStack spacing={4} align="stretch">
              
              {/* Analysis Status Header */}
              <Box textAlign="center" p={4} bg={
                currentAnalysis.status === 'complete' ? 'green.50' :
                currentAnalysis.status === 'analyzing' ? 'orange.50' :
                currentAnalysis.status === 'failed' ? 'red.50' : 'blue.50'
              } borderRadius="lg" border="2px solid" borderColor={
                currentAnalysis.status === 'complete' ? 'green.300' :
                currentAnalysis.status === 'analyzing' ? 'orange.300' :
                currentAnalysis.status === 'failed' ? 'red.300' : 'blue.300'
              }>
                <Text fontSize="xl" fontWeight="bold" color={
                  currentAnalysis.status === 'complete' ? 'green.800' :
                  currentAnalysis.status === 'analyzing' ? 'orange.800' :
                  currentAnalysis.status === 'failed' ? 'red.800' : 'blue.800'
                } mb={2}>
                  {currentAnalysis.status === 'complete' ? '✅ Analysis Complete!' :
                   currentAnalysis.status === 'analyzing' ? '🔄 Analysis in Progress...' :
                   currentAnalysis.status === 'failed' ? '❌ Analysis Failed' : '📤 Uploading...'}
                </Text>
                <Text fontSize="md" color={
                  currentAnalysis.status === 'complete' ? 'green.700' :
                  currentAnalysis.status === 'analyzing' ? 'orange.700' :
                  currentAnalysis.status === 'failed' ? 'red.700' : 'blue.700'
                } mb={2}>
                  File: {currentAnalysis.fileName}
                </Text>
                {currentAnalysis.id && (
                  <Badge colorScheme={
                    currentAnalysis.status === 'complete' ? 'green' :
                    currentAnalysis.status === 'analyzing' ? 'orange' :
                    currentAnalysis.status === 'failed' ? 'red' : 'blue'
                  } variant="solid" size="lg" px={4} py={2}>
                    Analysis ID: {currentAnalysis.id}
                  </Badge>
                )}
              </Box>

              {/* Analysis Progress Bar */}
              {currentAnalysis.status === 'analyzing' && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="orange.700" mb={2}>
                    Analysis Progress:
                  </Text>
                  <Progress
                    value={100}
                    colorScheme="orange"
                    size="lg"
                    borderRadius="full"
                    isIndeterminate
                  />
                  <Text fontSize="xs" color="orange.600" mt={2} textAlign="center">
                    Extracting vocal biomarkers, transcribing speech, analyzing sentiment...
                  </Text>
                </Box>
              )}

              {/* ANALYSIS RESULTS - SHOW WHEN COMPLETE */}
              {currentAnalysis.status === 'complete' && currentAnalysis.results && (
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
                    🎯 Analysis Results
                  </Text>
                  
                  {/* Vocal Biomarkers */}
                  <Box mb={6}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                      🎤 Vocal Biomarkers
                    </Text>
                    
                    {/* Biomarker Values */}
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={4}>
                      <Stat>
                        <StatLabel>Mean Pitch</StatLabel>
                        <StatNumber>{currentAnalysis.results.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Jitter</StatLabel>
                        <StatNumber>{currentAnalysis.results.jitter_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Shimmer</StatLabel>
                        <StatNumber>{currentAnalysis.results.shimmer_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Pitch Range</StatLabel>
                        <StatNumber>{currentAnalysis.results.pitch_range_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>HNR</StatLabel>
                        <StatNumber>{currentAnalysis.results.mean_hnr_db?.toFixed(1) || 'N/A'} dB</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>MFCC 1</StatLabel>
                        <StatNumber>{currentAnalysis.results.mfcc_1?.toFixed(3) || 'N/A'}</StatNumber>
                      </Stat>
                    </Grid>

                    {/* Biomarker Visualization */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                        Biomarker Visualization:
                      </Text>
                      <VStack spacing={3} align="stretch">
                        {currentAnalysis.results.jitter_percent && (
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="gray.600">Jitter (Lower is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.jitter_percent.toFixed(2)}%</Text>
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
                              <Text fontSize="xs" color="gray.600">Shimmer (Lower is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.shimmer_percent.toFixed(2)}%</Text>
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
                              <Text fontSize="xs" color="gray.600">HNR (Higher is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.mean_hnr_db.toFixed(1)} dB</Text>
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

                  {/* Speech Analysis */}
                  <Box mb={6}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                      🗣️ Speech Analysis
                    </Text>
                    
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

                    {/* Summary */}
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

                  {/* Action Buttons for Results */}
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
                        link.download = `analysis_results_${currentAnalysis.id}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Results
                    </Button>
                    <Button
                      leftIcon={<FiTrendingUp />}
                      colorScheme="purple"
                      size="md"
                      onClick={handleViewEnhancedAnalysis}
                    >
                      View Enhanced Analysis
                    </Button>
                  </HStack>

                  {/* Weekly Summary */}
                  {userId && (
                    <Box mt={6}>
                      <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                        📊 Weekly Trends
                      </Text>
                      <WeeklySummary userId={userId} />
                    </Box>
                  )}
                </Box>
              )}

              {/* Debug Info */}
              <Box p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" border="1px solid" borderColor={useColorModeValue('gray.300', 'gray.600')}>
                <Text fontSize="sm" fontWeight="bold" mb={2} color={textColor}>Debug Info:</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Status: {currentAnalysis.status}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>ID: {currentAnalysis.id || 'None'}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Has Results: {currentAnalysis.results ? 'Yes' : 'No'}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>File: {currentAnalysis.fileName}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Time: {new Date().toLocaleTimeString()}</Text>
              </Box>
            </VStack>
          </Box>
        )}
      </Box>
    );
  }

  // Default variant
  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      w="full"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={2}>
            File Upload
          </Text>
          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
            Select audio files for vocal biomarker analysis
          </Text>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription whiteSpace="pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {/* File Selection */}
        <Box>
          <HStack spacing={3} justify="center">
            <Button
              leftIcon={<FiUpload />}
              colorScheme="blue"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              px={8}
              h="50px"
            >
              Select Files
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                leftIcon={<FiX />}
                variant="outline"
                colorScheme="gray"
                size="lg"
                onClick={clearFiles}
                px={6}
                h="50px"
              >
                Clear All
              </Button>
            )}
          </HStack>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
        </Box>

        {/* File List */}
        {selectedFiles.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
              Selected Files ({selectedFiles.length})
            </Text>
            <VStack spacing={3} align="stretch">
              {selectedFiles.map((file, index) => {
                if (!file) return null;
                
                return (
                  <Box
                    key={`${file.name}-${index}`}
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <HStack justify="space-between" align="start">
                      <HStack spacing={3} align="start" flex={1}>
                        <Icon as={getFileIcon(file)} boxSize={6} color={accentColor} />
                        <Box flex={1}>
                          <Text fontWeight="medium" color={textColor} noOfLines={1}>
                            {file.name}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                            {formatFileSizeDisplay(file.size)} • {file.type}
                          </Text>
                        </Box>
                      </HStack>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeFile(index)}
                        leftIcon={<FiX />}
                      >
                        Remove
                      </Button>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                Upload Progress
              </Text>
              <Badge colorScheme="blue" variant="solid">
                {uploadProgress.progress.toFixed(1)}%
              </Badge>
            </HStack>
            <Progress
              value={uploadProgress.progress}
              colorScheme="blue"
              size="lg"
              borderRadius="full"
            />
            <HStack justify="space-between" mt={2}>
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                {formatFileSizeDisplay(uploadProgress.loaded)} / {formatFileSizeDisplay(uploadProgress.total)}
              </Text>
            </HStack>
          </Box>
        )}

        {/* CURRENT ANALYSIS SECTION - ALWAYS SHOW WHEN WE HAVE AN ANALYSIS */}
        {currentAnalysis && (
          <Box mt={6} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <VStack spacing={4} align="stretch">
              
              {/* Analysis Status Header */}
              <Box textAlign="center" p={4} bg={
                currentAnalysis.status === 'complete' ? 'green.50' :
                currentAnalysis.status === 'analyzing' ? 'orange.50' :
                currentAnalysis.status === 'failed' ? 'red.50' : 'blue.50'
              } borderRadius="lg" border="2px solid" borderColor={
                currentAnalysis.status === 'complete' ? 'green.300' :
                currentAnalysis.status === 'analyzing' ? 'orange.300' :
                currentAnalysis.status === 'failed' ? 'red.300' : 'blue.300'
              }>
                <Text fontSize="xl" fontWeight="bold" color={
                  currentAnalysis.status === 'complete' ? 'green.800' :
                  currentAnalysis.status === 'analyzing' ? 'orange.800' :
                  currentAnalysis.status === 'failed' ? 'red.800' : 'blue.800'
                } mb={2}>
                  {currentAnalysis.status === 'complete' ? '✅ Analysis Complete!' :
                   currentAnalysis.status === 'analyzing' ? '🔄 Analysis in Progress...' :
                   currentAnalysis.status === 'failed' ? '❌ Analysis Failed' : '📤 Uploading...'}
                </Text>
                <Text fontSize="md" color={
                  currentAnalysis.status === 'complete' ? 'green.700' :
                  currentAnalysis.status === 'analyzing' ? 'orange.700' :
                  currentAnalysis.status === 'failed' ? 'red.700' : 'blue.700'
                } mb={2}>
                  File: {currentAnalysis.fileName}
                </Text>
                {currentAnalysis.id && (
                  <Badge colorScheme={
                    currentAnalysis.status === 'complete' ? 'green' :
                    currentAnalysis.status === 'analyzing' ? 'orange' :
                    currentAnalysis.status === 'failed' ? 'red' : 'blue'
                  } variant="solid" size="lg" px={4} py={2}>
                    Analysis ID: {currentAnalysis.id}
                  </Badge>
                )}
              </Box>

              {/* Analysis Progress Bar */}
              {currentAnalysis.status === 'analyzing' && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="orange.700" mb={2}>
                    Analysis Progress:
                  </Text>
                  <Progress
                    value={100}
                    colorScheme="orange"
                    size="lg"
                    borderRadius="full"
                    isIndeterminate
                  />
                  <Text fontSize="xs" color="orange.600" mt={2} textAlign="center">
                    Extracting vocal biomarkers, transcribing speech, analyzing sentiment...
                  </Text>
                </Box>
              )}

              {/* ANALYSIS RESULTS - SHOW WHEN COMPLETE */}
              {currentAnalysis.status === 'complete' && currentAnalysis.results && (
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={4}>
                    🎯 Analysis Results
                  </Text>
                  
                  {/* Vocal Biomarkers */}
                  <Box mb={6}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                      🎤 Vocal Biomarkers
                    </Text>
                    
                    {/* Biomarker Values */}
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={4}>
                      <Stat>
                        <StatLabel>Mean Pitch</StatLabel>
                        <StatNumber>{currentAnalysis.results.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Jitter</StatLabel>
                        <StatNumber>{currentAnalysis.results.jitter_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Shimmer</StatLabel>
                        <StatNumber>{currentAnalysis.results.shimmer_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Pitch Range</StatLabel>
                        <StatNumber>{currentAnalysis.results.pitch_range_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>HNR</StatLabel>
                        <StatNumber>{currentAnalysis.results.mean_hnr_db?.toFixed(1) || 'N/A'} dB</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>MFCC 1</StatLabel>
                        <StatNumber>{currentAnalysis.results.mfcc_1?.toFixed(3) || 'N/A'}</StatNumber>
                      </Stat>
                    </Grid>

                    {/* Biomarker Visualization */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                        Biomarker Visualization:
                      </Text>
                      <VStack spacing={3} align="stretch">
                        {currentAnalysis.results.jitter_percent && (
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color="gray.600">Jitter (Lower is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.jitter_percent.toFixed(2)}%</Text>
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
                              <Text fontSize="xs" color="gray.600">Shimmer (Lower is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.shimmer_percent.toFixed(2)}%</Text>
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
                              <Text fontSize="xs" color="gray.600">HNR (Higher is better)</Text>
                              <Text fontSize="xs" color="gray.600">{currentAnalysis.results.mean_hnr_db.toFixed(1)} dB</Text>
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

                  {/* Speech Analysis */}
                  <Box mb={6}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                      🗣️ Speech Analysis
                    </Text>
                    
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

                    {/* Summary */}
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

                  {/* Action Buttons for Results */}
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
                        link.download = `analysis_results_${currentAnalysis.id}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Results
                    </Button>
                    <Button
                      leftIcon={<FiTrendingUp />}
                      colorScheme="purple"
                      size="md"
                      onClick={handleViewEnhancedAnalysis}
                    >
                      View Enhanced Analysis
                    </Button>
                  </HStack>

                  {/* Weekly Summary */}
                  {userId && (
                    <Box mt={6}>
                      <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                        📊 Weekly Trends
                      </Text>
                      <WeeklySummary userId={userId} />
                    </Box>
                  )}
                </Box>
              )}

              {/* Debug Info */}
              <Box p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" border="1px solid" borderColor={useColorModeValue('gray.300', 'gray.600')}>
                <Text fontSize="sm" fontWeight="bold" mb={2} color={textColor}>Debug Info:</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Status: {currentAnalysis.status}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>ID: {currentAnalysis.id || 'None'}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Has Results: {currentAnalysis.results ? 'Yes' : 'No'}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>File: {currentAnalysis.fileName}</Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>Time: {new Date().toLocaleTimeString()}</Text>
              </Box>
            </VStack>
          </Box>
        )}

        {/* File Requirements Info */}
        <Button
          leftIcon={<FiInfo />}
          variant="ghost"
          colorScheme="gray"
          size="sm"
          onClick={onOpen}
          alignSelf="center"
        >
          File Requirements
        </Button>

        {/* File Requirements Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Upload Requirements</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="semibold" mb={2} color={textColor}>
                    📁 Supported Formats
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Audio: WAV, MP3, M4A, FLAC
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={2} color={textColor}>
                    📏 File Size
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Maximum file size: {formatFileSizeDisplay(maxFileSize)}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={2} color={textColor}>
                    ⏱️ Duration
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Maximum duration: {Math.floor(maxDuration / 60)} minutes
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={2} color={textColor}>
                    🎯 Quality
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    For best results, use clear audio with minimal background noise.
                    Higher quality recordings provide more accurate analysis.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={2} color={textColor}>
                    🔒 Security
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    Files are validated for both MIME type and file extension to ensure security.
                    Only legitimate audio files are accepted.
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={onClose}>
                Got it
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};
