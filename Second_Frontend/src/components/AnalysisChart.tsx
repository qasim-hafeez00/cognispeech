import React, { useEffect, useRef } from 'react'
import { Box, VStack, Text, Heading, useColorModeValue } from '@chakra-ui/react'
import * as d3 from 'd3'

interface AnalysisData {
  pitch_variability: number
  speech_rate: number
  pause_frequency: number
  vocabulary_richness: number
  sentence_complexity: number
}

interface AnalysisChartProps {
  data: AnalysisData
  title?: string
}

export const AnalysisChart: React.FC<AnalysisChartProps> = ({ data, title = "Vocal Biomarker Analysis" }) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data) return

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove()

    const margin = { top: 40, right: 30, bottom: 60, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Prepare data for radar chart
    const metrics = [
      { name: "Pitch Variability", value: data.pitch_variability, color: "#3182CE" },
      { name: "Speech Rate", value: data.speech_rate / 200, color: "#38A169" }, // Normalize to 0-1
      { name: "Pause Frequency", value: data.pause_frequency, color: "#E53E3E" },
      { name: "Vocabulary Richness", value: data.vocabulary_richness, color: "#D69E2E" },
      { name: "Sentence Complexity", value: data.sentence_complexity, color: "#805AD5" }
    ]

    // Radar chart configuration
    const radius = Math.min(width, height) / 2
    const angleSlice = (Math.PI * 2) / metrics.length

    // Create scales
    const rScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, radius])

    // Create the radar chart
    const radarLine = d3.lineRadial<{ name: string; value: number; color: string }>()
      .radius(d => rScale(d.value))
      .angle((_d, i) => i * angleSlice)

    // Draw the circular grid
    const levels = 5
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level
      svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", levelRadius)
        .attr("fill", "none")
        .attr("stroke", "#E2E8F0")
        .attr("stroke-width", 1)
    }

    // Draw the axis lines
    metrics.forEach((metric, i) => {
      const angle = i * angleSlice
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      svg.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#E2E8F0")
        .attr("stroke-width", 1)

      // Add labels
      const labelRadius = radius + 20
      const labelX = Math.cos(angle) * labelRadius
      const labelY = Math.sin(angle) * labelRadius

      svg.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#4A5568")
        .text(metric.name)
    })

    // Draw the radar line
    svg.append("path")
      .datum(metrics)
      .attr("fill", "rgba(49, 130, 206, 0.1)")
      .attr("stroke", "#3182CE")
      .attr("stroke-width", 2)
      .attr("d", radarLine)

    // Add data points
    metrics.forEach((metric, i) => {
      const angle = i * angleSlice
      const x = Math.cos(angle) * rScale(metric.value)
      const y = Math.sin(angle) * rScale(metric.value)

      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", metric.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
    })

    // Add center title
    svg.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#2D3748")
      .text("Analysis Results")

  }, [data, title])

  return (
    <Box p={6} bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" border="1px" borderColor={useColorModeValue('gray.200', 'gray.600')} w="100%" maxW="700px">
      <VStack spacing={4}>
        <Heading size="md" color={useColorModeValue('blue.700', 'blue.300')}>
          📊 {title}
        </Heading>
        
        <Box ref={chartRef} w="100%" display="flex" justifyContent="center" />
        
        <Box w="100%" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
          <VStack spacing={2} align="start">
            <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>Metrics:</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>• Pitch Variability: {(data.pitch_variability * 100).toFixed(1)}%</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>• Speech Rate: {data.speech_rate} words/min</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>• Pause Frequency: {(data.pause_frequency * 100).toFixed(1)}%</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>• Vocabulary Richness: {(data.vocabulary_richness * 100).toFixed(1)}%</Text>
            <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>• Sentence Complexity: {(data.sentence_complexity * 100).toFixed(1)}%</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}
