/**
 * @fileoverview CogniSpeech Analysis Feature - Public API
 *
 * This module exports the complete public API for the speech analysis feature.
 * Import components, hooks, and types from this single entry point to ensure
 * consistent usage across the application.
 */

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Main dashboard component for displaying analysis results
 * Includes charts, metrics, AI summary, and export functionality
 */
export { Dashboard } from "./components/Dashboard"

/**
 * Interactive time-series chart with D3.js integration
 * Supports dual Y-axes, brushing, zooming, and accessibility features
 */
export { TimeSeriesChart } from "./components/TimeSeriesChart"

/**
 * AI-generated summary component with interactive citations
 * Includes feedback controls, copy/edit/regenerate functionality
 */
export { AISummary } from "./components/AISummary"

/**
 * List view for displaying multiple analyses
 * Supports card and row layouts with action buttons
 */
export { AnalysisList } from "./components/AnalysisList"

/**
 * Reusable card component for individual analysis display
 * Used by AnalysisList and Dashboard summary sections
 */
export { AnalysisCard } from "./components/AnalysisCard"

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Polling hook for real-time analysis updates
 * Includes exponential backoff, pause/resume, and cleanup
 */
export { useAnalysisPolling } from "./hooks/useAnalysisPolling"

/**
 * D3.js integration hook for React components
 * Manages render lifecycle and cleanup automatically
 */
export { useD3, useD3Selection } from "./hooks/useD3"

/**
 * Chart-specific D3 hook with analysis data integration
 * Provides chart rendering and interaction management
 */
export { useD3Chart } from "./hooks/useD3Chart"

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

// Core data types
export type {
  AnalysisResult,
  AnalysisState,
} from "@/types/analysis.types"

// Define missing types locally
export type MetricKey = 'confidence' | 'sentiment' | 'wpm' | 'pauseCount' | 'fillerWords' | 'emotionalIntensity' | 'clarity' | 'engagement'
export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Utility functions for analysis data processing
 */
export {
  formatMetricValue,
  calculateMetricStats,
  filterAnalysisByDateRange,
  exportAnalysisToCSV,
} from "./utils/analysisUtils"

/**
 * Chart utility functions
 */
export {
  createTimeScale,
  createLinearScale,
  formatTooltipContent,
  getMetricColor,
} from "./utils/chartUtils"
