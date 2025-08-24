export interface User {
  id: string | number;
  external_id?: string;
  email: string;
  name?: string;
  role?: 'patient' | 'caregiver' | 'admin' | 'user' | 'analyst';
  avatar?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  last_login?: string;
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FileUpload {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

export type LoadingState = "idle" | "loading" | "success" | "error"
