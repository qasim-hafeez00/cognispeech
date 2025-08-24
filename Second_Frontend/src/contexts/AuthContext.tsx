"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';

// User interface
export interface User {
  id: string;
  external_id: string;
  email?: string;
  name?: string;
  role: 'patient' | 'caregiver' | 'admin';
  created_at: string;
  last_login?: string;
}

// Authentication state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  token: null,
};

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

// Context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const toast = useToast();

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('cognispeech_token');
      if (token) {
        try {
          await loginWithToken(token);
        } catch (error) {
          // Invalid token, clear it
          localStorage.removeItem('cognispeech_token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Mock login function (replace with actual API call)
  const login = async (email: string, _password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data (replace with actual API response)
      const mockUser: User = {
        id: '1',
        external_id: 'user_123',
        email,
        name: 'John Doe',
        role: 'patient',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      // Store token
      localStorage.setItem('cognispeech_token', mockToken);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: mockUser, token: mockToken },
      });

      toast({
        title: 'Login successful',
        description: `Welcome back, ${mockUser.name}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Login with existing token
  const loginWithToken = async (token: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Simulate API call to validate token
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock user data (replace with actual API response)
      const mockUser: User = {
        id: '1',
        external_id: 'user_123',
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'patient',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: mockUser, token },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('cognispeech_token');
    dispatch({ type: 'AUTH_LOGOUT' });
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Update user information
  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.token) return;

    try {
      // Simulate API call to refresh user data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock updated user data (replace with actual API response)
      const updatedUser: User = {
        ...state.user!,
        last_login: new Date().toISOString(),
      };

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithToken,
    logout,
    clearError,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export context and types
export { AuthContext, type AuthContextType };

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for protected routes
export const useRequireAuth = (): User => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You could return a loading state or throw an error
    throw new Error('Authentication is loading');
  }

  if (!isAuthenticated || !user) {
    // You could redirect to login or throw an error
    throw new Error('Authentication required');
  }

  return user;
};
