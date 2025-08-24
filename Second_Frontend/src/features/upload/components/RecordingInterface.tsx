import React, { useState, useRef, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Icon,
  Card,
  CardBody,
  Heading,
} from '@chakra-ui/react'
import { 
  FiMic, 
  FiSquare, 
  FiPlay, 
  FiPause, 
  FiUpload, 
  FiTrash2
} from 'react-icons/fi'
import { useAnalysisStore } from '@/store/analysis.store'
import { useAuth } from '@/contexts/AuthContext'

interface RecordingState {
  isRecording: boolean
  isPlaying: boolean
  isPaused: boolean
  duration: number
  currentTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export const RecordingInterface: React.FC = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    isPaused: false,
    duration: 0,
    currentTime: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const toast = useToast()
  const { user } = useAuth()
  const { uploadFile, isUploading } = useAnalysisStore()

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setRecordingState(prev => ({ ...prev, error: null }))
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '',
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setRecordingState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
        }))
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      mediaRecorder.start()
      startTimeRef.current = Date.now()
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true,
        duration: 0,
        currentTime: 0,
      }))
      
      // Start timer
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setRecordingState(prev => ({ 
          ...prev, 
          duration: elapsed,
          currentTime: elapsed,
        }))
      }, 100)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      setRecordingState(prev => ({ ...prev, error: errorMessage }))
      toast({
        title: 'Recording Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [toast])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop()
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [recordingState.isRecording])

  // Play recorded audio
  const playAudio = useCallback(() => {
    if (audioRef.current && recordingState.audioUrl) {
      audioRef.current.play()
      setRecordingState(prev => ({ ...prev, isPlaying: true, isPaused: false }))
    }
  }, [recordingState.audioUrl])

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setRecordingState(prev => ({ ...prev, isPlaying: false, isPaused: true }))
    }
  }, [])

  // Handle audio time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setRecordingState(prev => ({ 
        ...prev, 
        currentTime: audioRef.current?.currentTime || 0 
      }))
    }
  }, [])

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    setRecordingState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      currentTime: 0 
    }))
  }, [])

  // Upload recorded audio
  const uploadRecording = useCallback(async () => {
    if (!recordingState.audioBlob || !user) return

    try {
      // Create a File object from the recorded audio Blob
      const file = new File([recordingState.audioBlob], `recording.${recordingState.audioBlob.type.split('/')[1] || 'webm'}`, {
        type: recordingState.audioBlob.type
      })

      await uploadFile(file, user.id)

      toast({
        title: 'Upload Successful',
        description: 'Your recording has been uploaded and analysis started.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset recording state
      setRecordingState({
        isRecording: false,
        isPlaying: false,
        isPaused: false,
        duration: 0,
        currentTime: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [recordingState.audioBlob, user, uploadFile, toast])

  // Clear recording
  const clearRecording = useCallback(() => {
    setRecordingState({
      isRecording: false,
      isPlaying: false,
      isPaused: false,
      duration: 0,
      currentTime: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })

    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl)
    }
  }, [recordingState.audioUrl])

  return (
    <Box maxW="md" mx="auto" p={6}>
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="md" textAlign="center">
              Voice Recording
            </Heading>

            {/* Error Display */}
            {recordingState.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{recordingState.error}</AlertDescription>
              </Alert>
            )}

            {/* Recording Controls */}
            <VStack spacing={4}>
              {/* Recording Button */}
              {!recordingState.audioBlob && (
                <Button
                  size="lg"
                  colorScheme={recordingState.isRecording ? 'red' : 'blue'}
                  leftIcon={<Icon as={recordingState.isRecording ? FiSquare : FiMic} />}
                  onClick={recordingState.isRecording ? stopRecording : startRecording}
                  isLoading={isUploading}
                  loadingText={recordingState.isRecording ? "Recording..." : "Starting..."}
                  width="full"
                >
                  {recordingState.isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              )}

              {/* Recording Timer */}
              {recordingState.isRecording && (
                <VStack spacing={2}>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {formatTime(recordingState.duration)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Recording in progress...
                  </Text>
                </VStack>
              )}

              {/* Audio Playback Controls */}
              {recordingState.audioBlob && (
                <VStack spacing={4} width="full">
                  <HStack spacing={4} width="full">
                    <Button
                      size="md"
                      colorScheme="blue"
                      leftIcon={<Icon as={recordingState.isPlaying ? FiPause : FiPlay} />}
                      onClick={recordingState.isPlaying ? pauseAudio : playAudio}
                      flex={1}
                    >
                      {recordingState.isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    
                    <Button
                      size="md"
                      variant="outline"
                      leftIcon={<Icon as={FiTrash2} />}
                      onClick={clearRecording}
                    >
                      Clear
                    </Button>
                  </HStack>

                  {/* Audio Progress */}
                  <VStack spacing={2} width="full">
                    <Progress 
                      value={(recordingState.currentTime / recordingState.duration) * 100} 
                      width="full" 
                      colorScheme="blue"
                    />
                    <HStack justify="space-between" width="full">
                      <Text fontSize="sm" color="gray.600">
                        {formatTime(recordingState.currentTime)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {formatTime(recordingState.duration)}
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Upload Button */}
                  <Button
                    size="lg"
                    colorScheme="green"
                    leftIcon={<Icon as={FiUpload} />}
                    onClick={uploadRecording}
                    isLoading={isUploading}
                    loadingText="Uploading..."
                    width="full"
                    isDisabled={!user}
                  >
                    Upload & Analyze
                  </Button>

                  {!user && (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription fontSize="sm">
                        Please log in to upload and analyze recordings.
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              )}

              {/* Audio Element (hidden) */}
              {recordingState.audioUrl && (
                <audio
                  ref={audioRef}
                  src={recordingState.audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                  style={{ display: 'none' }}
                />
              )}
            </VStack>

            {/* Instructions */}
            <VStack spacing={2} textAlign="center">
              <Text fontSize="sm" color="gray.600">
                Click the microphone to start recording your voice.
              </Text>
              <Text fontSize="sm" color="gray.600">
                Speak clearly and naturally for best analysis results.
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
