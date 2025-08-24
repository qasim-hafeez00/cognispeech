/**
 * Global shared types and interfaces for CogniSpeech
 * Centralizes common types used across features and provides utility types
 */

/**
 * User entity representing authenticated users
 */
export interface User {
  /** Unique user identifier */
  id: string
  /** User's email address */
  email: string
  /** Display name */
  name: string
  /** User avatar URL */
  avatar?: string
  /** User role for permissions */
  role: "user" | "admin" | "analyst"
  /** Account creation timestamp */
  createdAt: string
  /** Last login timestamp */
  lastLoginAt?: string
  /** User preferences */
  preferences: {
    theme: "light" | "dark" | "system"
    notifications: boolean
    defaultMetrics: string[]
  }
}

/**
 * Standardized API error response structure
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Additional error details */
  details?: Record<string, any>
  /** HTTP status code */
  status: number
  /** Request timestamp */
  timestamp: string
  /** Request ID for debugging */
  requestId?: string
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>
}

/**
 * Generic pagination metadata for API responses
 */
export interface Pagination {
  /** Current page number (1-based) */
  page: number
  /** Number of items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether there's a next page */
  hasNext: boolean
  /** Whether there's a previous page */
  hasPrev: boolean
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of data items */
  data: T[]
  /** Pagination metadata */
  pagination: Pagination
  /** Response metadata */
  meta?: Record<string, any>
}

/**
 * Utility type for nullable values
 */
export type Nullable<T> = T | null

/**
 * Utility type for optional values
 */
export type Optional<T> = T | undefined

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T
  /** Success status */
  success: boolean
  /** Response message */
  message?: string
  /** Response metadata */
  meta?: Record<string, any>
  /** Response timestamp */
  timestamp: string
}

/**
 * File upload progress information
 */
export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number
  /** Bytes uploaded */
  loaded: number
  /** Total bytes to upload */
  total: number
  /** Upload speed in bytes/second */
  speed?: number
  /** Estimated time remaining in seconds */
  timeRemaining?: number
}

/**
 * Generic loading state for async operations
 */
export interface LoadingState {
  /** Whether operation is in progress */
  isLoading: boolean
  /** Error if operation failed */
  error: Nullable<string>
  /** Success status */
  isSuccess: boolean
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Color mode */
  colorMode: "light" | "dark" | "system"
  /** Primary brand color */
  primaryColor: string
  /** Font size scale */
  fontSize: "sm" | "md" | "lg"
  /** Reduced motion preference */
  reducedMotion: boolean
}

// Re-export analysis types for centralized imports
export type {
  AnalysisResult,
  AnalysisState,
  AnalysisStatus,
  AnalysisDataPoint,
  MetricKey,
  AISummary,
  SummarySection,
  CitationReference,
  ChartConfig,
  ExportOptions,
} from "../features/analysis/types/types"

// Re-export upload types if they exist
// export type { UploadState } from "../features/upload/types" // Will be created later

/**
 * Global application state shape
 */
export interface AppState {
  /** Current authenticated user */
  user: Nullable<User>
  /** Authentication status */
  isAuthenticated: boolean
  /** Global loading state */
  isLoading: boolean
  /** Global error state */
  error: Nullable<string>
  /** Theme configuration */
  theme: ThemeConfig
}

/**
 * Environment configuration
 */
export interface EnvConfig {
  /** API base URL */
  apiBaseUrl: string
  /** Application environment */
  environment: "development" | "staging" | "production"
  /** Feature flags */
  features: {
    recording: boolean
    aiSummary: boolean
    export: boolean
    analytics: boolean
  }
}
