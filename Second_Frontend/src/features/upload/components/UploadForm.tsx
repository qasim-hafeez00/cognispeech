import type React from "react"
import { useState, useCallback, useRef } from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Skeleton,
  SkeletonText,
  useToast,
  Icon,
  Badge,
  CloseButton,
} from "@chakra-ui/react"
import { FiUpload, FiFile, FiCheck } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { useAnalysisStore } from "@/store/analysis.store"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Props for the UploadForm component
 */
export interface UploadFormProps {
  /** Callback fired when upload succeeds */
  onSuccess?: (fileId: string, file: File) => void
  /** Callback fired when upload fails */
  onError?: (error: string, file?: File) => void
  /** Callback fired when upload progress changes */
  onProgress?: (progress: number, file: File) => void
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number
  /** Accepted file types (default: audio/*) */
  acceptedTypes?: string[]
  /** Whether to show file preview */
  showPreview?: boolean
  /** Whether to auto-start analysis after upload */
  autoStartAnalysis?: boolean
}

/**
 * File metadata interface
 */
interface FileMetadata {
  name: string
  size: number
  type: string
  duration?: number
  lastModified: number
}

/**
 * Upload state interface
 */
interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  isDragOver: boolean
}

/**
 * Accessible UploadForm component with drag-and-drop, validation, and progress tracking
 */
export const UploadForm: React.FC<UploadFormProps> = ({
  onSuccess,
  onError,
  onProgress,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ["audio/*"],
  showPreview = true,

}) => {
  const [file, setFile] = useState<File | null>(null)
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    isDragOver: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { user } = useAuth()
  const { uploadFile, isUploading, error } = useAnalysisStore()

  /**
   * Validates the selected file
   */
  const validateFile = useCallback(
    (selectedFile: File): string | null => {
      // Check file size
      if (selectedFile.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
      }

      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type === "audio/*") {
          return selectedFile.type.startsWith("audio/")
        }
        return selectedFile.type === type
      })

      if (!isValidType) {
        return `File type must be one of: ${acceptedTypes.join(", ")}`
      }

      return null
    },
    [maxFileSize, acceptedTypes],
  )

  /**
   * Extracts file metadata including duration for audio files
   */
  const extractFileMetadata = useCallback(async (selectedFile: File): Promise<FileMetadata> => {
    const metadata: FileMetadata = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    }

    // Extract audio duration if it's an audio file
    if (selectedFile.type.startsWith("audio/")) {
      try {
        const audio = new Audio()
        const url = URL.createObjectURL(selectedFile)

        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => {
            metadata.duration = audio.duration
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to load audio metadata"))
          }
          audio.src = url
        })
      } catch (error) {
        console.warn("Failed to extract audio duration:", error)
      }
    }

    return metadata
  }, [])

  /**
   * Handles file selection from input or drop
   */
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setUploadState((prev) => ({ ...prev, error: validationError }))
        onError?.(validationError, selectedFile)
        return
      }

      setUploadState((prev) => ({ ...prev, error: null }))
      setFile(selectedFile)

      try {
        const metadata = await extractFileMetadata(selectedFile)
        setFileMetadata(metadata)
      } catch (error) {
        console.warn("Failed to extract file metadata:", error)
        setFileMetadata({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
        })
      }
    },
    [validateFile, extractFileMetadata, onError],
  )

  /**
   * Handles file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect],
  )

  /**
   * Handles drag and drop events
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setUploadState((prev) => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setUploadState((prev) => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setUploadState((prev) => ({ ...prev, isDragOver: false }))

      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect],
  )

  /**
   * Handles file upload and analysis start
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!file || !user) return

      setUploadState((prev) => ({ ...prev, isUploading: true, progress: 0, error: null }))

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadState((prev) => {
            const newProgress = Math.min(prev.progress + Math.random() * 20, 90)
            onProgress?.(newProgress, file)
            return { ...prev, progress: newProgress }
          })
        }, 200)

        // Upload file using the store
        await uploadFile(file, user.id)

        clearInterval(progressInterval)
        setUploadState((prev) => ({ ...prev, progress: 100 }))

        // Success feedback
        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded and analysis started.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })

        onSuccess?.(file.name, file)

        // Reset form
        setFile(null)
        setFileMetadata(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed"
        setUploadState((prev) => ({ ...prev, error: errorMessage }))
        onError?.(errorMessage, file)

        toast({
          title: "Upload Failed",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setUploadState((prev) => ({ ...prev, isUploading: false, progress: 0 }))
      }
    },
    [file, user, onSuccess, onError, onProgress, uploadFile, toast],
  )

  /**
   * Clears the selected file
   */
  const handleClearFile = useCallback(() => {
    setFile(null)
    setFileMetadata(null)
    setUploadState((prev) => ({ ...prev, error: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  /**
   * Formats file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  /**
   * Formats duration for display
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Show skeleton during loading states
  if (uploadState.isUploading || isUploading) {
    return (
      <Box maxW="md" mx="auto" p={6}>
        <VStack spacing={4}>
          <Skeleton height="120px" width="100%" />
          <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" />
          <Progress value={uploadState.progress} size="lg" colorScheme="blue" width="100%" hasStripe isAnimated />
          <Text fontSize="sm" color="gray.600">
            Uploading... {Math.round(uploadState.progress)}%
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box maxW="md" mx="auto" p={6}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          {/* Upload Area */}
          <FormControl isInvalid={!!uploadState.error || !!error}>
            <FormLabel fontSize="lg" fontWeight="semibold">
              Upload Audio File
            </FormLabel>

            <Box
              border="2px dashed"
              borderColor={uploadState.isDragOver ? "blue.400" : "gray.300"}
              borderRadius="lg"
              p={8}
              textAlign="center"
              bg={uploadState.isDragOver ? "blue.50" : "gray.50"}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: "blue.400", bg: "blue.50" }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Click to upload file or drag and drop"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <VStack spacing={3}>
                <Icon as={FiUpload} boxSize={8} color="gray.400" />
                <Text fontSize="lg" fontWeight="medium">
                  {uploadState.isDragOver ? "Drop your file here" : "Click to upload or drag and drop"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Supports audio files up to {Math.round(maxFileSize / (1024 * 1024))}MB
                </Text>
              </VStack>
            </Box>

            <Input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(",")}
              onChange={handleFileChange}
              display="none"
              aria-describedby="file-upload-help"
            />

            {(uploadState.error || error) && (
              <FormErrorMessage>{uploadState.error || error}</FormErrorMessage>
            )}

            <FormHelperText id="file-upload-help">Accepted formats: {acceptedTypes.join(", ")}</FormHelperText>
          </FormControl>

          {/* File Preview */}
          {file && fileMetadata && showPreview && (
            <Alert status="info" borderRadius="md">
              <AlertIcon as={FiFile} />
              <Box flex="1">
                <AlertTitle fontSize="sm">Selected File</AlertTitle>
                <AlertDescription>
                  <VStack align="start" spacing={1} mt={2}>
                    <HStack justify="space-between" width="100%">
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {fileMetadata.name}
                      </Text>
                      <CloseButton size="sm" onClick={handleClearFile} />
                    </HStack>
                    <HStack spacing={4}>
                      <Badge colorScheme="blue" size="sm">
                        {formatFileSize(fileMetadata.size)}
                      </Badge>
                      {fileMetadata.duration && (
                        <Badge colorScheme="green" size="sm">
                          {formatDuration(fileMetadata.duration)}
                        </Badge>
                      )}
                      <Badge colorScheme="gray" size="sm">
                        {fileMetadata.type}
                      </Badge>
                    </HStack>
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            width="100%"
            isDisabled={!file || uploadState.isUploading || isUploading || !user}
            isLoading={uploadState.isUploading || isUploading}
            loadingText="Uploading..."
            iconLeft={uploadState.isUploading || isUploading ? undefined : <FiCheck />}
          >
            {uploadState.isUploading || isUploading ? "Uploading..." : "Upload & Analyze"}
          </Button>

          {!user && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">Please log in to upload and analyze audio files.</AlertDescription>
            </Alert>
          )}
        </VStack>
      </form>
    </Box>
  )
}
