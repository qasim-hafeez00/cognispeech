/**
 * Exponential backoff utility for retry mechanisms
 *
 * Calculates delay times using exponential backoff algorithm with jitter
 * to prevent thundering herd problems in distributed systems.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const delay = exponentialBackoff(3); // ~8000ms for attempt 3
 *
 * // With custom options
 * const delay = exponentialBackoff(2, { base: 500, max: 10000 }); // ~2000ms
 *
 * // In a retry loop
 * for (let attempt = 1; attempt <= maxRetries; attempt++) {
 *   try {
 *     await apiCall();
 *     break;
 *   } catch (error) {
 *     if (attempt === maxRetries) throw error;
 *     const delay = exponentialBackoff(attempt);
 *     await sleep(delay);
 *   }
 * }
 * ```
 */

/**
 * Options for exponential backoff calculation
 */
export interface ExponentialBackoffOptions {
  /** Base delay in milliseconds (default: 1000) */
  base?: number
  /** Maximum delay in milliseconds (default: 30000) */
  max?: number
  /** Jitter factor to add randomness (0-1, default: 0.1) */
  jitter?: number
  /** Multiplier for exponential growth (default: 2) */
  multiplier?: number
}

/**
 * Calculate exponential backoff delay with jitter
 *
 * @param attemptNumber - The current attempt number (1-based)
 * @param options - Configuration options for backoff calculation
 * @returns Delay in milliseconds
 *
 * @example
 * ```typescript
 * exponentialBackoff(1) // ~1000ms
 * exponentialBackoff(2) // ~2000ms
 * exponentialBackoff(3) // ~4000ms
 * exponentialBackoff(4) // ~8000ms
 * ```
 */
export function exponentialBackoff(attemptNumber: number, options: ExponentialBackoffOptions = {}): number {
  const { base = 1000, max = 30000, jitter = 0.1, multiplier = 2 } = options

  // Validate inputs
  if (attemptNumber < 1) {
    throw new Error("Attempt number must be >= 1")
  }

  if (base <= 0 || max <= 0) {
    throw new Error("Base and max delays must be positive")
  }

  // Calculate exponential delay: base * (multiplier ^ (attempt - 1))
  const exponentialDelay = base * Math.pow(multiplier, attemptNumber - 1)

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, max)

  // Add jitter to prevent thundering herd
  const jitterAmount = cappedDelay * jitter * Math.random()
  const finalDelay = cappedDelay + jitterAmount

  return Math.round(finalDelay)
}

/**
 * Create a sleep function that works with exponential backoff
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param options - Backoff options
 * @returns Promise with the result of the function
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   3,
 *   { base: 500, max: 5000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  options: ExponentialBackoffOptions = {},
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't wait after the last attempt
      if (attempt === maxAttempts) {
        break
      }

      const delay = exponentialBackoff(attempt, options)
      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Demo snippet showing exponential backoff in action
 */
export function demoExponentialBackoff(): void {
  console.log("Exponential Backoff Demo:")
  console.log("========================")

  // Show delay progression for first 6 attempts
  for (let attempt = 1; attempt <= 6; attempt++) {
    const delay = exponentialBackoff(attempt)
    const seconds = (delay / 1000).toFixed(1)
    console.log(`Attempt ${attempt}: ${delay}ms (${seconds}s)`)
  }

  console.log("\nWith custom options (base: 500ms, max: 10s):")
  for (let attempt = 1; attempt <= 6; attempt++) {
    const delay = exponentialBackoff(attempt, { base: 500, max: 10000 })
    const seconds = (delay / 1000).toFixed(1)
    console.log(`Attempt ${attempt}: ${delay}ms (${seconds}s)`)
  }
}

// Type exports for external use

