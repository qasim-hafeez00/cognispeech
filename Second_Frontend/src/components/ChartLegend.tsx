"use client"

import type React from "react"
import { Box, Checkbox, HStack, Text, VStack, useColorModeValue } from "@chakra-ui/react"

/**
 * Represents a single metric that can be toggled in the chart legend
 */
export interface LegendMetric {
  /** Unique identifier for the metric */
  key: string
  /** Display label for the metric */
  label: string
  /** Color associated with the metric in the chart */
  color: string
  /** Whether the metric is currently visible */
  visible: boolean
  /** Optional icon component to display next to the label */
  icon?: React.ComponentType<{ color?: string }>
}

/**
 * Props for the ChartLegend component
 */
export interface ChartLegendProps {
  /** Array of metrics to display in the legend */
  metrics: LegendMetric[]
  /** Callback function called when a metric visibility is toggled */
  onToggle: (metricKey: string) => void
  /** Layout orientation of the legend items */
  orientation?: "horizontal" | "vertical"
  /** Additional CSS class name */
  className?: string
  /** Whether to show checkboxes or clickable items */
  showCheckboxes?: boolean
  /** ARIA label for the legend */
  "aria-label"?: string
}

/**
 * ChartLegend component for toggling metric visibility in charts
 *
 * Features:
 * - Keyboard navigation support (Tab, Enter, Space)
 * - Screen reader accessible with proper ARIA attributes
 * - Customizable layout (horizontal/vertical)
 * - Visual feedback for hover and focus states
 * - Support for both checkbox and clickable item modes
 *
 * @example
 * ```tsx
 * const metrics = [
 *   { key: 'confidence', label: 'Confidence', color: '#3b82f6', visible: true },
 *   { key: 'sentiment', label: 'Sentiment', color: '#10b981', visible: false }
 * ]
 *
 * <ChartLegend
 *   metrics={metrics}
 *   onToggle={(key) => toggleMetric(key)}
 *   orientation="horizontal"
 * />
 * ```
 */
export const ChartLegend: React.FC<ChartLegendProps> = ({
  metrics,
  onToggle,
  orientation = "horizontal",
  className,
  showCheckboxes = true,
  "aria-label": ariaLabel = "Chart legend - toggle metric visibility",
}) => {
  const hoverBg = useColorModeValue("gray.50", "gray.700")
  const focusBg = useColorModeValue("gray.100", "gray.600")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  /**
   * Handle keyboard interactions for accessibility
   */
  const handleKeyDown = (event: React.KeyboardEvent, metricKey: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onToggle(metricKey)
    }
  }

  /**
   * Handle click events for metric toggle
   */
  const handleClick = (metricKey: string) => {
    onToggle(metricKey)
  }

  const Container = orientation === "horizontal" ? HStack : VStack

  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      className={className}
      p={2}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      bg={useColorModeValue("white", "gray.800")}
    >
      <Container spacing={orientation === "horizontal" ? 4 : 2} align="flex-start">
        {metrics.map((metric) => {
          const IconComponent = metric.icon

          if (showCheckboxes) {
            return (
              <Checkbox
                key={metric.key}
                isChecked={metric.visible}
                onChange={() => handleClick(metric.key)}
                colorScheme="blue"
                size="sm"
                _hover={{ bg: hoverBg }}
                _focus={{ bg: focusBg, outline: "2px solid", outlineColor: "blue.500" }}
                borderRadius="md"
                p={1}
                aria-describedby={`${metric.key}-description`}
              >
                <HStack spacing={2} align="center">
                  {IconComponent ? (
                    <IconComponent color={metric.visible ? metric.color : "gray"} />
                  ) : (
                    <Box
                      w={3}
                      h={3}
                      borderRadius="sm"
                      bg={metric.visible ? metric.color : "gray.300"}
                      flexShrink={0}
                      aria-hidden="true"
                    />
                  )}
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={metric.visible ? "inherit" : "gray.500"}
                    id={`${metric.key}-description`}
                  >
                    {metric.label}
                  </Text>
                </HStack>
              </Checkbox>
            )
          }

          // Clickable item mode (no checkboxes)
          return (
            <Box
              key={metric.key}
              role="button"
              tabIndex={0}
              cursor="pointer"
              onClick={() => handleClick(metric.key)}
              onKeyDown={(e) => handleKeyDown(e, metric.key)}
              _hover={{ bg: hoverBg }}
              _focus={{
                bg: focusBg,
                outline: "2px solid",
                outlineColor: "blue.500",
                outlineOffset: "2px",
              }}
              borderRadius="md"
              p={2}
              transition="all 0.2s"
              aria-pressed={metric.visible}
              aria-describedby={`${metric.key}-description`}
            >
              <HStack spacing={2} align="center">
                {IconComponent ? (
                  <IconComponent color={metric.visible ? metric.color : "gray"} />
                ) : (
                  <Box
                    w={3}
                    h={3}
                    borderRadius="sm"
                    bg={metric.visible ? metric.color : "gray.300"}
                    flexShrink={0}
                    aria-hidden="true"
                  />
                )}
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color={metric.visible ? "inherit" : "gray.500"}
                  id={`${metric.key}-description`}
                >
                  {metric.label}
                </Text>
              </HStack>
            </Box>
          )
        })}
      </Container>
    </Box>
  )
}

export default ChartLegend
