"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAnalysisStore } from "@/store/analysis.store"

interface PollingOptions {
  /** Initial polling interval in milliseconds (default: 2000) */
  initialInterval?: number
  /** Maximum polling interval in milliseconds (default: 30000) */
  maxInterval?: number
  /** Backoff multiplier for exponential backoff (default: 1.5) */
  backoffMultiplier?: number
  /** Maximum number of retry attempts (default: 10) */
  maxRetries?: number
  /** Whether to use exponential backoff (default: true) */
  useExponentialBackoff?: boolean
}

interface PollingStatus {
  isPolling: boolean
  isPaused: boolean
  currentInterval: number
  retryCount: number
  lastError: string | null
}

interface AnalysisStatus {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  result?: any
}

export const useAnalysisPolling = (analysisId: string | null, options: PollingOptions = {}) => {
  const {
    initialInterval = 2000,
    maxInterval = 30000,
    backoffMultiplier = 1.5,
    maxRetries = 10,
    useExponentialBackoff = true,
  } = options

  // Zustand store integration
  const { _updateAnalysis, _setError, clearError } = useAnalysisStore()

  // State management
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>({
    isPolling: false,
    isPaused: false,
    currentInterval: initialInterval,
    retryCount: 0,
    lastError: null,
  })

  // Refs for memory-safe timer management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentIntervalRef = useRef(initialInterval)
  const retryCountRef = useRef(0)
  const isPausedRef = useRef(false)

  // Clear any existing timeout
  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Mock API call - replace with actual API integration
  const fetchAnalysisStatus = useCallback(async (id: string): Promise<AnalysisStatus> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock progressive status updates
    const mockStatuses: AnalysisStatus["status"][] = ["pending", "processing", "completed"]
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)] || "pending"

    return {
      id,
      status: randomStatus,
      progress: randomStatus === "completed" ? 100 : Math.floor(Math.random() * 90) + 10,
      result:
        randomStatus === "completed"
          ? {
              confidence: 85,
              transcription: "This is a sample transcription of the audio file.",
              sentiment: "positive",
              keywords: ["sample", "audio", "transcription"],
            }
          : undefined,
    }
  }, [])

  // Core polling function with exponential backoff
  const pollAnalysis = useCallback(async () => {
    if (!analysisId || isPausedRef.current) return

    try {
      setIsLoading(true)
      clearError()

      const analysisStatus = await fetchAnalysisStatus(analysisId)
      setStatus(analysisStatus)

      // Update Zustand store
      _updateAnalysis(analysisId, {
        status: analysisStatus.status,
        progress: analysisStatus.progress,
        ...(analysisStatus.result && { results: analysisStatus.result }),
      })

      // Reset retry count on successful fetch
      retryCountRef.current = 0
      currentIntervalRef.current = initialInterval

      setPollingStatus((prev) => ({
        ...prev,
        retryCount: 0,
        currentInterval: initialInterval,
        lastError: null,
      }))

      // Stop polling if analysis is complete or failed
      if (analysisStatus.status === "completed" || analysisStatus.status === "failed") {
        setPollingStatus((prev) => ({ ...prev, isPolling: false }))
        setIsLoading(false)
        return
      }

      // Schedule next poll if still processing
      if (!isPausedRef.current) {
        timeoutRef.current = setTimeout(pollAnalysis, currentIntervalRef.current)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown polling error"
      console.error("Error polling analysis status:", error)

      retryCountRef.current += 1

      setPollingStatus((prev) => ({
        ...prev,
        retryCount: retryCountRef.current,
        lastError: errorMessage,
      }))

      // Stop polling if max retries reached
      if (retryCountRef.current >= maxRetries) {
        _setError(`Polling failed after ${maxRetries} attempts: ${errorMessage}`)
        setPollingStatus((prev) => ({ ...prev, isPolling: false }))
        setIsLoading(false)
        return
      }

      // Apply exponential backoff
      if (useExponentialBackoff) {
        currentIntervalRef.current = Math.min(currentIntervalRef.current * backoffMultiplier, maxInterval)
      }

      setPollingStatus((prev) => ({
        ...prev,
        currentInterval: currentIntervalRef.current,
      }))

      // Schedule retry if not paused
      if (!isPausedRef.current) {
        timeoutRef.current = setTimeout(pollAnalysis, currentIntervalRef.current)
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    analysisId,
    fetchAnalysisStatus,
    _updateAnalysis,
    _setError,
    clearError,
    initialInterval,
    maxInterval,
    backoffMultiplier,
    maxRetries,
    useExponentialBackoff,
  ])

  // Start polling
  const startPolling = useCallback(() => {
    if (!analysisId || pollingStatus.isPolling) return

    isPausedRef.current = false
    setPollingStatus((prev) => ({ ...prev, isPolling: true, isPaused: false }))
    pollAnalysis()
  }, [analysisId, pollingStatus.isPolling, pollAnalysis])

  // Stop polling
  const stopPolling = useCallback(() => {
    clearCurrentTimeout()
    isPausedRef.current = false
    setPollingStatus((prev) => ({
      ...prev,
      isPolling: false,
      isPaused: false,
      currentInterval: initialInterval,
      retryCount: 0,
    }))
    retryCountRef.current = 0
    currentIntervalRef.current = initialInterval
  }, [clearCurrentTimeout, initialInterval])

  // Pause polling
  const pause = useCallback(() => {
    clearCurrentTimeout()
    isPausedRef.current = true
    setPollingStatus((prev) => ({ ...prev, isPaused: true }))
  }, [clearCurrentTimeout])

  // Resume polling
  const resume = useCallback(() => {
    if (!analysisId || !pollingStatus.isPolling) return

    isPausedRef.current = false
    setPollingStatus((prev) => ({ ...prev, isPaused: false }))
    pollAnalysis()
  }, [analysisId, pollingStatus.isPolling, pollAnalysis])

  // Auto-start polling when analysisId changes
  useEffect(() => {
    if (analysisId) {
      startPolling()
    } else {
      stopPolling()
    }

    // Cleanup on unmount or analysisId change
    return () => {
      clearCurrentTimeout()
      isPausedRef.current = false
    }
  }, [analysisId, startPolling, stopPolling, clearCurrentTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentTimeout()
    }
  }, [clearCurrentTimeout])

  return {
    // Status data
    status,
    isLoading,
    pollingStatus,

    // Control methods
    startPolling,
    stopPolling,
    pause,
    resume,

    // Utility methods
    isPolling: pollingStatus.isPolling,
    isPaused: pollingStatus.isPaused,
  }
}
