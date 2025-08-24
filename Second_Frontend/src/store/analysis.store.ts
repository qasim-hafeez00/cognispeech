import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { analysisService } from '@/services/analysis.service';
import {
  AnalysisState,
  AnalysisFilters,
  MetricConfig,
  DateRange,
  mapBackendStatusToFrontend,
} from '@/types/analysis.types';

interface PollingState {
  timerId: NodeJS.Timeout | null;
  retryCount: number;
  currentInterval: number;
  abortController: AbortController | null;
}

interface AnalysisStore {
  // Core State
  analyses: Record<string, AnalysisState>;
  currentAnalysisId: string | null;
  isUploading: boolean;
  error: string | null;
  filters: AnalysisFilters;
  visibleMetrics: string[];
  dateRange: DateRange | null;

  // Internal State
  _pollingStates: Record<string, PollingState>;

  // Core Actions
  uploadFile: (file: File, userId: string) => Promise<void>;
  pollForResults: (analysisId: string, options?: PollOptions) => Promise<void>;
  clearError: () => void;
  setCurrentAnalysisId: (id: string | null) => void;
  loadUserAnalyses: (userId: string) => Promise<void>;
  loadAnalysisDetails: (analysisId: string) => Promise<void>;
  retryAnalysis: (analysisId: string) => Promise<void>;
  deleteAnalysis: (analysisId: string) => Promise<void>;
  updateFilters: (filters: Partial<AnalysisFilters>) => void;
  toggleMetricVisibility: (metricKey: string) => void;
  setDateRange: (range: DateRange | null) => void;

  // Internal Actions
  _stopPolling: (analysisId: string) => void;
  _updateAnalysis: (id: string, updates: Partial<AnalysisState>) => void;
  _setUploading: (uploading: boolean) => void;
  _setError: (error: string | null) => void;
}

interface PollOptions {
  initialInterval?: number;
  maxInterval?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
}

const DEFAULT_METRICS: MetricConfig[] = [
  {
    key: 'mean_pitch_hz',
    label: 'Mean Pitch',
    color: '#3182CE',
    visible: true,
    unit: 'Hz',
    description: 'Average fundamental frequency',
  },
  {
    key: 'jitter_percent',
    label: 'Jitter',
    color: '#E53E3E',
    visible: true,
    unit: '%',
    description: 'Frequency perturbation measure',
  },
  {
    key: 'shimmer_percent',
    label: 'Shimmer',
    color: '#38A169',
    visible: true,
    unit: '%',
    description: 'Amplitude perturbation measure',
  },
  {
    key: 'sentiment_score',
    label: 'Sentiment',
    color: '#D69E2E',
    visible: true,
    unit: 'score',
    description: 'Emotional sentiment analysis',
  },
];

export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      analyses: {},
      currentAnalysisId: null,
      isUploading: false,
      error: null,
      filters: {
        status: [],
        metrics: [],
        sentiment: [],
      },
      visibleMetrics: DEFAULT_METRICS
        .filter(m => m.visible)
        .map(m => m.key),
      dateRange: null,
      _pollingStates: {},

      // Core Actions
      uploadFile: async (file: File, userId: string) => {
        const store = get();
        store._setUploading(true);
        store._setError(null);

        try {
          const response = await analysisService.uploadAudio(file, userId);
          
          const newAnalysis: AnalysisState = {
            id: response.analysis_id.toString(),
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            visibleMetrics: [],
          };

          set(state => ({
            analyses: {
              ...state.analyses,
              [newAnalysis.id]: newAnalysis,
            },
            currentAnalysisId: newAnalysis.id,
            isUploading: false,
          }));

          // Start polling for results
          store.pollForResults(newAnalysis.id);

        } catch (error) {
          store._setError(error instanceof Error ? error.message : 'Upload failed');
          store._setUploading(false);
        }
      },

      pollForResults: async (analysisId: string, options: PollOptions = {}) => {
        const store = get();
        const {
          initialInterval = 2000,
          maxInterval = 30000,
          maxRetries = 30,
          backoffMultiplier = 1.5,
        } = options;

        // Stop any existing polling
        store._stopPolling(analysisId);

        const abortController = new AbortController();
        let currentInterval = initialInterval;
        let retryCount = 0;

        const poll = async (): Promise<void> => {
          if (abortController.signal.aborted) return;

          try {
            const response = await analysisService.getAnalysisResults(
              parseInt(analysisId)
            );

            if (response.status === 'COMPLETE' && response.results) {
              // Analysis completed successfully
              store._updateAnalysis(analysisId, {
                status: 'completed',
                progress: 100,
                results: response.results,
                updatedAt: new Date().toISOString(),
              });
              store._stopPolling(analysisId);
              return;
            }

            if (response.status === 'FAILED') {
              // Analysis failed
              store._updateAnalysis(analysisId, {
                status: 'failed',
                error: 'Analysis failed during processing',
                updatedAt: new Date().toISOString(),
              });
              store._stopPolling(analysisId);
              return;
            }

            // Update progress for processing state
            if (response.status === 'PROCESSING') {
              store._updateAnalysis(analysisId, {
                status: 'processing',
                progress: 50, // Approximate progress
                updatedAt: new Date().toISOString(),
              });
            }

            // Continue polling
            if (retryCount < maxRetries) {
              retryCount++;
              currentInterval = Math.min(
                currentInterval * backoffMultiplier,
                maxInterval
              );

              const timerId = setTimeout(poll, currentInterval);
              set(state => ({
                _pollingStates: {
                  ...state._pollingStates,
                  [analysisId]: {
                    timerId,
                    retryCount,
                    currentInterval,
                    abortController,
                  },
                },
              }));
            } else {
              // Max retries exceeded
              store._updateAnalysis(analysisId, {
                status: 'failed',
                error: 'Analysis polling timed out',
                updatedAt: new Date().toISOString(),
              });
              store._stopPolling(analysisId);
            }

          } catch (error) {
            console.error(`Polling error for analysis ${analysisId}:`, error);
            
            if (retryCount < maxRetries) {
              retryCount++;
              currentInterval = Math.min(
                currentInterval * backoffMultiplier,
                maxInterval
              );

              const timerId = setTimeout(poll, currentInterval);
              set(state => ({
                _pollingStates: {
                  ...state._pollingStates,
                  [analysisId]: {
                    timerId,
                    retryCount,
                    currentInterval,
                    abortController,
                  },
                },
              }));
            } else {
              store._updateAnalysis(analysisId, {
                status: 'failed',
                error: 'Analysis polling failed',
                updatedAt: new Date().toISOString(),
              });
              store._stopPolling(analysisId);
            }
          }
        };

        // Start polling
        const timerId = setTimeout(poll, currentInterval);
        set(state => ({
          _pollingStates: {
            ...state._pollingStates,
            [analysisId]: {
              timerId,
              retryCount: 0,
              currentInterval,
              abortController,
            },
          },
        }));
      },

      clearError: () => set({ error: null }),

      setCurrentAnalysisId: (id: string | null) => set({ currentAnalysisId: id }),

      loadUserAnalyses: async (userId: string) => {
        try {
          const analyses = await analysisService.getUserAnalyses(userId);
          
          // Convert backend analyses to frontend format
          const analysisStates: Record<string, AnalysisState> = {};
          analyses.forEach(analysis => {
            const analysisState: AnalysisState = {
              id: analysis.id.toString(),
              status: mapBackendStatusToFrontend(analysis.status),
              progress: analysis.status === 'COMPLETE' ? 100 : 0,
              results: analysis.status === 'COMPLETE' ? analysis : null,
              createdAt: analysis.created_at,
              updatedAt: analysis.updated_at,
              error: undefined,
              visibleMetrics: [],
            };
            analysisStates[analysis.id.toString()] = analysisState;
          });

          set({ analyses: analysisStates });
        } catch (error) {
          console.error('Failed to load user analyses:', error);
          get()._setError('Failed to load analysis history');
        }
      },

      loadAnalysisDetails: async (analysisId: string) => {
        try {
          const detailedResults = await analysisService.getAnalysisResults(parseInt(analysisId));
          
          // Update the analysis with detailed results
          get()._updateAnalysis(analysisId, {
            results: detailedResults.results || detailedResults,
            status: mapBackendStatusToFrontend(detailedResults.status),
            updatedAt: new Date().toISOString(),
          });
          
          console.log('Analysis details loaded for ID:', analysisId, detailedResults);
        } catch (error) {
          console.error('Failed to load analysis details:', error);
          get()._setError('Failed to load analysis details');
        }
      },

      retryAnalysis: async (analysisId: string) => {
        try {
          await analysisService.retryAnalysis(parseInt(analysisId));
          
          // Reset analysis state and start polling
          get()._updateAnalysis(analysisId, {
            status: 'processing',
            progress: 0,
            error: undefined,
            updatedAt: new Date().toISOString(),
          });

          get().pollForResults(analysisId);
        } catch (error) {
          console.error('Failed to retry analysis:', error);
          get()._setError('Failed to retry analysis');
        }
      },

      deleteAnalysis: async (analysisId: string) => {
        try {
          await analysisService.deleteAnalysis(parseInt(analysisId));
          
          // Remove from store
          set(state => {
            const { [analysisId]: deleted, ...remaining } = state.analyses;
            return { analyses: remaining };
          });

          // Stop polling if active
          get()._stopPolling(analysisId);
        } catch (error) {
          console.error('Failed to delete analysis:', error);
          get()._setError('Failed to delete analysis');
        }
      },

      updateFilters: (filters: Partial<AnalysisFilters>) =>
        set(state => ({
          filters: { ...state.filters, ...filters },
        })),

      toggleMetricVisibility: (metricKey: string) =>
        set(state => ({
          visibleMetrics: state.visibleMetrics.includes(metricKey)
            ? state.visibleMetrics.filter(key => key !== metricKey)
            : [...state.visibleMetrics, metricKey],
        })),

      setDateRange: (range: DateRange | null) => set({ dateRange: range }),

      // Internal Actions
      _stopPolling: (analysisId: string) => {
        const store = get();
        const pollingState = store._pollingStates[analysisId];
        
        if (pollingState) {
          if (pollingState.timerId) {
            clearTimeout(pollingState.timerId);
          }
          if (pollingState.abortController) {
            pollingState.abortController.abort();
          }
        }

        set(state => {
          const { [analysisId]: removed, ...remaining } = state._pollingStates;
          return { _pollingStates: remaining };
        });
      },

      _updateAnalysis: (id: string, updates: Partial<AnalysisState>) =>
        set(state => {
          const existingAnalysis = state.analyses[id];
          if (!existingAnalysis) return state;
          
          return {
            analyses: {
              ...state.analyses,
              [id]: {
                ...existingAnalysis,
                ...updates,
              },
            },
          };
        }),

      _setUploading: (uploading: boolean) => set({ isUploading: uploading }),

      _setError: (error: string | null) => set({ error }),
    }))
  )
);

// Selector hooks for efficient component updates
export const useCurrentAnalysis = () =>
  useAnalysisStore((state) => {
    const currentId = state.currentAnalysisId;
    return currentId ? state.analyses[currentId] : null;
  });

export const useAnalysisById = (id: string | null) =>
  useAnalysisStore((state) => (id ? state.analyses[id] || null : null));

export const useAnalysesList = () =>
  useAnalysisStore((state) =>
    Object.values(state.analyses).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  );

export const useAnalysesByStatus = (status: AnalysisState['status']) =>
  useAnalysisStore((state) =>
    Object.values(state.analyses).filter((analysis) => analysis.status === status)
  );

export const useUploadState = () =>
  useAnalysisStore((state) => ({
    isUploading: state.isUploading,
    error: state.error,
  }));

export const useCurrentAnalysisResults = () =>
  useAnalysisStore((state) => {
    const currentId = state.currentAnalysisId;
    const analysis = currentId ? state.analyses[currentId] : null;
    return analysis?.results || null;
  });

export const useAnalysisMetrics = (analysisId: string | null, metricKeys: string[]) =>
  useAnalysisStore((state) => {
    if (!analysisId) return null;
    const analysis = state.analyses[analysisId];
    if (!analysis?.results) return null;

    const metrics: Record<string, number> = {};
    metricKeys.forEach(key => {
      if (analysis.results && key in analysis.results) {
        metrics[key] = (analysis.results as any)[key];
      }
    });
    return metrics;
  });

export const useAnalysisCleanup = () => {
  const store = useAnalysisStore();
  
  return () => {
    // Stop all active polling when component unmounts
    Object.keys(store._pollingStates).forEach(analysisId => {
      store._stopPolling(analysisId);
    });
  };
};
