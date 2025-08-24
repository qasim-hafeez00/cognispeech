/**
 * Chart utility functions for D3.js integration
 */

// Define MetricKey type locally since it's not available in the main types
type MetricKey = 'confidence' | 'sentiment' | 'wpm' | 'pauseCount' | 'fillerWords' | 'emotionalIntensity' | 'clarity' | 'engagement'

/**
 * Create a time scale for D3 charts
 */
export function createTimeScale(
  data: Array<{ timestamp: string | number }>,
  width: number,
  margin: { left: number; right: number }
) {
  const d3 = require('d3')
  
  const timeExtent = d3.extent(data, (d: any) => new Date(d.timestamp))
  return d3.scaleTime()
    .domain(timeExtent)
    .range([margin.left, width - margin.right])
}

/**
 * Create a linear scale for D3 charts
 */
export function createLinearScale(
  data: number[],
  height: number,
  margin: { top: number; bottom: number }
) {
  const d3 = require('d3')
  
  return d3.scaleLinear()
    .domain([0, d3.max(data) || 0])
    .range([height - margin.bottom, margin.top])
}

/**
 * Format tooltip content for chart points
 */
export function formatTooltipContent(
  data: any,
  metric: MetricKey,
  timestamp: string | number
): string {
  const date = new Date(timestamp).toLocaleString()
  const value = formatMetricValue(data[metric], metric)
  return `${metric}: ${value}<br/>Time: ${date}`
}

/**
 * Get color for a specific metric
 */
export function getMetricColor(metric: MetricKey): string {
  const colors: Record<MetricKey, string> = {
    confidence: '#3B82F6',
    sentiment: '#10B981',
    wpm: '#F59E0B',
    pauseCount: '#EF4444',
    fillerWords: '#8B5CF6',
    emotionalIntensity: '#EC4899',
    clarity: '#06B6D4',
    engagement: '#84CC16'
  }
  
  return colors[metric] || '#6B7280'
}

/**
 * Format metric value for display (re-export from analysisUtils)
 */
function formatMetricValue(value: number, metric: MetricKey): string {
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
