import { useContext } from 'react'
import { AuthContext, AuthContextType } from '@/contexts/AuthContext'

/**
 * Hook to access authentication context
 * Provides typed authentication helpers and user state
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 * 
 * if (isAuthenticated) {
 *   return <Dashboard />
 * } else {
 *   return <LoginForm onSubmit={login} />
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook for authentication helper functions
 * Provides utility functions for common auth operations
 */
export const useAuthHelpers = () => {
  const { user } = useAuth()
  
  /**
   * Check if user has a specific role
   * @param role - Role to check
   * @returns boolean indicating if user has the role
   */
  const hasRole = (role: 'user' | 'admin' | 'analyst'): boolean => {
    return user?.role === role
  }
  
  /**
   * Get user's display name
   * @returns User's display name or email fallback
   */
  const getDisplayName = (): string => {
    return user?.name || user?.email || 'User'
  }
  
  /**
   * Check if user is an admin
   * @returns boolean indicating if user is admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin')
  }
  
  /**
   * Get authorization header for API requests
   * @returns Object with Authorization header
   */
  const getAuthHeader = (): Record<string, string> => {
    const { token } = useAuth()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  
  return {
    hasRole,
    getDisplayName,
    isAdmin,
    getAuthHeader,
  }
}

/**
 * Hook for authentication state
 * Provides reactive authentication state values
 */
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    // Derived state
    isLoggedOut: !isLoading && !isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name,
    userRole: user?.role,
  }
}

/**
 * Hook for authentication actions
 * Provides authentication action functions
 */
export const useAuthActions = () => {
  const { login, logout, refreshUser } = useAuth()
  
  return {
    login,
    logout,
    refreshUser,
  }
}

// Re-export types for convenience
export type { User } from '@/contexts/AuthContext'

