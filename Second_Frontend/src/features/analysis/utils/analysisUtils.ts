/**
 * Utility functions for analysis data processing
 */

import type { AnalysisResult } from '@/types/analysis.types'

// Define MetricKey type since it's not available in the main types
type MetricKey = 'confidence' | 'sentiment' | 'wpm' | 'pauseCount' | 'fillerWords' | 'emotionalIntensity' | 'clarity' | 'engagement'

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, metric: MetricKey): string {
  switch (metric) {
    case 'confidence':
      return `${(value * 100).toFixed(1)}%`
    case 'sentiment':
      return value > 0.6 ? 'Positive' : value < 0.4 ? 'Negative' : 'Neutral'
    case 'wpm':
      return `${value.toFixed(1)} WPM`
    case 'pauseCount':
      return `${Math.round(value)} pauses`
    case 'fillerWords':
      return `${Math.round(value)} fillers`
    case 'emotionalIntensity':
      return `${(value * 100).toFixed(1)}%`
    case 'clarity':
      return `${(value * 100).toFixed(1)}%`
    case 'engagement':
      return `${(value * 100).toFixed(1)}%`
    default:
      return value.toFixed(2)
  }
}

/**
 * Calculate basic statistics for a metric
 */
export function calculateMetricStats(data: AnalysisResult[], metric: MetricKey) {
  // Since AnalysisResult doesn't have timeSeries, we'll work with available properties
  const values: number[] = []
  
  data.forEach(result => {
    // Extract metric values from available properties
    switch (metric) {
      case 'confidence':
        if (result.overall_sentiment_score !== undefined) {
          values.push(result.overall_sentiment_score)
        }
        break
      case 'sentiment':
        if (result.overall_sentiment_score !== undefined) {
          values.push(result.overall_sentiment_score)
        }
        break
      case 'wpm':
        if (result.speech_rate_sps !== undefined) {
          values.push(result.speech_rate_sps)
        }
        break
      // Add other metrics as needed
    }
  })
  
  if (values.length === 0) return null
  
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  
  return { min, max, avg, count: values.length }
}

/**
 * Filter analysis results by date range
 */
export function filterAnalysisByDateRange(
  data: AnalysisResult[],
  startDate: string,
  endDate: string
): AnalysisResult[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return data.filter(result => {
    const createdAt = new Date(result.created_at)
    return createdAt >= start && createdAt <= end
  })
}

/**
 * Export analysis data to CSV format
 */
export function exportAnalysisToCSV(data: AnalysisResult[]): string {
  if (data.length === 0) return ''
  
  const headers = ['ID', 'Created At', 'Status', 'Sentiment', 'Pitch', 'Jitter', 'Shimmer']
  const rows = data.map(result => [
    result.id,
    result.created_at,
    result.status,
    result.overall_sentiment || 'N/A',
    result.mean_pitch_hz || 'N/A',
    result.jitter_local_percent || 'N/A',
    result.shimmer_local_percent || 'N/A'
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}
