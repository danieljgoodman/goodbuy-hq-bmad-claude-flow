/**
 * Sensitivity Analysis Tornado Chart Component
 * Shows impact of variable changes on model outcomes
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter, SortAsc, SortDesc } from 'lucide-react';
import type {
  SensitivityAnalysisData,
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

interface SensitivityAnalysisProps extends Omit<VisualizationProps, 'data'> {
  data: SensitivityAnalysisData[];
  baseValue: number;
  onVariableSelect?: (variable: SensitivityAnalysisData) => void;
  showOnlySignificant?: boolean;
  significanceThreshold?: number;
}

export function SensitivityAnalysisChart({
  data,
  baseValue,
  config,
  onInteraction,
  onExport,
  onVariableSelect,
  showOnlySignificant = false,
  significanceThreshold = 0.05,
  className = '',
  testId = 'sensitivity-analysis-chart'
}: SensitivityAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [sortBy, setSortBy] = useState<'impact' | 'variable'>('impact');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredData, setFilteredData] = useState(data);

  // Filter and sort data
  useEffect(() => {
    let processedData = [...data];

    // Filter by significance if enabled
    if (showOnlySignificant) {
      processedData = processedData.filter(
        d => Math.abs(d.change) >= significanceThreshold
      );
    }

    // Sort data
    processedData.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'impact') {
        return multiplier * (Math.abs(b.impact) - Math.abs(a.impact));
      } else {
        return multiplier * a.variable.localeCompare(b.variable);
      }
    });

    setFilteredData(processedData);
  }, [data, sortBy, sortOrder, showOnlySignificant, significanceThreshold]);

  const renderTornadoChart = () => {
    if (!containerRef.current || filteredData.length === 0) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const dimensions = {
      ...DEFAULT_DIMENSIONS,
      height: Math.max(400, filteredData.length * 40 + 100)
    };

    const svg = createSVG(container, dimensions, 'tornado-chart-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    const width = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const height = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // Calculate the maximum absolute impact for scaling
    const maxImpact = d3.max(filteredData, d => Math.abs(d.impact)) || 0;
    const impactRange = [-maxImpact * 1.1, maxImpact * 1.1];

    // Scales
    const xScale = d3.scaleLinear()
      .domain(impactRange)
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(filteredData.map(d => d.variable))
      .range([0, height])
      .padding(0.1);

    const centerX = xScale(0);

    // Create gradient definitions for positive/negative impacts
    const defs = svg.append('defs');

    const positiveGradient = defs.append('linearGradient')
      .attr('id', 'positive-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 1).attr('y2', 0);

    positiveGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', COLOR_SCHEMES.risk[3])
      .attr('stop-opacity', 0.8);

    positiveGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', COLOR_SCHEMES.risk[3])
      .attr('stop-opacity', 0.4);

    const negativeGradient = defs.append('linearGradient')
      .attr('id', 'negative-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 1).attr('y2', 0);

    negativeGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', COLOR_SCHEMES.risk[1])
      .attr('stop-opacity', 0.8);

    negativeGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', COLOR_SCHEMES.risk[1])
      .attr('stop-opacity', 0.4);

    // Create tornado bars
    const bars = g.selectAll('.tornado-bar')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'tornado-bar')
      .attr('transform', d => `translate(0,${yScale(d.variable)})`);

    // Low impact bars (left side)
    bars.append('rect')
      .attr('class', 'low-impact')
      .attr('x', d => xScale(Math.min(0, d.impact * -1)))
      .attr('y', 0)
      .attr('width', d => Math.abs(xScale(d.impact * -1) - centerX))
      .attr('height', yScale.bandwidth())
      .style('fill', 'url(#negative-gradient)')
      .style('stroke', COLOR_SCHEMES.risk[1])
      .style('stroke-width', 1);

    // High impact bars (right side)
    bars.append('rect')
      .attr('class', 'high-impact')
      .attr('x', centerX)
      .attr('y', 0)
      .attr('width', d => Math.abs(xScale(d.impact) - centerX))
      .attr('height', yScale.bandwidth())
      .style('fill', 'url(#positive-gradient)')
      .style('stroke', COLOR_SCHEMES.risk[3])
      .style('stroke-width', 1);

    // Add variable labels on the left
    bars.append('text')
      .attr('class', 'variable-label')
      .attr('x', -10)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(d => d.variable);

    // Add impact values
    bars.append('text')
      .attr('class', 'impact-value-negative')
      .attr('x', d => xScale(d.impact * -1) + (d.impact < 0 ? 5 : -5))
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.impact < 0 ? 'start' : 'end')
      .style('font-size', '10px')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .text(d => formatNumber(baseValue + (d.impact * -1), 'currency', 0));

    bars.append('text')
      .attr('class', 'impact-value-positive')
      .attr('x', d => xScale(d.impact) + (d.impact > 0 ? -5 : 5))
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.impact > 0 ? 'end' : 'start')
      .style('font-size', '10px')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .text(d => formatNumber(baseValue + d.impact, 'currency', 0));

    // Add center line
    g.append('line')
      .attr('class', 'center-line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#000')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '3,3');

    // Add base value label
    g.append('text')
      .attr('class', 'base-value-label')
      .attr('x', centerX)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(`Base: ${formatNumber(baseValue, 'currency', 0)}`);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => formatNumber(d + baseValue, 'currency', 0))
      .ticks(8);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + dimensions.margin.bottom - 5)
      .text('Impact on Base Case');

    // Add interaction
    bars.on('click', (event, d) => {
      onVariableSelect?.(d);
      onInteraction?.({
        type: 'click',
        data: d,
        position: { x: event.clientX, y: event.clientY },
        element: event.target as SVGElement
      });
    });

    bars.on('mouseover', (event, d) => {
      // Highlight the selected bar
      d3.select(event.currentTarget)
        .selectAll('rect')
        .style('stroke-width', 3)
        .style('opacity', 1);

      onInteraction?.({
        type: 'hover',
        data: {
          variable: d.variable,
          impact: d.impact,
          change: d.change,
          lowValue: baseValue + (d.impact * -1),
          highValue: baseValue + d.impact
        },
        position: { x: event.clientX, y: event.clientY },
        element: event.target as SVGElement
      });
    });

    bars.on('mouseout', (event) => {
      d3.select(event.currentTarget)
        .selectAll('rect')
        .style('stroke-width', 1)
        .style('opacity', 0.8);
    });

    svgRef.current = svg.node();
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'sensitivity-analysis-tornado-chart'
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleSort = (newSortBy: 'impact' | 'variable') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  useEffect(() => {
    renderTornadoChart();
  }, [filteredData, config]);

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sensitivity Analysis - Tornado Chart</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleSort('impact')}
            >
              {sortBy === 'impact' && sortOrder === 'desc' ? (
                <SortDesc className="w-4 h-4 mr-1" />
              ) : (
                <SortAsc className="w-4 h-4 mr-1" />
              )}
              By Impact
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleSort('variable')}
            >
              {sortBy === 'variable' && sortOrder === 'desc' ? (
                <SortDesc className="w-4 h-4 mr-1" />
              ) : (
                <SortAsc className="w-4 h-4 mr-1" />
              )}
              By Name
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
          Showing impact of variable changes on model output.
          Base case: {formatNumber(baseValue, 'currency', 0)}
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full" />

        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3" style={{ background: 'linear-gradient(to right, #dc2626, #dc262680)' }}></div>
              <span>Negative Impact (Low Case)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3" style={{ background: 'linear-gradient(to right, #059669, #05966980)' }}></div>
              <span>Positive Impact (High Case)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-black border-dashed border-t"></div>
              <span>Base Case</span>
            </div>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No significant variables to display.
            {showOnlySignificant && (
              <div className="text-sm mt-2">
                Try lowering the significance threshold or disable filtering.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}