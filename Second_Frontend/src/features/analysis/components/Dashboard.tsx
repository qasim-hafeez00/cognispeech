"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  Box,
  Grid,
  GridItem,
  Flex,
  Heading,
  Text,
  Button,
  Select,
  HStack,
  VStack,
  Card,
  CardBody,
  Badge,
  Progress,
  useColorModeValue,
  Icon,
  Container,
} from "@chakra-ui/react"
import { CalendarIcon, DownloadIcon, UploadIcon, BarChart3Icon } from "lucide-react"
import { useAnalysisStore } from "@/store/analysis.store"
import { SkeletonDashboard } from "@/components/SkeletonDashboard"
import { AISummary } from "./AISummary"
import { ChartLegend } from "@/components/ChartLegend"
import { useD3Chart } from "../hooks/useD3Chart"
import type { ChartData } from "../types"

interface MetricConfig {
  key: string
  label: string
  color: string
  visible: boolean
}

interface DateRange {
  start: string
  end: string
}

export const Dashboard: React.FC = () => {
  const { currentAnalysisId, analyses } = useAnalysisStore()
  const currentAnalysis = currentAnalysisId ? analyses[currentAnalysisId] : null
  const isLoading = false // TODO: Implement loading state
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const textColor = useColorModeValue("gray.800", "white")
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "", // 30 days ago
    end: new Date().toISOString().split("T")[0] || "", // today
  })

  const [metrics, setMetrics] = useState<MetricConfig[]>([
    { key: "confidence", label: "Confidence Score", color: "#3b82f6", visible: true },
    { key: "sentiment", label: "Sentiment Score", color: "#10b981", visible: true },
    { key: "keywords", label: "Keyword Count", color: "#f59e0b", visible: true },
  ])

  // Generate chart data from current analysis
  const chartData: ChartData[] = useMemo(() => {
    if (!currentAnalysis?.results) return []

    const visibleMetrics = metrics.filter((m) => m.visible)
    return visibleMetrics.map((metric) => {
      let value = 0
      switch (metric.key) {
        case "confidence":
          value = currentAnalysis.results?.sentiment_score ? Math.round(currentAnalysis.results.sentiment_score * 100) : 0
          break
        case "sentiment":
          // Convert sentiment to numeric score
          value = currentAnalysis.results?.sentiment_label === "positive" ? 80 : currentAnalysis.results?.sentiment_label === "negative" ? 20 : 50
          break
        case "keywords":
          value = 50 // Default value since keywords aren't available in current structure
          break
      }
      return { label: metric.label, value }
    })
  }, [currentAnalysis, metrics])

  // D3 Chart integration
  const chartRef = useD3Chart(chartData, 600, 300)

  // Handle metric toggle
  const handleMetricToggle = (metricKey: string) => {
    setMetrics((prev) => prev.map((m) => (m.key === metricKey ? { ...m, visible: !m.visible } : m)))
  }

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (!currentAnalysis?.results) return

    const csvData = [
      ["Metric", "Value"],
      ["Sentiment Score", `${currentAnalysis.results.sentiment_score || 'N/A'}`],
      ["Sentiment Label", currentAnalysis.results.sentiment_label || 'N/A'],
      ["Mean Pitch", `${currentAnalysis.results.mean_pitch_hz || 'N/A'} Hz`],
      ["Jitter", `${currentAnalysis.results.jitter_percent || 'N/A'}%`],
      ["Shimmer", `${currentAnalysis.results.shimmer_percent || 'N/A'}%`],
      ["Created At", currentAnalysis.createdAt],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analysis-${currentAnalysis.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Show skeleton while processing
  if (isLoading) {
    return <SkeletonDashboard />
  }

  // Show CTA when no analysis available
  if (!currentAnalysis) {
    return (
      <Container maxW="4xl" py={12}>
        <VStack spacing={8} textAlign="center">
          <Icon as={UploadIcon} boxSize={16} color="gray.400" />
          <VStack spacing={4}>
            <Heading size="lg" color="gray.600">
              No Analysis Available
            </Heading>
            <Text color="gray.500" maxW="md">
              Upload an audio file to get started with speech analysis. Our AI will provide insights on confidence,
              sentiment, and key topics.
            </Text>
          </VStack>
          <Button
            colorScheme="blue"
            size="lg"
            leftIcon={<UploadIcon />}
            onClick={() => {
              // Navigate to upload page - this would be handled by router
              console.log("[v0] Navigate to upload page")
            }}
          >
            Upload Audio File
          </Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header with Controls */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg">Analysis Dashboard</Heading>
            <Text color="gray.600">Analysis ID: {currentAnalysis.id}</Text>
          </VStack>

          <HStack spacing={4} flexWrap="wrap">
            {/* Date Range Controls */}
            <HStack>
              <CalendarIcon size={16} />
              <Select
                size="sm"
                value={`${dateRange.start}_${dateRange.end}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split("_")
                  setDateRange({ start: start || "", end: end || "" })
                }}
              >
                <option
                  value={`${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}_${new Date().toISOString().split("T")[0]}`}
                >
                  Last 7 days
                </option>
                <option
                  value={`${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}_${new Date().toISOString().split("T")[0]}`}
                >
                  Last 30 days
                </option>
                <option
                  value={`${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}_${new Date().toISOString().split("T")[0]}`}
                >
                  Last 90 days
                </option>
              </Select>
            </HStack>

            {/* Export Button */}
            <Button size="sm" variant="outline" leftIcon={<DownloadIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </HStack>
        </Flex>

        {/* Main Chart Section */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Flex direction={{ base: "column", lg: "row" }} gap={6}>
              <VStack flex={1} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Metrics Overview</Heading>
                  <Icon as={BarChart3Icon} color="gray.500" />
                </Flex>

                {/* D3 Chart Container */}
                <Box
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <svg ref={chartRef} width="100%" height="300" style={{ maxWidth: "600px" }} />
                </Box>
              </VStack>

              {/* Chart Legend */}
              <Box minW="200px">
                <ChartLegend
                  metrics={metrics.map((m) => ({
                    key: m.key,
                    label: m.label,
                    color: m.color,
                    visible: m.visible,
                  }))}
                  onToggle={handleMetricToggle}
                  orientation="vertical"
                />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        {/* Metrics Cards Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {/* Confidence Score Card */}
          <GridItem>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Confidence Score
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentAnalysis.results?.sentiment_score ? Math.round(currentAnalysis.results.sentiment_score * 100) : 0}%
                  </Text>
                  <Progress value={currentAnalysis.results?.sentiment_score ? Math.round(currentAnalysis.results.sentiment_score * 100) : 0} colorScheme="blue" size="sm" w="full" />
                  <Text fontSize="xs" color="gray.600">
                    {currentAnalysis.results?.sentiment_score && currentAnalysis.results.sentiment_score >= 0.8
                      ? "High confidence"
                      : currentAnalysis.results?.sentiment_score && currentAnalysis.results.sentiment_score >= 0.6
                        ? "Medium confidence"
                        : "Low confidence"}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Sentiment Analysis Card */}
          <GridItem>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Sentiment Analysis
                  </Text>
                  <Badge
                    colorScheme={
                      currentAnalysis.results?.sentiment_label === "positive"
                        ? "green"
                        : currentAnalysis.results?.sentiment_label === "negative"
                          ? "red"
                          : "gray"
                    }
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {currentAnalysis.results?.sentiment_label || "neutral"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    Overall emotional tone detected in the speech
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Transcription Length Card */}
          <GridItem>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Transcription Length
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentAnalysis.results?.transcript_text?.length || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Characters in speech transcription
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* AI Summary Section */}
        {currentAnalysis.results?.summary_text && (
          <AISummary 
            summary={currentAnalysis.results.summary_text} 
            analysisId={currentAnalysis.id}
          />
        )}

        {/* Summary Section */}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
          {/* Summary Section */}
          <GridItem>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Heading size="md">Summary</Heading>
                  <Text color="gray.700" lineHeight="tall">
                    {currentAnalysis.results?.summary_text || "No summary available"}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Metrics Section */}
          <GridItem>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Heading size="md">Vocal Metrics</Heading>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm">
                      <strong>Mean Pitch:</strong> {currentAnalysis.results?.mean_pitch_hz?.toFixed(1) || 'N/A'} Hz
                    </Text>
                    <Text fontSize="sm">
                      <strong>Jitter:</strong> {currentAnalysis.results?.jitter_percent?.toFixed(2) || 'N/A'}%
                    </Text>
                    <Text fontSize="sm">
                      <strong>Shimmer:</strong> {currentAnalysis.results?.shimmer_percent?.toFixed(2) || 'N/A'}%
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  )
}
