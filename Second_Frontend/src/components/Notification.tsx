import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { useToast, UseToastOptions, ToastId } from '@chakra-ui/react'
import { useAnalysisStore } from '@/store/analysis.store'

// Notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

// Notification configuration interface
export interface NotificationConfig {
  type: NotificationType
  title: string
  description?: string
  duration?: number
  dismissible?: boolean
  action?: React.ReactElement
  onClose?: () => void
}

// Notification context interface
export interface NotificationContextType {
  showNotification: (config: NotificationConfig) => ToastId
  showSuccess: (title: string, description?: string) => ToastId
  showError: (title: string, description?: string) => ToastId
  showInfo: (title: string, description?: string) => ToastId
  showWarning: (title: string, description?: string) => ToastId
  closeNotification: (id: ToastId) => void
  closeAllNotifications: () => void
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Hook to use notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Notification provider props
interface NotificationProviderProps {
  children: ReactNode
  defaultDuration?: number
  defaultDismissible?: boolean
  maxNotifications?: number
}

// Notification provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  defaultDuration = 5000,
  defaultDismissible = true,
}) => {
  const toast = useToast()
  const { error, clearError } = useAnalysisStore()

  // Get toast variant based on notification type
  const getToastVariant = useCallback((type: NotificationType): UseToastOptions['status'] => {
    switch (type) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'info'
    }
  }, [])

  // Get toast color scheme based on notification type
  const getToastColorScheme = useCallback((type: NotificationType): UseToastOptions['colorScheme'] => {
    switch (type) {
      case 'success':
        return 'green'
      case 'error':
        return 'red'
      case 'warning':
        return 'orange'
      case 'info':
      default:
        return 'blue'
    }
  }, [])

  // Show notification with custom configuration
  const showNotification = useCallback((config: NotificationConfig): ToastId => {
    const {
      type,
      title,
      description,
      duration = defaultDuration,
      dismissible = defaultDismissible,
      onClose,
    } = config

    const toastOptions: UseToastOptions = {
      title,
      description,
      status: getToastVariant(type),
      colorScheme: getToastColorScheme(type),
      duration,
      isClosable: dismissible,
      position: 'top-right',
      variant: 'solid',
      onCloseComplete: onClose,
    }

    // Note: action property is not supported in Chakra UI v3
    // if (action) {
    //   toastOptions.action = action
    // }

    return toast(toastOptions)
  }, [toast, getToastVariant, getToastColorScheme, defaultDuration, defaultDismissible])

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, description?: string): ToastId => {
    return showNotification({ type: 'success', title, description })
  }, [showNotification])

  const showError = useCallback((title: string, description?: string): ToastId => {
    return showNotification({ type: 'error', title, description })
  }, [showNotification])

  const showInfo = useCallback((title: string, description?: string): ToastId => {
    return showNotification({ type: 'info', title, description })
  }, [showNotification])

  const showWarning = useCallback((title: string, description?: string): ToastId => {
    return showNotification({ type: 'warning', title, description })
  }, [showNotification])

  // Close specific notification
  const closeNotification = useCallback((id: ToastId): void => {
    toast.close(id)
  }, [toast])

  // Close all notifications
  const closeAllNotifications = useCallback((): void => {
    toast.closeAll()
  }, [toast])

  // Auto-show error notifications from store
  React.useEffect(() => {
    if (error) {
      showError('Analysis Error', error)
      // Clear the error after showing notification
      setTimeout(() => {
        clearError()
      }, 100)
    }
  }, [error, showError, clearError])

  // Context value
  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    closeNotification,
    closeAllNotifications,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

// Higher-order component for components that need notifications
export function withNotifications<P extends object>(
  Component: React.ComponentType<P & { notification: NotificationContextType }>
) {
  return function NotificationWrappedComponent(props: P) {
    const notification = useNotification()
    return <Component {...props} notification={notification} />
  }
}

// Standalone notification components for direct use
export const Notification: React.FC<NotificationConfig> = (config) => {
  const { showNotification } = useNotification()
  
  React.useEffect(() => {
    showNotification(config)
  }, [config, showNotification])
  
  return null
}

// Export default notification provider
export default NotificationProvider
