import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  IconButton,
  Progress,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Flex,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { 
  FiMic, 
  FiSquare, 
  FiDownload, 
  FiUpload, 
  FiTrash2, 
  FiInfo, 
  FiPlay, 
  FiPause,
  FiBarChart,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '@/services/analysis.service';
import { WeeklySummary } from '@/features/analysis/components/WeeklySummary';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // Maximum recording duration in seconds
  showWaveform?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'minimal' | 'compact';
  userId?: string; // Add userId for backend integration
  autoUpload?: boolean; // Whether to automatically upload after recording
}

interface RecordingStats {
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  fileSize: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  showStats = true,
  variant = 'default',
  userId, // Use userId for backend integration
  autoUpload = false, // Default to false for backward compatibility
}) => {
  const navigate = useNavigate();
  // Add debugging for userId
  console.log('AudioRecorder props:', { userId, autoUpload, maxDuration, showStats, variant });
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStats, setRecordingStats] = useState<RecordingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('idle'); // idle, uploading, analyzing, complete, failed
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');


  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if browser supports audio recording
  const checkAudioSupport = useCallback((): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser');
      return false;
    }
    return true;
  }, []);

  // Poll for analysis results
  const pollAnalysisResults = useCallback(async (analysisId: number) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes
    
    const poll = async () => {
      try {
        const response = await analysisService.getAnalysisResults(analysisId);
        
        if (response.status === 'COMPLETE') {
          setAnalysisStatus('complete');
          setAnalysisResults(response.results);
          toast({
            title: 'Analysis Complete!',
            description: 'Your vocal biomarker analysis is ready. Click "View Enhanced Analysis" to see detailed results.',
            status: 'success',
            duration: 8000,
            isClosable: true,
          });
          
          // Show button to navigate to enhanced analysis
          return;
        } else if (response.status === 'FAILED') {
          setAnalysisStatus('failed');
          setError('Analysis failed during processing');
          return;
        }
        
        // Continue polling if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setAnalysisStatus('failed');
          setError('Analysis timed out');
        }
        
      } catch (error) {
        console.error('Error polling analysis results:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setAnalysisStatus('failed');
          setError('Failed to get analysis results');
        }
      }
    };
    
    poll();
  }, [analysisService, toast]);

  // Navigate to enhanced analysis page
  const handleViewEnhancedAnalysis = () => {
    navigate('/enhanced-analysis');
  };

  // Handle recording completion with optional auto-upload
  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    setIsRecording(false);
    
    // Call the parent callback
    onRecordingComplete(audioBlob, duration);
    
    // Auto-upload if enabled and userId is provided
    if (autoUpload && userId && audioBlob) {
      try {
        console.log('Starting auto-upload...', { userId, audioBlobSize: audioBlob.size, audioBlobType: audioBlob.type });
        setIsUploading(true);
        setUploadProgress(0);
        setAnalysisStatus('uploading');
        
        // Convert Blob to File for upload with proper extension
        let extension = 'webm'; // Default to WebM
        if (audioBlob.type.includes('mp3')) extension = 'mp3';
        else if (audioBlob.type.includes('m4a')) extension = 'm4a';
        else if (audioBlob.type.includes('ogg')) extension = 'ogg';
        else if (audioBlob.type.includes('wav')) extension = 'wav';
        
        const audioFile = new File([audioBlob], `recording_${Date.now()}.${extension}`, { 
          type: audioBlob.type
        });
        
        console.log('Created audio file:', { fileName: audioFile.name, fileSize: audioFile.size, fileType: audioFile.type });
        
        // Upload to backend
        console.log('Calling analysisService.uploadAudio...');
        const response = await analysisService.uploadAudio(
          audioFile, 
          userId,
          (progress: number) => {
            console.log('Upload progress:', progress);
            setUploadProgress(progress);
          }
        );
        
        console.log('Upload response:', response);
        
        // Set analysis ID and status
        setAnalysisId(response.analysis_id);
        setAnalysisStatus('analyzing');
        
        toast({
          title: 'Recording uploaded successfully',
          description: `Analysis initiated (ID: ${response.analysis_id})`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Start polling for analysis results
        console.log('Starting to poll for results...');
        pollAnalysisResults(response.analysis_id);
        
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setError(errorMessage);
        setAnalysisStatus('failed');
        
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      toast({
        title: 'Recording completed',
        description: `Audio recorded for ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onRecordingComplete, autoUpload, userId, toast]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!checkAudioSupport()) return;

    try {
      setError(null);
      setIsProcessing(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Mono recording for better analysis
        },
      });

      // Enhanced WebM format detection with fallbacks
      let mimeType = '';
      const webmFormats = [
        'audio/webm;codecs=opus',      // Best quality, most compatible
        'audio/webm;codecs=vorbis',    // Good quality, wide support
        'audio/webm',                  // Browser default codec
        'audio/ogg;codecs=opus',       // Fallback for older browsers
        'audio/mp4',                   // Last resort
      ];

      // Find the best supported format
      for (const format of webmFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          console.log(`Using audio format: ${format}`);
          break;
        }
      }

      if (!mimeType) {
        // If no specific format is supported, let browser choose
        mimeType = '';
        console.log('No specific format supported, using browser default');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // Optimize for voice recording
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));

        // Calculate recording stats - use the actual recording time
        const actualDuration = recordingTime;
        const fileSize = audioBlob.size;
        
        // Enhanced stats with format information
        const stats: RecordingStats = {
          duration: actualDuration,
          sampleRate: 44100,
          channels: 1,
          bitDepth: 16,
          fileSize,
        };
        setRecordingStats(stats);

        // Log recording details for debugging
        console.log('Recording completed:', {
          format: mediaRecorder.mimeType,
          duration: actualDuration,
          fileSize: `${(fileSize / 1024).toFixed(1)} KB`,
          chunks: audioChunksRef.current.length,
        });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Call the new handler with the correct duration
        handleRecordingComplete(audioBlob, actualDuration);
      };

      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred');
        console.error('MediaRecorder error:', event);
      };

      // Start recording with optimal chunk size for WebM
      const chunkSize = mimeType.includes('opus') ? 100 : 200; // Smaller chunks for Opus
      mediaRecorder.start(chunkSize);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);

      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setError(errorMessage);
      
      toast({
        title: 'Recording failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [checkAudioSupport, maxDuration, handleRecordingComplete, recordingTime, toast]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording, isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Adjust start time for pause
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;

      // Resume timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);
    }
  }, [isRecording, isPaused, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Delete recording
  const deleteRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingStats(null);
    setRecordingTime(0);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  // Download recording
  const downloadRecording = useCallback(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determine correct file extension based on MIME type
      let extension = 'webm'; // Default to WebM
      if (audioBlob.type.includes('mp3')) extension = 'mp3';
      else if (audioBlob.type.includes('m4a')) extension = 'm4a';
      else if (audioBlob.type.includes('ogg')) extension = 'ogg';
      else if (audioBlob.type.includes('wav')) extension = 'wav';
      
      a.download = `cognispeech_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Download results (new function)
  const downloadResults = useCallback((results: any) => {
    if (results) {
      const jsonString = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cognispeech_analysis_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Results downloaded',
        description: 'Analysis results downloaded as JSON.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Show detailed results (new function)
  const showDetailedResults = useCallback((results: any) => {
    setAnalysisResults(results);
    onOpen();
  }, [onOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <Box>
        <HStack spacing={2}>
          {!isRecording ? (
            <Button
              leftIcon={<FiMic />}
              colorScheme="red"
              onClick={startRecording}
              isLoading={isProcessing}
              size="sm"
            >
              Record
            </Button>
          ) : (
            <>
              <Button
                leftIcon={isPaused ? <FiPlay /> : <FiPause />}
                colorScheme="orange"
                onClick={isPaused ? resumeRecording : pauseRecording}
                size="sm"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                leftIcon={<FiSquare />}
                colorScheme="red"
                onClick={stopRecording}
                size="sm"
              >
                Stop
              </Button>
            </>
          )}
          {recordingTime > 0 && (
            <Text fontSize="sm" color="gray.500">
              {formatTime(recordingTime)}
            </Text>
          )}
        </HStack>
      </Box>
    );
  }

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Box>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            {!isRecording ? (
              <Button
                leftIcon={<FiMic />}
                colorScheme="red"
                onClick={startRecording}
                isLoading={isProcessing}
                size="sm"
                w="full"
              >
                Start Recording
              </Button>
            ) : (
              <HStack spacing={2} w="full">
                <Button
                  leftIcon={isPaused ? <FiPlay /> : <FiPause />}
                  colorScheme="orange"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  size="sm"
                  flex={1}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  leftIcon={<FiSquare />}
                  colorScheme="red"
                  onClick={stopRecording}
                  size="sm"
                  flex={1}
                >
                  Stop
                </Button>
              </HStack>
            )}
          </HStack>
          
          {recordingTime > 0 && (
            <Progress
              value={(recordingTime / maxDuration) * 100}
              colorScheme="red"
              size="sm"
              borderRadius="full"
            />
          )}
          
          {recordingTime > 0 && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </Text>
          )}
        </VStack>
      </Box>
    );
  }

  // Add upload progress display in the default variant
  if (variant === 'default') {
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
              Audio Recorder
            </Text>
            <Text fontSize="sm" color="gray.500">
              Record your voice for vocal biomarker analysis
            </Text>
            {autoUpload && userId && (
              <Text fontSize="xs" color="blue.500" mt={1}>
                Auto-upload enabled
              </Text>
            )}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                  Uploading to backend...
                </Text>
                <Badge colorScheme="blue" variant="solid">
                  {uploadProgress.toFixed(1)}%
                </Badge>
              </HStack>
              <Progress
                value={uploadProgress}
                colorScheme="blue"
                size="lg"
                borderRadius="full"
              />
            </Box>
          )}

          {/* Analysis Status */}
          {analysisStatus !== 'idle' && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                  Analysis Status
                </Text>
                <Badge 
                  colorScheme={
                    analysisStatus === 'uploading' ? 'blue' :
                    analysisStatus === 'analyzing' ? 'orange' :
                    analysisStatus === 'complete' ? 'green' :
                    analysisStatus === 'failed' ? 'red' : 'gray'
                  } 
                  variant="solid"
                >
                  {analysisStatus === 'uploading' ? 'Uploading...' :
                   analysisStatus === 'analyzing' ? 'Analyzing...' :
                   analysisStatus === 'complete' ? 'Complete!' :
                   analysisStatus === 'failed' ? 'Failed' : 'Unknown'}
                </Badge>
              </HStack>
              
              {analysisStatus === 'analyzing' && (
                <Progress
                  value={100}
                  colorScheme="orange"
                  size="lg"
                  borderRadius="full"
                  isIndeterminate
                />
              )}
              
              {analysisId && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Analysis ID: {analysisId}
                </Text>
              )}
            </Box>
          )}

          {/* Analysis Results Display */}
          {analysisStatus === 'complete' && analysisResults && (
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
                    <StatNumber>{analysisResults.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Jitter</StatLabel>
                    <StatNumber>{analysisResults.jitter_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Shimmer</StatLabel>
                    <StatNumber>{analysisResults.shimmer_percent?.toFixed(2) || 'N/A'}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Pitch Range</StatLabel>
                    <StatNumber>{analysisResults.pitch_range_hz?.toFixed(1) || 'N/A'} Hz</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>HNR</StatLabel>
                    <StatNumber>{analysisResults.mean_hnr_db?.toFixed(1) || 'N/A'} dB</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>MFCC 1</StatLabel>
                    <StatNumber>{analysisResults.mfcc_1?.toFixed(3) || 'N/A'}</StatNumber>
                  </Stat>
                </Grid>

                {/* Biomarker Visualization */}
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                    Biomarker Visualization:
                  </Text>
                  <VStack spacing={3} align="stretch">
                    {analysisResults.jitter_percent && (
                      <Box>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.600">Jitter (Lower is better)</Text>
                          <Text fontSize="xs" color="gray.600">{analysisResults.jitter_percent.toFixed(2)}%</Text>
                        </HStack>
                        <Progress 
                          value={Math.min(analysisResults.jitter_percent * 100, 100)} 
                          colorScheme={analysisResults.jitter_percent < 1 ? 'green' : analysisResults.jitter_percent < 3 ? 'yellow' : 'red'}
                          size="sm"
                        />
                      </Box>
                    )}
                    
                    {analysisResults.shimmer_percent && (
                      <Box>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.600">Shimmer (Lower is better)</Text>
                          <Text fontSize="xs" color="gray.600">{analysisResults.shimmer_percent.toFixed(2)}%</Text>
                        </HStack>
                        <Progress 
                          value={Math.min(analysisResults.shimmer_percent * 100, 100)} 
                          colorScheme={analysisResults.shimmer_percent < 3 ? 'green' : analysisResults.shimmer_percent < 8 ? 'yellow' : 'red'}
                          size="sm"
                        />
                      </Box>
                    )}
                    
                    {analysisResults.mean_hnr_db && (
                      <Box>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.600">HNR (Higher is better)</Text>
                          <Text fontSize="xs" color="gray.600">{analysisResults.mean_hnr_db.toFixed(1)} dB</Text>
                        </HStack>
                        <Progress 
                          value={Math.min((analysisResults.mean_hnr_db / 20) * 100, 100)} 
                          colorScheme={analysisResults.mean_hnr_db > 15 ? 'green' : analysisResults.mean_hnr_db > 10 ? 'yellow' : 'red'}
                          size="sm"
                        />
                      </Box>
                    )}
                  </VStack>
                </Box>
              </Box>

              {/* Transcript and Sentiment */}
              <Box mb={6}>
                <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                  🗣️ Speech Analysis
                </Text>
                
                {/* Transcript */}
                {analysisResults.transcript_text && (
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
                        {analysisResults.transcript_text}
                      </Text>
                    </Box>
                  </Box>
                )}

                {/* Sentiment Analysis */}
                {analysisResults.sentiment_label && (
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
                      Sentiment Analysis:
                    </Text>
                    <HStack spacing={4}>
                      <Badge 
                        colorScheme={
                          analysisResults.sentiment_label === 'POSITIVE' ? 'green' :
                          analysisResults.sentiment_label === 'NEGATIVE' ? 'red' : 'gray'
                        } 
                        variant="solid"
                        fontSize="sm"
                        px={3}
                        py={1}
                      >
                        {analysisResults.sentiment_label}
                      </Badge>
                      {analysisResults.sentiment_score && (
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                          Confidence: {(analysisResults.sentiment_score * 100).toFixed(1)}%
                        </Text>
                      )}
                    </HStack>
                  </Box>
                )}

                {/* Summary */}
                {analysisResults.summary_text && (
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
                        {analysisResults.summary_text}
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
                  onClick={() => downloadResults(analysisResults)}
                >
                  Download Results
                </Button>
                <Button
                  leftIcon={<FiInfo />}
                  colorScheme="green"
                  size="md"
                  onClick={() => showDetailedResults(analysisResults)}
                >
                  View Detailed Analysis
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
            </Box>
          )}

          {/* Weekly Summary */}
          {analysisStatus === 'complete' && userId && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                📊 Weekly Trends
              </Text>
              <WeeklySummary userId={userId} />
            </Box>
          )}

          {/* Recording Controls */}
          <Box>
            <HStack spacing={4} justify="center">
              {!isRecording ? (
                <Button
                  leftIcon={<FiMic />}
                  colorScheme="red"
                  size="lg"
                  onClick={startRecording}
                  isLoading={isProcessing}
                  loadingText="Starting..."
                  px={8}
                  h="50px"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    leftIcon={isPaused ? <FiPlay /> : <FiPause />}
                    colorScheme="orange"
                    size="lg"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    px={6}
                    h="50px"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    leftIcon={<FiSquare />}
                    colorScheme="red"
                    size="lg"
                    onClick={stopRecording}
                    px={6}
                    h="50px"
                  >
                    Stop Recording
                  </Button>
                </>
              )}
            </HStack>
          </Box>

          {/* Recording Progress */}
          {isRecording && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                  Recording Time
                </Text>
                <Badge colorScheme="red" variant="solid">
                  {formatTime(recordingTime)}
                </Badge>
              </HStack>
              <Progress
                value={(recordingTime / maxDuration) * 100}
                colorScheme="red"
                size="lg"
                borderRadius="full"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Maximum duration: {formatTime(maxDuration)}
              </Text>
            </Box>
          )}

          {/* Recording Stats */}
          {showStats && recordingStats && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                Recording Details
              </Text>
              <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                <Stat>
                  <StatLabel>Duration</StatLabel>
                  <StatNumber>{formatTime(recordingStats.duration)}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>File Size</StatLabel>
                  <StatNumber>{(recordingStats.fileSize / 1024).toFixed(1)} KB</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Sample Rate</StatLabel>
                  <StatNumber>{recordingStats.sampleRate} Hz</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Format</StatLabel>
                  <StatNumber>
                    {audioBlob?.type ? (
                      <Badge colorScheme="blue" variant="solid" fontSize="xs">
                        {audioBlob.type.includes('opus') ? 'WebM (Opus)' : 
                         audioBlob.type.includes('vorbis') ? 'WebM (Vorbis)' :
                         audioBlob.type.includes('webm') ? 'WebM' : 
                         audioBlob.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </Badge>
                    ) : 'N/A'}
                  </StatNumber>
                </Stat>
              </Grid>
            </Box>
          )}

          {/* Audio Playback */}
          {audioUrl && (
            <Box>
              <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
                Preview Recording
              </Text>
              <audio controls style={{ width: '100%' }} src={audioUrl} />
            </Box>
          )}

          {/* Action Buttons */}
          {audioBlob && (
            <HStack spacing={3} justify="center">
              <Button
                leftIcon={<FiDownload />}
                variant="outline"
                colorScheme="blue"
                onClick={downloadRecording}
                size="md"
              >
                Download
              </Button>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="green"
                onClick={() => onRecordingComplete(audioBlob, recordingStats?.duration || 0)}
                size="md"
              >
                Use Recording
              </Button>
              <Button
                leftIcon={<FiTrash2 />}
                variant="outline"
                colorScheme="red"
                onClick={deleteRecording}
                size="md"
              >
                Delete
              </Button>
            </HStack>
          )}

          {/* Info Modal */}
          <Button
            leftIcon={<FiInfo />}
            variant="ghost"
            colorScheme="gray"
            size="sm"
            onClick={onOpen}
            alignSelf="center"
          >
            Recording Tips
          </Button>

          {/* Recording Tips Modal */}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Recording Tips</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      🎤 Environment
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Record in a quiet room with minimal background noise. Avoid echo and use a consistent distance from the microphone.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      🗣️ Speech Content
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Speak naturally and clearly. Consider reading a standard passage or describing your day for consistent analysis.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      ⏱️ Duration
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Aim for 30 seconds to 2 minutes of speech for optimal analysis. Longer recordings provide more comprehensive insights.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      📱 Device
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Use a good quality microphone if possible. Built-in laptop/phone microphones work well for most purposes.
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
  }

  // Default variant - use the enhanced version above
  return null;
};
