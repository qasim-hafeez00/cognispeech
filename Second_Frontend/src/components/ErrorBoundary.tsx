import React, { Component, ReactNode } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={8}
          bg={useColorModeValue('gray.50', 'gray.900')}
        >
          <VStack spacing={6} maxW="md" textAlign="center">
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text fontWeight="semibold">Something went wrong</Text>
            </Alert>
            
            <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
              Unexpected Error
            </Heading>
            
            <Text color={useColorModeValue('gray.600', 'gray.400')} lineHeight="tall">
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
            </Text>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                p={4}
                bg={useColorModeValue('gray.100', 'gray.700')}
                borderRadius="md"
                textAlign="left"
                maxW="full"
                overflow="auto"
              >
                <Text fontSize="sm" fontFamily="mono" color={useColorModeValue('gray.700', 'gray.300')}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mt={2}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </Box>
            )}

            <VStack spacing={3} w="full">
              <Button
                colorScheme="blue"
                onClick={this.handleReset}
                w="full"
                size="lg"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleReload}
                w="full"
                size="lg"
              >
                Reload Page
              </Button>
            </VStack>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

// Higher-order component for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function ErrorBoundaryWrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for functional components to catch errors
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // You can add error reporting logic here
    // e.g., send to error tracking service like Sentry
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', errorInfo)
    }
  }, [])
}
