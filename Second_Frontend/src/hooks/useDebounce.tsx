"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
// import { jest } from "@jest/globals" // Import jest to declare the variable

/**
 * Generic debounce hook for values with configurable delay and options
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param options - Additional configuration options
 * @returns The debounced value
 *
 * @example
 * \`\`\`tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * \`\`\`
 */
export function useDebounce<T>(
  value: T,
  delay = 300,
  options: {
    /** Whether to trigger immediately on first call */
    leading?: boolean
    /** Maximum time to wait before forcing execution */
    maxWait?: number
  } = {},
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const { leading = false, maxWait } = options

  // Track if this is the first call for leading edge behavior
  const isFirstCall = useRef(true)
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Handle leading edge - execute immediately on first call
    if (leading && isFirstCall.current) {
      setDebouncedValue(value)
      isFirstCall.current = false
      return
    }

    // Set up the debounce timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
      // Clear max wait timeout if it exists
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current)
        maxWaitTimeoutRef.current = undefined
      }
    }, delay)

    // Set up max wait timeout if specified
    if (maxWait && !maxWaitTimeoutRef.current) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        clearTimeout(timeoutId)
        maxWaitTimeoutRef.current = undefined
      }, maxWait)
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current)
        maxWaitTimeoutRef.current = undefined
      }
    }
  }, [value, delay, leading, maxWait])

  // Reset first call flag when delay changes
  useEffect(() => {
    isFirstCall.current = true
  }, [delay])

  return debouncedValue
}

/**
 * Debounce hook for callback functions with automatic cleanup
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param deps - Dependency array for the callback (similar to useCallback)
 * @returns A debounced version of the callback
 *
 * @example
 * \`\`\`tsx
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => {
 *     console.log('Searching for:', query);
 *     // Perform API call
 *   },
 *   500,
 *   [] // dependencies
 * );
 *
 * // Usage in component
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * \`\`\`
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300,
  deps: React.DependencyList = [],
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Memoize the callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback(callback, deps)

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        memoizedCallback(...args)
      }, delay)
    }) as T,
    [memoizedCallback, delay],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Advanced debounce hook with cancel and flush capabilities
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Configuration options
 * @returns Object with debounced function and control methods
 *
 * @example
 * \`\`\`tsx
 * const { debouncedFn, cancel, flush, isPending } = useAdvancedDebounce(
 *   (value: string) => console.log('Debounced:', value),
 *   1000,
 *   { leading: true }
 * );
 *
 * // Cancel pending execution
 * const handleCancel = () => cancel();
 *
 * // Force immediate execution
 * const handleFlush = () => flush();
 * \`\`\`
 */
export function useAdvancedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
  } = {},
) {
  const { leading = false, trailing = true, maxWait } = options

  const timeoutRef = useRef<NodeJS.Timeout>()
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>()
  const lastCallTimeRef = useRef<number>(0)
  const lastArgsRef = useRef<Parameters<T>>()
  const [isPending, setIsPending] = useState(false)

  const execute = useCallback(() => {
    if (lastArgsRef.current) {
      callback(...lastArgsRef.current)
      setIsPending(false)
    }
  }, [callback])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = undefined
    }
    setIsPending(false)
  }, [])

  const flush = useCallback(() => {
    if (isPending) {
      cancel()
      execute()
    }
  }, [isPending, cancel, execute])

  const debouncedFn = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      lastArgsRef.current = args

      // Leading edge execution
      if (leading && !isPending) {
        callback(...args)
        lastCallTimeRef.current = now
        setIsPending(true)

        // Set up trailing execution if enabled
        if (trailing) {
          timeoutRef.current = setTimeout(() => {
            setIsPending(false)
          }, delay)
        } else {
          setIsPending(false)
        }
        return
      }

      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setIsPending(true)

      // Set up max wait timeout if specified and not already set
      if (maxWait && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          execute()
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          maxWaitTimeoutRef.current = undefined
        }, maxWait)
      }

      // Set up trailing execution
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          execute()
          if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current)
            maxWaitTimeoutRef.current = undefined
          }
        }, delay)
      }
    }) as T,
    [callback, delay, leading, trailing, maxWait, isPending, execute],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    debouncedFn,
    cancel,
    flush,
    isPending,
  }
}

// Type exports for external use
export type DebouncedFunction<T extends (...args: any[]) => any> = T & {
  cancel: () => void
  flush: () => void
  isPending: boolean
}

export type DebounceOptions = {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

/**
 * Test utilities for mocking timers in unit tests
 *
 * @example
 * \`\`\`tsx
 * // In your test file
 * import { act, renderHook } from '@testing-library/react';
 * import { useDebounce } from './useDebounce';
 *
 * beforeEach(() => {
 *   jest.useFakeTimers();
 * });
 *
 * afterEach(() => {
 *   jest.useRealTimers();
 * });
 *
 * test('should debounce value updates', () => {
 *   const { result, rerender } = renderHook(
 *     ({ value, delay }) => useDebounce(value, delay),
 *     { initialProps: { value: 'initial', delay: 500 } }
 *   );
 *
 *   expect(result.current).toBe('initial');
 *
 *   rerender({ value: 'updated', delay: 500 });
 *   expect(result.current).toBe('initial'); // Still old value
 *
 *   act(() => {
 *     jest.advanceTimersByTime(500);
 *   });
 *
 *   expect(result.current).toBe('updated'); // Now updated
 * });
 * \`\`\`
 */
export const testUtils = {
  /**
   * Advance timers by specified milliseconds in tests
   */
  advanceTimers: (_ms: number) => {
    // Timer advancement not available in this environment
  },

  /**
   * Run all pending timers in tests
   */
  runAllTimers: () => {
    // Timer running not available in this environment
  },
}
