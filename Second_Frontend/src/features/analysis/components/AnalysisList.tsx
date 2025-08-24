"use client"

import React from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tooltip,
  useColorModeValue,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Button as ChakraButton,
} from "@chakra-ui/react"
import { ViewIcon, RepeatIcon, DeleteIcon, CalendarIcon } from "@chakra-ui/icons"
import { useAnalysisStore } from "@/store/analysis.store"
import { Button } from "@/components/ui/button"
import { ExportAnalysis } from "./ExportAnalysis"
import type { AnalysisState } from "@/types/analysis.types"

/**
 * Props for the AnalysisList component
 */
interface AnalysisListProps {
  /** Optional callback when an analysis is selected for viewing */
  onViewAnalysis?: (analysis: AnalysisState) => void
  /** Optional callback when retry is requested */
  onRetryAnalysis?: (analysis: AnalysisState) => void
  /** Layout variant - cards or compact rows */
  variant?: "cards" | "rows"
  /** Maximum number of items to display */
  maxItems?: number
}

/**
 * Individual analysis item component
 */
interface AnalysisItemProps {
  analysis: AnalysisState
  variant: "cards" | "rows"
  onView: (analysis: AnalysisState) => void
  onRetry: (analysis: AnalysisState) => void
  onDelete: (analysis: AnalysisState) => void
}

/**
 * Get status badge properties based on analysis data
 */
const getStatusBadge = (analysis: AnalysisState) => {
  // Map frontend status to display properties
  switch (analysis.status) {
    case 'completed':
      return { label: "Complete", colorScheme: "green" }
    case 'processing':
      return { label: "Processing", colorScheme: "yellow" }
    case 'uploading':
      return { label: "Uploading", colorScheme: "blue" }
    case 'failed':
      return { label: "Failed", colorScheme: "red" }
    case 'cancelled':
      return { label: "Cancelled", colorScheme: "gray" }
    default:
      return { label: "Idle", colorScheme: "gray" }
  }
}

/**
 * Format date for display
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Individual analysis item component
 */
const AnalysisItem: React.FC<AnalysisItemProps> = ({ analysis, variant, onView, onRetry, onDelete }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const status = getStatusBadge(analysis)
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const hoverBg = useColorModeValue("gray.50", "gray.700")

  // Create snippet from transcription or summary
  const snippet = analysis.results?.transcript_text
    ? analysis.results.transcript_text.slice(0, 120) + (analysis.results.transcript_text.length > 120 ? "..." : "")
    : analysis.results?.summary_text
      ? analysis.results.summary_text.slice(0, 120) + (analysis.results.summary_text.length > 120 ? "..." : "")
      : "No content available"

  const handleDelete = () => {
    onDelete(analysis)
    onClose()
  }

  if (variant === "rows") {
    return (
      <>
        <Box
          p={4}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          _hover={{ bg: hoverBg }}
          cursor="pointer"
          onClick={() => onView(analysis)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onView(analysis)
            }
          }}
          aria-label={`View analysis from ${formatDate(analysis.createdAt)}`}
        >
          <Flex align="center" gap={4}>
            <VStack align="start" spacing={1} flex={1} minW={0}>
              <HStack spacing={2}>
                <Badge colorScheme={status.colorScheme} size="sm">
                  {status.label}
                </Badge>
                <HStack spacing={1} color="gray.500" fontSize="sm">
                  <CalendarIcon boxSize={3} />
                  <Text>{formatDate(analysis.createdAt)}</Text>
                </HStack>
              </HStack>
              {snippet && (
                <Text fontSize="sm" color="gray.600" noOfLines={1}>
                  {snippet}
                </Text>
              )}
            </VStack>

            <HStack spacing={1}>
              <Tooltip label="View Analysis">
                <IconButton
                  aria-label="View analysis"
                  icon={<ViewIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(analysis)
                  }}
                />
              </Tooltip>

              {status.label === "Failed" && (
                <Tooltip label="Retry Analysis">
                  <IconButton
                    aria-label="Retry analysis"
                    icon={<RepeatIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetry(analysis)
                    }}
                  />
                </Tooltip>
              )}

              <ExportAnalysis 
                analysis={analysis}
                onExportComplete={(format, filename) => {
                  console.log(`Exported ${filename} as ${format}`);
                }}
                onError={(error) => {
                  console.error('Export error:', error);
                }}
              />

              <Tooltip label="Delete Analysis">
                <IconButton
                  aria-label="Delete analysis"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen()
                  }}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </Box>

        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Analysis
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this analysis? This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <ChakraButton ref={cancelRef} onClick={onClose}>
                  Cancel
                </ChakraButton>
                <ChakraButton colorScheme="red" onClick={handleDelete} ml={3}>
                  Delete
                </ChakraButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>
    )
  }

  // Card variant
  return (
    <>
      <Card
        bg={cardBg}
        borderColor={borderColor}
        _hover={{ bg: hoverBg, transform: "translateY(-2px)" }}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => onView(analysis)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onView(analysis)
          }
        }}
        aria-label={`View analysis from ${formatDate(analysis.createdAt)}`}
      >
        <CardHeader pb={2}>
          <Flex align="center" justify="space-between">
            <HStack spacing={2}>
              <Badge colorScheme={status.colorScheme}>{status.label}</Badge>
              <HStack spacing={1} color="gray.500" fontSize="sm">
                <CalendarIcon boxSize={3} />
                <Text>{formatDate(analysis.createdAt)}</Text>
              </HStack>
            </HStack>

            <HStack spacing={1}>
              <Tooltip label="View Analysis">
                <IconButton
                  aria-label="View analysis"
                  icon={<ViewIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(analysis)
                  }}
                />
              </Tooltip>

              {status.label === "Failed" && (
                <Tooltip label="Retry Analysis">
                  <IconButton
                    aria-label="Retry analysis"
                    icon={<RepeatIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetry(analysis)
                    }}
                  />
                </Tooltip>
              )}

              <ExportAnalysis 
                analysis={analysis}
                onExportComplete={(format, filename) => {
                  console.log(`Exported ${filename} as ${format}`);
                }}
                onError={(error) => {
                  console.error('Export error:', error);
                }}
              />

              <Tooltip label="Delete Analysis">
                <IconButton
                  aria-label="Delete analysis"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen()
                  }}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody pt={0}>
          {snippet && (
            <Text fontSize="sm" color="gray.600" noOfLines={3}>
              {snippet}
            </Text>
          )}

          {analysis.results?.summary_text && (
            <HStack mt={2} spacing={1} flexWrap="wrap">
              <Badge variant="subtle" fontSize="xs" colorScheme="blue">
                Summary Available
              </Badge>
            </HStack>
          )}
        </CardBody>
      </Card>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Analysis
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <ChakraButton ref={cancelRef} onClick={onClose}>
                Cancel
              </ChakraButton>
              <ChakraButton colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </ChakraButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

/**
 * AnalysisList component displays a list of saved and active analyses
 *
 * Features:
 * - Card or row layout variants
 * - Status indicators (Complete, Processing, Failed)
 * - Action buttons (View, Retry, Delete)
 * - Confirmation dialogs for destructive actions
 * - Keyboard navigation support
 * - Integration with Zustand store
 *
 * @example
 * \`\`\`tsx
 * <AnalysisList
 *   variant="cards"
 *   maxItems={10}
 *   onViewAnalysis={(analysis) => navigate(`/analysis/${analysis.id}`)}
 *   onRetryAnalysis={(analysis) => retryAnalysis(analysis.id)}
 * />
 * \`\`\`
 */
export const AnalysisList: React.FC<AnalysisListProps> = ({
  onViewAnalysis,
  onRetryAnalysis,
  variant = "cards",
  maxItems,
}) => {
  const { analyses, setCurrentAnalysisId, deleteAnalysis } = useAnalysisStore()
  const bg = useColorModeValue("gray.50", "gray.900")
  const borderWidth = useColorModeValue("2px", "2px")
  const borderStyle = useColorModeValue("dashed", "dashed")
  const borderColorEmpty = useColorModeValue("gray.300", "gray.600")

  // Sort analyses by creation date (newest first)
  const sortedAnalyses = React.useMemo(() => {
    const analysesArray = Object.values(analyses)
    const sorted = analysesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return maxItems ? sorted.slice(0, maxItems) : sorted
  }, [analyses, maxItems])

  const handleViewAnalysis = (analysis: AnalysisState) => {
    setCurrentAnalysisId(analysis.id)
    onViewAnalysis?.(analysis)
  }

  const handleRetryAnalysis = (analysis: AnalysisState) => {
    onRetryAnalysis?.(analysis)
  }

  const handleDeleteAnalysis = (analysis: AnalysisState) => {
    deleteAnalysis(analysis.id)
  }

  if (sortedAnalyses.length === 0) {
    return (
      <Box
        textAlign="center"
        py={10}
        px={6}
        bg={bg}
        borderRadius="lg"
        borderWidth={borderWidth}
        borderStyle={borderStyle}
        borderColor={borderColorEmpty}
      >
        <Heading size="md" color="gray.500" mb={2}>
          No Analyses Yet
        </Heading>
        <Text color="gray.500" mb={4}>
          Upload an audio file to get started with speech analysis
        </Text>
        <Button variant="outline" size="sm">
          Upload Audio File
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {variant === "cards" ? (
        <VStack spacing={4} align="stretch">
          {sortedAnalyses.map((analysis) => (
            <AnalysisItem
              key={analysis.id}
              analysis={analysis}
              variant={variant}
              onView={handleViewAnalysis}
              onRetry={handleRetryAnalysis}
              onDelete={handleDeleteAnalysis}
            />
          ))}
        </VStack>
      ) : (
        <VStack spacing={2} align="stretch">
          {sortedAnalyses.map((analysis) => (
            <AnalysisItem
              key={analysis.id}
              analysis={analysis}
              variant={variant}
              onView={handleViewAnalysis}
              onRetry={handleRetryAnalysis}
              onDelete={handleDeleteAnalysis}
            />
          ))}
        </VStack>
      )}
    </Box>
  )
}

export default AnalysisList
