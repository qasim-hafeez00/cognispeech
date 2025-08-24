"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface ChartData {
  label: string
  value: number
}

export const useD3Chart = (data: ChartData[], width = 400, height = 300) => {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || !data.length) return

    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .range([innerHeight, 0])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.label) || 0)
      .attr("y", (d) => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.value))
      .attr("fill", "#3b82f6")

    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale))

    g.append("g").call(d3.axisLeft(yScale))
  }, [data, width, height])

  return ref
}
