/**
 * Risk Assessment Heat Map Component
 * Interactive heat map for risk matrices and correlation analysis
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, Grid, List } from 'lucide-react';
import type {
  HeatMapData,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  createSVG,
  formatNumber,
  exportChart,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS
} from '@/lib/utils/visualization-helpers';

interface RiskHeatMapProps extends Omit<VisualizationProps, 'data'> {
  data: HeatMapData[];
  xCategories?: string[];
  yCategories?: string[];
  colorScheme?: 'risk' | 'sequential' | 'diverging';
  showValues?: boolean;
  cellSize?: number;
  onCellClick?: (data: HeatMapData) => void;
}

export function RiskHeatMap({
  data,
  config,
  xCategories,
  yCategories,
  colorScheme = 'risk',
  showValues = true,
  cellSize = 50,
  onInteraction,
  onExport,
  onCellClick,
  className = '',
  testId = 'risk-heat-map'
}: RiskHeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatMapData | null>(null);
  const [selectedCells, setSelectedCells] = useState<HeatMapData[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Extract unique categories if not provided
  const xCats = xCategories || [...new Set(data.map(d => String(d.x)))].sort();
  const yCats = yCategories || [...new Set(data.map(d => String(d.y)))].sort();

  // Get color scale based on scheme
  const getColorScale = () => {
    const valueExtent = d3.extent(data, d => d.value) as [number, number];

    switch (colorScheme) {
      case 'risk':
        return d3.scaleSequential()
          .domain(valueExtent)
          .interpolator(d3.interpolateReds);
      case 'diverging':
        return d3.scaleDiverging()
          .domain([valueExtent[0], (valueExtent[0] + valueExtent[1]) / 2, valueExtent[1]])
          .interpolator(d3.interpolateRdYlBu);
      default:
        return d3.scaleSequential()
          .domain(valueExtent)
          .interpolator(d3.interpolateBlues);
    }
  };

  const renderHeatMap = () => {
    if (!containerRef.current || data.length === 0) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const margin = { top: 60, right: 100, bottom: 60, left: 100 };
    const cellWidth = viewMode === 'compact' ? 30 : cellSize;
    const cellHeight = viewMode === 'compact' ? 30 : cellSize;
    const width = xCats.length * cellWidth + margin.left + margin.right;
    const height = yCats.length * cellHeight + margin.top + margin.bottom;

    const dimensions = { width, height, margin };
    const svg = createSVG(container, dimensions, 'heat-map-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3.scaleBand()
      .domain(xCats)
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(yCats)
      .range([0, innerHeight])
      .padding(0.1);

    const colorScale = getColorScale();

    // Create data lookup for efficient access
    const dataLookup = new Map();
    data.forEach(d => {
      dataLookup.set(`${d.x}-${d.y}`, d);
    });

    // Create cells
    const cells = g.selectAll('.heat-cell')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'heat-cell')
      .attr('transform', d => `translate(${xScale(String(d.x))},${yScale(String(d.y))})`);

    // Add rectangles
    cells.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', d => colorScale(d.value))
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setHoveredCell(d);

        // Highlight row and column
        g.selectAll('.heat-cell')
          .style('opacity', cell =>
            cell.x === d.x || cell.y === d.y ? 1 : 0.3
          );

        onInteraction?.({
          type: 'hover',
          data: d,
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      })
      .on('mouseout', () => {
        setHoveredCell(null);
        g.selectAll('.heat-cell').style('opacity', 1);
      })
      .on('click', (event, d) => {
        const isSelected = selectedCells.some(cell =>
          cell.x === d.x && cell.y === d.y
        );

        if (isSelected) {
          setSelectedCells(prev => prev.filter(cell =>
            !(cell.x === d.x && cell.y === d.y)
          ));
        } else {
          setSelectedCells(prev => [...prev, d]);
        }

        onCellClick?.(d);
        onInteraction?.({
          type: 'click',
          data: d,
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      });

    // Add values if enabled
    if (showValues) {
      cells.append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', viewMode === 'compact' ? '10px' : '12px')
        .style('font-weight', 'bold')
        .style('fill', d => {
          const brightness = d3.hsl(colorScale(d.value))?.l || 0;
          return brightness > 0.5 ? '#000' : '#fff';
        })
        .style('pointer-events', 'none')
        .text(d => formatNumber(d.value, 'decimal', 1));
    }

    // Add selection borders
    cells.filter(d => selectedCells.some(cell => cell.x === d.x && cell.y === d.y))
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', 'none')
      .style('stroke', '#000')
      .style('stroke-width', 3)
      .style('pointer-events', 'none');

    // X axis
    const xAxis = d3.axisTop(xScale);
    g.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('dx', '0.5em')
      .attr('dy', '-0.5em')
      .attr('transform', 'rotate(-45)');

    // Y axis
    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Add color legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = innerWidth + 20;
    const legendY = 20;

    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => formatNumber(d, 'decimal', 1));

    // Create gradient for legend
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'heat-map-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', legendWidth).attr('y2', 0);

    const gradientStops = 20;
    for (let i = 0; i <= gradientStops; i++) {
      const t = i / gradientStops;
      const value = colorScale.domain()[0] + t * (colorScale.domain()[1] - colorScale.domain()[0]);
      gradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX},${legendY})`);

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heat-map-gradient)')
      .style('stroke', '#000')
      .style('stroke-width', 1);

    legend.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis);

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Risk Level');

    // Add risk zones if using risk color scheme
    if (colorScheme === 'risk') {
      addRiskZones(g, xScale, yScale, colorScale);
    }

    svgRef.current = svg.node();
  };

  const addRiskZones = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleBand<string>,
    colorScale: d3.ScaleSequential<string>
  ) => {
    const domain = colorScale.domain();
    const range = domain[1] - domain[0];

    const zones = [
      { name: 'Low Risk', threshold: domain[0] + range * 0.33, color: '#22c55e' },
      { name: 'Medium Risk', threshold: domain[0] + range * 0.66, color: '#f59e0b' },
      { name: 'High Risk', threshold: domain[1], color: '#ef4444' }
    ];

    const zoneGroup = g.append('g').attr('class', 'risk-zones');

    zones.forEach((zone, i) => {
      const y = -40 + i * 15;

      zoneGroup.append('circle')
        .attr('cx', -80)
        .attr('cy', y)
        .attr('r', 5)
        .style('fill', zone.color);

      zoneGroup.append('text')
        .attr('x', -70)
        .attr('y', y)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .text(zone.name);
    });
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'risk-heat-map'
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const calculateStatistics = () => {
    const values = data.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
    };
  };

  useEffect(() => {
    renderHeatMap();
  }, [data, viewMode, showValues, colorScheme, selectedCells]);

  const stats = calculateStatistics();

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Risk Assessment Heat Map</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              onClick={() => setViewMode('compact')}
            >
              <List className="w-4 h-4 mr-1" />
              Compact
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('png')}
            >
              <Download className="w-4 h-4 mr-1" />
              PNG
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('svg')}
            >
              <Download className="w-4 h-4 mr-1" />
              SVG
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-2">
          {selectedCells.length > 0 && (
            <span>{selectedCells.length} cells selected. </span>
          )}
          Click cells to select, hover for details.
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full overflow-auto" />

        {hoveredCell && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">
              {String(hoveredCell.x)} × {String(hoveredCell.y)}
            </h4>
            <div className="text-sm text-gray-600 mt-1">
              Risk Value: {formatNumber(hoveredCell.value, 'decimal', 2)}
              {hoveredCell.metadata && (
                <div className="mt-1">
                  {Object.entries(hoveredCell.metadata).map(([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {formatNumber(stats.max, 'decimal', 1)}
            </div>
            <div className="text-sm text-gray-600">Highest Risk</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatNumber(stats.min, 'decimal', 1)}
            </div>
            <div className="text-sm text-gray-600">Lowest Risk</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatNumber(stats.mean, 'decimal', 1)}
            </div>
            <div className="text-sm text-gray-600">Average Risk</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {formatNumber(stats.median, 'decimal', 1)}
            </div>
            <div className="text-sm text-gray-600">Median Risk</div>
          </div>
        </div>

        {selectedCells.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Selected Cells</h4>
            <div className="space-y-1 text-sm">
              {selectedCells.map((cell, index) => (
                <div key={index} className="flex justify-between">
                  <span>{String(cell.x)} × {String(cell.y)}</span>
                  <span className="font-medium">
                    {formatNumber(cell.value, 'decimal', 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}