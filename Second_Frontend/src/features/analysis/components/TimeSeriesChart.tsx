"use client"

import React, { useCallback, useMemo } from 'react';
import { Box, Text, useColorModeValue, VStack, HStack, Badge } from '@chakra-ui/react';
import { useD3 } from '../hooks/useD3';
import { AnalysisResult } from '@/types/analysis.types';
import * as d3 from 'd3';

interface TimeSeriesChartProps {
  data: AnalysisResult[];
  visibleMetrics: string[];
  height?: number;
  width?: number;
  onMetricHighlight?: (metric: string, date: string) => void;
  onTimeRangeSelect?: (range: [Date, Date] | null) => void;
}

interface ChartMetric {
  key: string;
  label: string;
  color: string;
  unit: string;
  description: string;
}

const METRIC_CONFIG: Record<string, ChartMetric> = {
  mean_pitch_hz: {
    key: 'mean_pitch_hz',
    label: 'Mean Pitch',
    color: '#3182CE',
    unit: 'Hz',
    description: 'Average fundamental frequency',
  },
  jitter_percent: {
    key: 'jitter_percent',
    label: 'Jitter',
    color: '#E53E3E',
    unit: '%',
    description: 'Frequency perturbation measure',
  },
  shimmer_percent: {
    key: 'shimmer_percent',
    label: 'Shimmer',
    color: '#38A169',
    unit: '%',
    description: 'Amplitude perturbation measure',
  },
  pitch_std_hz: {
    key: 'pitch_std_hz',
    label: 'Pitch Std',
    color: '#805AD5',
    unit: 'Hz',
    description: 'Pitch standard deviation',
  },
  pitch_range_hz: {
    key: 'pitch_range_hz',
    label: 'Pitch Range',
    color: '#D69E2E',
    unit: 'Hz',
    description: 'Pitch variation range',
  },
  mean_hnr_db: {
    key: 'mean_hnr_db',
    label: 'HNR',
    color: '#319795',
    unit: 'dB',
    description: 'Harmonics-to-noise ratio',
  },
  sentiment_score: {
    key: 'sentiment_score',
    label: 'Sentiment',
    color: '#F56565',
    unit: 'score',
    description: 'Emotional sentiment analysis',
  },
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  visibleMetrics,
  height = 500,
  width = 800,
  onMetricHighlight,
  onTimeRangeSelect,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Process data for charting
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    return data
      .filter(item => item.status === 'COMPLETE')
      .map(item => ({
        date: new Date(item.created_at),
        ...item,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  // Create scales
  const xScale = useMemo(() => {
    if (!chartData.length) return null;
    
    const dates = chartData.map(d => d.date);
    return d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([80, width - 40]);
  }, [chartData, width]);

  const yScales = useMemo(() => {
    if (!chartData.length || !xScale) return {};

    const scales: Record<string, d3.ScaleLinear<number, number>> = {};
    
    visibleMetrics.forEach(metricKey => {
      const metric = METRIC_CONFIG[metricKey];
      if (!metric) return;

      const values = chartData
        .map(d => (d as any)[metricKey])
        .filter(v => v !== null && v !== undefined && !isNaN(v));

      if (values.length > 0) {
        const domain = d3.extent(values) as [number, number];
        // Add some padding to the domain
        const padding = (domain[1] - domain[0]) * 0.1;
        scales[metricKey] = d3.scaleLinear()
          .domain([domain[0] - padding, domain[1] + padding])
          .range([height - 80, 40]);
      }
    });

    return scales;
  }, [chartData, visibleMetrics, height, xScale]);

  // D3 rendering function
  const renderChart = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    if (!chartData.length || !xScale || Object.keys(yScales).length === 0) return;

    // Clear previous content
    svg.selectAll('*').remove();

    // Add grid lines
    const gridGroup = svg.append('g').attr('class', 'grid');
    
    // X-axis grid
    const xTicks = xScale.ticks(5);
    gridGroup.selectAll('.x-grid')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'x-grid')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 40)
      .attr('y2', height - 80)
      .attr('stroke', gridColor)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    // Y-axis grid for each metric
    Object.entries(yScales).forEach(([metricKey, yScale]) => {
      const yTicks = yScale.ticks(5);
      gridGroup.selectAll(`.y-grid-${metricKey}`)
        .data(yTicks)
        .enter()
        .append('line')
        .attr('class', `y-grid-${metricKey}`)
        .attr('x1', 80)
        .attr('x2', width - 40)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', gridColor)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1);
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - 80})`)
      .call(xAxis);

    // Style x-axis
    xAxisGroup.selectAll('text')
      .style('font-size', '12px')
      .style('fill', textColor);

    xAxisGroup.selectAll('line')
      .style('stroke', borderColor);

    // Add y-axes for each metric
    Object.entries(yScales).forEach(([metricKey, yScale], index) => {
      const metric = METRIC_CONFIG[metricKey];
      if (!metric) return;

      const yAxis = d3.axisLeft(yScale);
      const yAxisGroup = svg.append('g')
        .attr('class', `y-axis-${metricKey}`)
        .attr('transform', `translate(${80 + index * 60}, 0)`)
        .call(yAxis);

      // Style y-axis
      yAxisGroup.selectAll('text')
        .style('font-size', '10px')
        .style('fill', textColor);

      yAxisGroup.selectAll('line')
        .style('stroke', borderColor);

      // Add metric label
      svg.append('text')
        .attr('class', 'y-label')
        .attr('transform', `translate(${80 + index * 60 - 20}, 20) rotate(-90)`)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', textColor)
        .text(metric.label);
    });

    // Add data lines
    Object.entries(yScales).forEach(([metricKey, yScale]) => {
      const metric = METRIC_CONFIG[metricKey];
      if (!metric) return;

      const lineData = chartData
        .map(d => ({ date: d.date, value: (d as any)[metricKey] }))
        .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value));

      if (lineData.length < 2) return;

      const line = d3.line<{ date: Date; value: number }>()
        .x((d: { date: Date; value: number }) => xScale(d.date))
        .y((d: { date: Date; value: number }) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Add line path
      svg.append('path')
        .datum(lineData)
        .attr('class', `line-${metricKey}`)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add data points
      svg.selectAll(`.point-${metricKey}`)
        .data(lineData)
        .enter()
        .append('circle')
        .attr('class', `point-${metricKey}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', metric.color)
        .attr('stroke', bgColor)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(_event, d) {
          // Highlight point
          d3.select(this).attr('r', 6);
          
          // Show tooltip
          const tooltip = svg.append('g')
            .attr('class', 'tooltip')
            .style('pointer-events', 'none');

          tooltip.append('rect')
            .attr('x', xScale(d.date) + 10)
            .attr('y', yScale(d.value) - 30)
            .attr('width', 120)
            .attr('height', 60)
            .attr('fill', 'rgba(0,0,0,0.8)')
            .attr('rx', 4);

          tooltip.append('text')
            .attr('x', xScale(d.date) + 15)
            .attr('y', yScale(d.value) - 15)
            .style('fill', 'white')
            .style('font-size', '12px')
            .text(`Date: ${d.date.toLocaleDateString()}`);

          tooltip.append('text')
            .attr('x', xScale(d.date) + 15)
            .attr('y', yScale(d.value))
            .style('fill', 'white')
            .style('font-size', '12px')
            .text(`${metric.label}: ${d.value.toFixed(2)} ${metric.unit}`);

          // Highlight on chart
          if (onMetricHighlight) {
            onMetricHighlight(metricKey, d.date.toISOString());
          }
        })
        .on('mouseout', function() {
          // Reset point size
          d3.select(this).attr('r', 4);
          
          // Remove tooltip
          svg.selectAll('.tooltip').remove();
        });
    });

    // Add brushing functionality
    const brush = d3.brushX()
      .extent([[80, 40], [width - 40, height - 80]])
      .on('end', (event) => {
        if (!event.selection) {
          if (onTimeRangeSelect) {
            onTimeRangeSelect(null);
          }
          return;
        }

        const [x0, x1] = event.selection;
        const range: [Date, Date] = [
          xScale.invert(x0),
          xScale.invert(x1)
        ];

        if (onTimeRangeSelect) {
          onTimeRangeSelect(range);
        }
      });

    svg.append('g')
      .attr('class', 'brush')
      .call(brush);

    // Add zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .on('zoom', (event) => {
        const { transform } = event;
        
        // Update scales
        const newXScale = transform.rescaleX(xScale);
        
        // Update axes
        svg.select('.x-axis').call(d3.axisBottom(newXScale) as any);
        
        // Update lines and points
        Object.entries(yScales).forEach(([metricKey, yScale]) => {
          svg.selectAll(`.line-${metricKey}`)
            .attr('d', (d: any) => {
              const line = d3.line<{ date: Date; value: number }>()
                .x((d: { date: Date; value: number }) => newXScale(d.date))
                .y((d: { date: Date; value: number }) => yScale(d.value))
                .curve(d3.curveMonotoneX);
              return line(d);
            });

          svg.selectAll(`.point-${metricKey}`)
            .attr('cx', (d: any) => newXScale(d.date));
        });
      });

    svg.call(zoom);

    // Double-click to reset zoom
    svg.on('dblclick', () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    });

  }, [chartData, visibleMetrics, xScale, yScales, height, width, bgColor, textColor, gridColor, borderColor, onMetricHighlight, onTimeRangeSelect]);

  const chartRef = useD3(renderChart, [chartData, visibleMetrics, xScale, yScales]);

  if (!data.length) {
    return (
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
      >
        <Text color={textColor} fontSize="lg">
          No analysis data available
        </Text>
        <Text color={useColorModeValue('gray.500', 'gray.400')} fontSize="sm" mt={2}>
          Upload an audio file to see your vocal biomarker trends
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="xl" fontWeight="bold" color={textColor} mb={2}>
          Vocal Biomarker Trends Over Time
        </Text>
        <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
          Interactive chart showing your vocal health metrics over time
        </Text>
      </Box>

      {/* Metric Legend */}
      <HStack spacing={4} flexWrap="wrap">
        {visibleMetrics.map(metricKey => {
          const metric = METRIC_CONFIG[metricKey];
          if (!metric) return null;

          return (
            <Badge
              key={metricKey}
              colorScheme="blue"
              variant="subtle"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="sm"
            >
              <HStack spacing={2}>
                <Box
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={metric.color}
                />
                <Text>{metric.label}</Text>
              </HStack>
            </Badge>
          );
        })}
      </HStack>

      {/* Chart Container */}
      <Box
        bg={bgColor}
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        position="relative"
      >
        <svg
          ref={chartRef}
          width={width}
          height={height}
          style={{ display: 'block', margin: 'auto' }}
        />
      </Box>

      {/* Chart Instructions */}
      <Box bg={useColorModeValue('gray.50', 'gray.700')} p={3} borderRadius="md">
        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
          <strong>Chart Controls:</strong> Hover over points for details • Drag to select time ranges • 
          Scroll to zoom • Double-click to reset • Use brush to filter data
        </Text>
      </Box>
    </VStack>
  );
};
