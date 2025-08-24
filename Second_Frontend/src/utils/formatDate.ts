import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import { enUS, type Locale } from "date-fns/locale"

/**
 * Configuration options for date formatting
 */
export interface FormatDateOptions {
  /** Format style preset or custom format string */
  format?: "short" | "medium" | "long" | "relative" | "iso" | string
  /** Locale for formatting (defaults to en-US) */
  locale?: Locale
  /** Timezone for display (defaults to local timezone) */
  timezone?: string
  /** Include time component in output */
  includeTime?: boolean
  /** Use 12-hour format instead of 24-hour */
  use12Hour?: boolean
  /** Add suffix for relative dates (e.g., "ago", "in") */
  addSuffix?: boolean
  /** Fallback value if date is invalid */
  fallback?: string
  /** Test mode - use fixed reference date for deterministic output */
  testMode?: boolean
  /** Reference date for test mode (defaults to 2024-01-01T12:00:00Z) */
  testReferenceDate?: Date
}

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS: Required<FormatDateOptions> = {
  format: "medium",
  locale: enUS,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  includeTime: true,
  use12Hour: true,
  addSuffix: true,
  fallback: "Invalid date",
  testMode: false,
  testReferenceDate: new Date("2024-01-01T12:00:00Z"),
}

/**
 * Predefined format patterns for common use cases
 */
const FORMAT_PATTERNS = {
  short: "MM/dd/yy",
  shortWithTime: "MM/dd/yy h:mm a",
  medium: "MMM d, yyyy",
  mediumWithTime: "MMM d, yyyy h:mm a",
  long: "MMMM d, yyyy",
  longWithTime: "MMMM d, yyyy h:mm a",
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  time12: "h:mm a",
  time24: "HH:mm",
  dateTime12: "MMM d, yyyy h:mm a",
  dateTime24: "MMM d, yyyy HH:mm",
} as const

/**
 * Normalizes various date input types to a Date object
 *
 * @param input - Date input as string, number, or Date object
 * @returns Normalized Date object or null if invalid
 */
function normalizeDate(input: string | number | Date): Date | null {
  try {
    if (input instanceof Date) {
      return isValid(input) ? input : null
    }

    if (typeof input === "number") {
      // Handle both seconds and milliseconds timestamps
      const timestamp = input < 1e10 ? input * 1000 : input
      const date = new Date(timestamp)
      return isValid(date) ? date : null
    }

    if (typeof input === "string") {
      // Try parsing ISO string first, then fallback to Date constructor
      const isoDate = parseISO(input)
      if (isValid(isoDate)) {
        return isoDate
      }

      const date = new Date(input)
      return isValid(date) ? date : null
    }

    return null
  } catch {
    return null
  }
}

/**
 * Applies timezone conversion to a date
 *
 * @param date - Date to convert
 * @param timezone - Target timezone
 * @returns Date adjusted for timezone
 */
function applyTimezone(date: Date, timezone: string): Date {
  try {
    // Use Intl.DateTimeFormat to get timezone offset
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const partsObj = parts.reduce(
      (acc, part) => {
        acc[part.type] = part.value
        return acc
      },
      {} as Record<string, string>,
    )

    return new Date(
      `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`,
    )
  } catch {
    // Fallback to original date if timezone conversion fails
    return date
  }
}

/**
 * Formats a date/time value into a human-readable string with extensive customization options
 *
 * @param input - Date input as string (ISO), number (timestamp), or Date object
 * @param options - Formatting options
 * @returns Formatted date string or fallback value
 *
 * @example
 * \`\`\`typescript
 * // Basic usage
 * formatDate('2024-01-15T10:30:00Z') // "Jan 15, 2024 10:30 AM"
 * formatDate(1705312200000) // "Jan 15, 2024 10:30 AM"
 * formatDate(new Date()) // "Jan 15, 2024 10:30 AM"
 *
 * // Relative formatting
 * formatDate('2024-01-15T10:30:00Z', { format: 'relative' }) // "2 hours ago"
 *
 * // Custom format
 * formatDate('2024-01-15T10:30:00Z', { format: 'yyyy-MM-dd' }) // "2024-01-15"
 *
 * // Timezone-aware
 * formatDate('2024-01-15T10:30:00Z', { timezone: 'America/New_York' })
 *
 * // Test mode for deterministic output
 * formatDate('2024-01-15T10:30:00Z', {
 *   testMode: true,
 *   format: 'relative'
 * }) // "15 days ago" (relative to test reference date)
 * \`\`\`
 */
export function formatDate(input: string | number | Date, options: FormatDateOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Normalize input to Date object
  const date = normalizeDate(input)
  if (!date) {
    return opts.fallback
  }

  // Apply timezone conversion if specified
  const adjustedDate = opts.timezone !== DEFAULT_OPTIONS.timezone ? applyTimezone(date, opts.timezone) : date

  try {
    // Handle relative formatting
    if (opts.format === "relative") {

      return formatDistanceToNow(adjustedDate, {
        addSuffix: opts.addSuffix,
        locale: opts.locale,
        includeSeconds: true,
      })
    }

    // Handle ISO formatting
    if (opts.format === "iso") {
      return adjustedDate.toISOString()
    }

    // Handle predefined format patterns
    let formatPattern: string

    if (opts.format && opts.format in FORMAT_PATTERNS) {
      const basePattern = FORMAT_PATTERNS[opts.format as keyof typeof FORMAT_PATTERNS]

      // Adjust pattern based on options
      if (opts.format === "short" || opts.format === "medium" || opts.format === "long") {
        formatPattern = opts.includeTime
          ? FORMAT_PATTERNS[`${opts.format}WithTime` as keyof typeof FORMAT_PATTERNS]
          : basePattern
      } else {
        formatPattern = basePattern
      }

      // Convert 12/24 hour format
      if (!opts.use12Hour && formatPattern.includes("a")) {
        formatPattern = formatPattern.replace(/h:mm a/g, "HH:mm")
      }
    } else {
      // Use custom format string
      formatPattern = opts.format || FORMAT_PATTERNS.mediumWithTime
    }

    // Format the date using date-fns
    return format(adjustedDate, formatPattern, {
      locale: opts.locale,
    })
  } catch (error) {
    console.warn("[formatDate] Formatting error:", error)
    return opts.fallback
  }
}

/**
 * Convenience function for relative time formatting
 *
 * @param input - Date input
 * @param options - Additional options
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  input: string | number | Date,
  options: Omit<FormatDateOptions, "format"> = {},
): string {
  return formatDate(input, { ...options, format: "relative" })
}

/**
 * Convenience function for ISO date formatting
 *
 * @param input - Date input
 * @returns ISO date string
 */
export function formatISO(input: string | number | Date): string {
  return formatDate(input, { format: "iso", fallback: "" })
}

/**
 * Convenience function for short date formatting (no time)
 *
 * @param input - Date input
 * @param options - Additional options
 * @returns Short date string (e.g., "01/15/24")
 */
export function formatShortDate(
  input: string | number | Date,
  options: Omit<FormatDateOptions, "format" | "includeTime"> = {},
): string {
  return formatDate(input, { ...options, format: "short", includeTime: false })
}

/**
 * Test utilities for deterministic date formatting in tests
 */
export const testUtils = {
  /**
   * Creates a formatDate function with test mode enabled
   *
   * @param referenceDate - Fixed reference date for relative calculations
   * @returns Test-mode formatDate function
   */
  createTestFormatter: (referenceDate = new Date("2024-01-01T12:00:00Z")) => {
    return (input: string | number | Date, options: FormatDateOptions = {}) =>
      formatDate(input, { ...options, testMode: true, testReferenceDate: referenceDate })
  },

  /**
   * Common test reference dates
   */
  referenceDates: {
    jan2024: new Date("2024-01-01T12:00:00Z"),
    jul2024: new Date("2024-07-01T12:00:00Z"),
    dec2024: new Date("2024-12-01T12:00:00Z"),
  },
} as const

/**
 * Type guard to check if a value is a valid date input
 *
 * @param value - Value to check
 * @returns True if value can be formatted as a date
 */
export function isValidDateInput(value: unknown): value is string | number | Date {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    return normalizeDate(value) !== null
  }
  return false
}

// Export types for external use

