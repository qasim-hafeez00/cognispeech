"use client"

import type React from "react"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react"
import { FiMoreVertical, FiPlay, FiTrash2, FiRefreshCw } from "react-icons/fi"
import type { AnalysisResult } from "@/features/analysis/types"

/**
 * Props for the AnalysisCard component
 */
export interface AnalysisCardProps {
  /** The analysis data to display */
  analysis: AnalysisResult
  /** Callback when the card is clicked */
  onClick?: (analysis: AnalysisResult) => void
  /** Callback when retry is requested */
  onRetry?: (analysis: AnalysisResult) => void
  /** Callback when delete is requested */
  onDelete?: (analysis: AnalysisResult) => void
  /** Whether the card is currently selected/active */
  isActive?: boolean
  /** Compact mode for smaller displays */
  compact?: boolean
}

/**
 * Reusable analysis card component used by AnalysisList and Dashboard.
 * Displays key analysis information in a compact, interactive format.
 *
 * @example
 * ```tsx
 * <AnalysisCard
 *   analysis={analysisData}
 *   onClick={handleViewAnalysis}
 *   onRetry={handleRetryAnalysis}
 *   onDelete={handleDeleteAnalysis}
 *   isActive={currentAnalysisId === analysisData.id}
 * />
 * ```
 */
export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onClick,
  onRetry,
  onDelete,
  isActive = false,
  compact = false,
}) => {
  const cardBg = useColorModeValue("white", "gray.800")
  const activeBg = useColorModeValue("blue.50", "blue.900")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const activeBorderColor = useColorModeValue("blue.200", "blue.600")
  const textColor = useColorModeValue("gray.600", "gray.300")
  const mutedTextColor = useColorModeValue("gray.500", "gray.400")

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "green"
      case "negative":
        return "red"
      case "neutral":
        return "gray"
      default:
        return "gray"
    }
  }

  // Truncate text for display
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  // Determine if analysis has issues (low confidence, etc.)
  const hasIssues = (analysis.overall_sentiment_score || 0) < 0.7
  const canRetry = hasIssues || !analysis.transcript_text

  // Get sentiment display value
  const getSentimentDisplay = () => {
    if (analysis.overall_sentiment) return analysis.overall_sentiment
    if (analysis.sentiment_label) return analysis.sentiment_label
    return "neutral"
  }

  // Get confidence value
  const getConfidence = () => {
    if (analysis.overall_sentiment_score !== undefined) return analysis.overall_sentiment_score
    if (analysis.sentiment_score !== undefined) return analysis.sentiment_score
    return 0.5 // Default confidence
  }

  return (
    <Card
      bg={isActive ? activeBg : cardBg}
      borderColor={isActive ? activeBorderColor : borderColor}
      borderWidth="1px"
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.2s"
      _hover={
        onClick
          ? {
              transform: "translateY(-2px)",
              shadow: "md",
              borderColor: activeBorderColor,
            }
          : undefined
      }
      onClick={() => onClick?.(analysis)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick(analysis)
        }
      }}
      aria-label={`Analysis from ${formatDate(analysis.created_at)}`}
    >
      <CardHeader pb={compact ? 2 : 4}>
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" spacing={1} flex={1}>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme={getSentimentColor(getSentimentDisplay())} variant="subtle" fontSize="xs">
                {getSentimentDisplay()}
              </Badge>
              <Badge
                colorScheme={getConfidence() >= 0.8 ? "green" : getConfidence() >= 0.6 ? "yellow" : "red"}
                variant="subtle"
                fontSize="xs"
              >
                {Math.round(getConfidence() * 100)}% confidence
              </Badge>
              {hasIssues && (
                <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                  Needs Review
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={mutedTextColor}>
              {formatDate(analysis.created_at)}
            </Text>
          </VStack>

          {(onRetry || onDelete) && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="Analysis actions"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                {onClick && (
                  <MenuItem icon={<FiPlay />} onClick={() => onClick(analysis)}>
                    View Analysis
                  </MenuItem>
                )}
                {onRetry && canRetry && (
                  <MenuItem
                    icon={<FiRefreshCw />}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetry(analysis)
                    }}
                  >
                    Retry Analysis
                  </MenuItem>
                )}
                {onDelete && (
                  <MenuItem
                    icon={<FiTrash2 />}
                    color="red.500"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(analysis)
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          )}
        </HStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack align="flex-start" spacing={compact ? 2 : 3}>
          {/* Transcription snippet */}
          {analysis.transcript_text && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Transcription
              </Text>
              <Text fontSize="sm" color={textColor} lineHeight="1.4">
                {truncateText(analysis.transcript_text, compact ? 80 : 120)}
              </Text>
            </Box>
          )}

          {/* Summary snippet */}
          {analysis.summary_text && !compact && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Summary
              </Text>
              <Text fontSize="sm" color={textColor} lineHeight="1.4">
                {truncateText(analysis.summary_text, 100)}
              </Text>
            </Box>
          )}

          {/* Keywords - removed since not available in AnalysisResult */}
          
          {/* Insights count - removed since not available in AnalysisResult */}
        </VStack>
      </CardBody>
    </Card>
  )
}

export default AnalysisCard
