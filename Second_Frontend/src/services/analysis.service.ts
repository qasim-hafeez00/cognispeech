import axios from '@/lib/axios';
import {
  AnalysisResult,
  AnalysisStatusResponse,
  FileUploadResponse,
  WeeklySummaryResponse,
  RetryResponse,
  AnalysisFilters,
  ExportOptions,
  BackendAnalysisStatus,
} from '@/types/analysis.types';
import { 
  BACKEND_CONFIG, 
  getUploadUrl, 
  getResultsUrl, 
  getRetryUrl, 
  getUserAnalysesUrl, 
  getWeeklySummaryUrl,
  getExportUrl,
  getDeleteUrl,
  getFilterUrl
} from '@/lib/config';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class AnalysisService {
  private static instance: AnalysisService;
  
  private constructor() {}
  
  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  /**
   * Upload audio file for analysis
   */
  async uploadAudio(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<FileUploadResponse>(
        `${API_BASE}${getUploadUrl(userId)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Upload failed:', error);
      
      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        if (status === 413) {
          throw new Error('File too large. Maximum size is 50MB.');
        } else if (status === 415) {
          throw new Error('Unsupported file type. Please use WAV, MP3, M4A, or FLAC.');
        } else if (status === 400) {
          throw new Error(data?.message || 'Invalid file format or corrupted file.');
        } else if (status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (status === 403) {
          throw new Error('Access denied. You do not have permission to upload files.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      } else if (error.request) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw new Error(error.message || 'Failed to upload audio file');
    }
  }

  /**
   * Get analysis results by ID
   */
  async getAnalysisResults(analysisId: number): Promise<AnalysisStatusResponse> {
    try {
      const response = await axios.get<AnalysisStatusResponse>(
        `${API_BASE}${getResultsUrl(analysisId)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get analysis results:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Analysis not found. It may have been deleted or never existed.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw new Error('Failed to retrieve analysis results');
    }
  }

  /**
   * Retry a failed analysis
   */
  async retryAnalysis(analysisId: number): Promise<RetryResponse> {
    try {
      const response = await axios.post<RetryResponse>(
        `${API_BASE}${getRetryUrl(analysisId)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to retry analysis:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Analysis not found. Cannot retry.');
      } else if (error.response?.status === 400) {
        throw new Error('Analysis cannot be retried. It may be in progress or already completed.');
      }
      
      throw new Error('Failed to retry analysis');
    }
  }

  /**
   * Get all analyses for a specific user
   */
  async getUserAnalyses(
    userId: string,
    limit: number = 100
  ): Promise<AnalysisResult[]> {
    try {
      const response = await axios.get<AnalysisResult[]>(
        `${API_BASE}${getUserAnalysesUrl(userId)}`,
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user analyses:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only view your own analyses.');
      }
      
      throw new Error('Failed to retrieve user analyses');
    }
  }

  /**
   * Get weekly summary for a user
   */
  async getWeeklySummary(
    userId: string,
    days: number = 7
  ): Promise<WeeklySummaryResponse> {
    try {
      const response = await axios.get<WeeklySummaryResponse>(
        `${API_BASE}${getWeeklySummaryUrl(userId)}`,
        {
          params: { days },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get weekly summary:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw new Error('Failed to retrieve weekly summary');
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`);
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      
      if (error.response?.status >= 500) {
        throw new Error('Backend service is unavailable. Please try again later.');
      }
      
      throw new Error('Service health check failed');
    }
  }

  /**
   * Poll for analysis results with exponential backoff
   */
  async pollForResults(
    analysisId: number,
    maxAttempts: number = 30,
    baseDelay: number = 2000
  ): Promise<AnalysisResult> {
    let attempt = 0;
    let delay = baseDelay;

    while (attempt < maxAttempts) {
      try {
        const response = await this.getAnalysisResults(analysisId);
        
        if (response.status === 'COMPLETE' && response.results) {
          return response.results;
        }
        
        if (response.status === 'FAILED') {
          throw new Error('Analysis failed during processing');
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay = Math.min(delay * 1.5, 30000); // Max 30 seconds
        attempt++;
        
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        attempt++;
        
        if (attempt >= maxAttempts) {
          throw new Error('Analysis polling timed out');
        }
      }
    }

    throw new Error('Analysis polling exceeded maximum attempts');
  }

  /**
   * Get analysis status with proper error handling
   */
  async getAnalysisStatus(analysisId: number): Promise<BackendAnalysisStatus> {
    try {
      const response = await this.getAnalysisResults(analysisId);
      return response.status;
    } catch (error) {
      console.error('Failed to get analysis status:', error);
      throw new Error('Failed to retrieve analysis status');
    }
  }

  /**
   * Export analysis data
   */
  async exportAnalysis(
    analysisId: number,
    options: ExportOptions
  ): Promise<Blob> {
    try {
      const response = await axios.post(
        `${API_BASE}${getExportUrl(analysisId)}`,
        options,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Export failed:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Analysis not found. Cannot export.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid export options provided.');
      }
      
      throw new Error('Failed to export analysis data');
    }
  }

  /**
   * Delete an analysis
   */
  async deleteAnalysis(analysisId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}${getDeleteUrl(analysisId)}`);
    } catch (error: any) {
      console.error('Delete failed:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Analysis not found. It may have already been deleted.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only delete your own analyses.');
      }
      
      throw new Error('Failed to delete analysis');
    }
  }

  /**
   * Get filtered analyses
   */
  async getFilteredAnalyses(
    userId: string,
    filters: AnalysisFilters
  ): Promise<AnalysisResult[]> {
    try {
      const response = await axios.post<AnalysisResult[]>(
        `${API_BASE}${getFilterUrl(userId)}`,
        filters
      );
      return response.data;
    } catch (error: any) {
      console.error('Filtered analysis failed:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid filter parameters provided.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw new Error('Failed to retrieve filtered analyses');
    }
  }
}

// Export singleton instance
export const analysisService = AnalysisService.getInstance();
