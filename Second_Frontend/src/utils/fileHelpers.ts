/**
 * File utility functions for CogniSpeech application
 * Provides typed helpers for file handling, validation, and formatting
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationOptions {
  /** Maximum file size in bytes (default: 50MB) */
  maxSize?: number
  /** Allowed MIME types (default: common audio formats) */
  allowedMimeTypes?: string[]
  /** Minimum file size in bytes (default: 1KB) */
  minSize?: number
}

export interface ValidationResult {
  /** Whether the file is valid */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Additional file metadata */
  metadata?: {
    size: string
    type: string
    name: string
    lastModified: Date
  }
}

export interface FileMetadata {
  name: string
  size: number
  sizeFormatted: string
  type: string
  lastModified: Date
  extension: string
}

// ============================================================================
// Constants
// ============================================================================

/** Default validation options for audio files */
export const DEFAULT_AUDIO_VALIDATION: Required<ValidationOptions> = {
  maxSize: 50 * 1024 * 1024, // 50MB
  minSize: 1024, // 1KB
  allowedMimeTypes: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    "audio/x-flac",
    "audio/mp4",
    "audio/m4a",
  ],
}

/** Common file size units */
const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Converts a file to FormData with specified field name
 * @param file - The file to convert
 * @param fieldName - The field name for the FormData (default: 'file')
 * @param additionalFields - Optional additional fields to append
 * @returns FormData object ready for upload
 *
 * @example
 * ```typescript
 * const formData = fileToFormData(audioFile, 'audio', { userId: '123' });
 * // FormData contains: audio: File, userId: '123'
 * ```
 */
export function fileToFormData(
  file: File,
  fieldName = "file",
  additionalFields?: Record<string, string | number | boolean>,
): FormData {
  const formData = new FormData()

  // Add the main file
  formData.append(fieldName, file)

  // Add any additional fields
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
  }

  return formData
}

/**
 * Converts file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 *
 * @example
 * ```typescript
 * fileSizeReadable(1024) // "1.00 KB"
 * fileSizeReadable(1536, 1) // "1.5 KB"
 * fileSizeReadable(0) // "0 B"
 * ```
 */
export function fileSizeReadable(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B"
  if (bytes < 0) return "Invalid size"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // Ensure we don't exceed our units array
  const unitIndex = Math.min(i, FILE_SIZE_UNITS.length - 1)
  const size = bytes / Math.pow(k, unitIndex)

  return `${size.toFixed(dm)} ${FILE_SIZE_UNITS[unitIndex]}`
}

/**
 * Validates an audio file against specified criteria
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateAudioFile(file, { maxSize: 10 * 1024 * 1024 });
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateAudioFile(file: File, options: ValidationOptions = {}): ValidationResult {
  const opts = { ...DEFAULT_AUDIO_VALIDATION, ...options }

  // Basic file checks
  if (!file) {
    return {
      isValid: false,
      error: "No file provided",
    }
  }

  // File size validation
  if (file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File size (${fileSizeReadable(file.size)}) exceeds maximum allowed size (${fileSizeReadable(opts.maxSize)})`,
    }
  }

  if (file.size < opts.minSize) {
    return {
      isValid: false,
      error: `File size (${fileSizeReadable(file.size)}) is below minimum required size (${fileSizeReadable(opts.minSize)})`,
    }
  }

  // MIME type validation
  if (!opts.allowedMimeTypes.includes(file.type)) {
    const allowedTypes = opts.allowedMimeTypes.map((type) => type.split("/")[1]).join(", ")
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Allowed types: ${allowedTypes}`,
    }
  }

  // File name validation
  if (!file.name || file.name.trim().length === 0) {
    return {
      isValid: false,
      error: "File must have a valid name",
    }
  }

  // Success case
  return {
    isValid: true,
    metadata: {
      size: fileSizeReadable(file.size),
      type: file.type,
      name: file.name,
      lastModified: new Date(file.lastModified),
    },
  }
}

// ============================================================================
// Additional Helper Functions
// ============================================================================

/**
 * Extracts file extension from filename
 * @param filename - The filename to extract extension from
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : ""
}

/**
 * Gets comprehensive file metadata
 * @param file - The file to analyze
 * @returns Complete file metadata object
 */
export function getFileMetadata(file: File): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: fileSizeReadable(file.size),
    type: file.type,
    lastModified: new Date(file.lastModified),
    extension: getFileExtension(file.name),
  }
}

/**
 * Checks if a file is an audio file based on MIME type
 * @param file - The file to check
 * @returns True if file is an audio file
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/")
}

/**
 * Creates a safe filename by removing/replacing invalid characters
 * @param filename - Original filename
 * @returns Sanitized filename safe for most filesystems
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace invalid chars with underscore
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .toLowerCase()
}

/**
 * Generates a unique filename by appending timestamp
 * @param originalName - Original filename
 * @param includeRandom - Whether to include random suffix (default: false)
 * @returns Unique filename
 */
export function generateUniqueFilename(originalName: string, includeRandom = false): string {
  const extension = getFileExtension(originalName)
  const nameWithoutExt = originalName.slice(0, originalName.lastIndexOf("."))
  const timestamp = Date.now()
  const randomSuffix = includeRandom ? `_${Math.random().toString(36).substr(2, 5)}` : ""

  return `${sanitizeFilename(nameWithoutExt)}_${timestamp}${randomSuffix}.${extension}`
}

// ============================================================================
// Validation Presets
// ============================================================================

/** Strict validation for production uploads */
export const STRICT_AUDIO_VALIDATION: ValidationOptions = {
  maxSize: 25 * 1024 * 1024, // 25MB
  minSize: 5 * 1024, // 5KB
  allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/m4a"],
}

/** Lenient validation for development/testing */
export const LENIENT_AUDIO_VALIDATION: ValidationOptions = {
  maxSize: 100 * 1024 * 1024, // 100MB
  minSize: 100, // 100B
  allowedMimeTypes: [...DEFAULT_AUDIO_VALIDATION.allowedMimeTypes, "audio/x-ms-wma", "audio/amr", "audio/3gpp"],
}

// ============================================================================
// Usage Examples (for documentation)
// ============================================================================

/*
// Example 1: Basic file upload preparation
const file = event.target.files[0];
const validation = validateAudioFile(file);
if (validation.isValid) {
  const formData = fileToFormData(file, 'audio', { userId: '123' });
  // Upload formData...
}

// Example 2: File size display
const sizeText = fileSizeReadable(file.size); // "2.5 MB"

// Example 3: Custom validation
const result = validateAudioFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['audio/mpeg', 'audio/wav']
});

// Example 4: File metadata extraction
const metadata = getFileMetadata(file);
console.log(`${metadata.name} (${metadata.sizeFormatted})`);
*/
