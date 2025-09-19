/**
 * Monte Carlo Simulation Visualization Component
 * Features probability distributions, confidence intervals, and statistical analysis
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';
import type {
  MonteCarloSimulationData,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  createSVG,
  formatNumber,
  calculateStatistics,
  calculateConfidenceIntervals,
  exportChart,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS
} from '@/lib/utils/visualization-helpers';

interface MonteCarloProps extends Omit<VisualizationProps, 'data'> {
  data: MonteCarloSimulationData;
  onSimulationUpdate?: (data: MonteCarloSimulationData) => void;
  enableRealTimeSimulation?: boolean;
}

export function MonteCarloVisualization({
  data,
  config,
  onInteraction,
  onExport,
  onSimulationUpdate,
  enableRealTimeSimulation = true,
  className = '',
  testId = 'monte-carlo-visualization'
}: MonteCarloProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [iterations, setIterations] = useState([data.iterations]);
  const [currentData, setCurrentData] = useState(data);
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState(0.95);

  // Run Monte Carlo simulation
  const runSimulation = (numIterations: number) => {
    const results: { value: number; probability: number }[] = [];
    const values: number[] = [];

    // Simple Monte Carlo simulation for demonstration
    // In real implementation, this would use actual financial models
    for (let i = 0; i < numIterations; i++) {
      const randomValue = d3.randomNormal(100, 20)(); // Mean=100, StdDev=20
      values.push(randomValue);
    }

    // Calculate probability distribution
    const bins = d3.bin().thresholds(50)(values);
    const total = values.length;

    bins.forEach(bin => {
      if (bin.length > 0) {
        results.push({
          value: (bin.x0! + bin.x1!) / 2,
          probability: bin.length / total
        });
      }
    });

    const statistics = calculateStatistics(values);
    const confidenceIntervals = calculateConfidenceIntervals(values);

    const simulationData: MonteCarloSimulationData = {
      scenario: currentData.scenario,
      iterations: numIterations,
      results,
      statistics,
      confidenceIntervals
    };

    setCurrentData(simulationData);
    onSimulationUpdate?.(simulationData);
  };

  const renderDistribution = () => {
    if (!containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const dimensions = config.dimensions || DEFAULT_DIMENSIONS;
    const svg = createSVG(container, dimensions, 'monte-carlo-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    const width = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const height = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(currentData.results, d => d.value) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(currentData.results, d => d.probability) || 0])
      .range([height, 0]);

    // Create line generator for distribution curve
    const line = d3.line<{ value: number; probability: number }>()
      .x(d => xScale(d.value))
      .y(d => yScale(d.probability))
      .curve(d3.curveBasis);

    // Create area generator for filled distribution
    const area = d3.area<{ value: number; probability: number }>()
      .x(d => xScale(d.value))
      .y0(height)
      .y1(d => yScale(d.probability))
      .curve(d3.curveBasis);

    // Render distribution area
    g.append('path')
      .datum(currentData.results)
      .attr('class', 'distribution-area')
      .attr('d', area)
      .style('fill', COLOR_SCHEMES.financial[0])
      .style('fill-opacity', 0.3)
      .style('stroke', COLOR_SCHEMES.financial[0])
      .style('stroke-width', 2);

    // Render distribution line
    g.append('path')
      .datum(currentData.results)
      .attr('class', 'distribution-line')
      .attr('d', line)
      .style('fill', 'none')
      .style('stroke', COLOR_SCHEMES.financial[0])
      .style('stroke-width', 2);

    // Add confidence intervals
    const selectedInterval = currentData.confidenceIntervals.find(
      ci => ci.level === selectedConfidenceLevel
    );

    if (selectedInterval) {
      const intervalGroup = g.append('g').attr('class', 'confidence-interval');

      // Lower bound line
      intervalGroup.append('line')
        .attr('x1', xScale(selectedInterval.lower))
        .attr('x2', xScale(selectedInterval.lower))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', COLOR_SCHEMES.risk[1])
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');

      // Upper bound line
      intervalGroup.append('line')
        .attr('x1', xScale(selectedInterval.upper))
        .attr('x2', xScale(selectedInterval.upper))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', COLOR_SCHEMES.risk[1])
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');

      // Confidence area
      intervalGroup.append('rect')
        .attr('x', xScale(selectedInterval.lower))
        .attr('width', xScale(selectedInterval.upper) - xScale(selectedInterval.lower))
        .attr('y', 0)
        .attr('height', height)
        .style('fill', COLOR_SCHEMES.risk[1])
        .style('fill-opacity', 0.1);
    }

    // Add statistical markers
    const statsGroup = g.append('g').attr('class', 'statistics');

    // Mean line
    statsGroup.append('line')
      .attr('x1', xScale(currentData.statistics.mean))
      .attr('x2', xScale(currentData.statistics.mean))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', COLOR_SCHEMES.risk[3])
      .style('stroke-width', 3);

    // Median line
    statsGroup.append('line')
      .attr('x1', xScale(currentData.statistics.median))
      .attr('x2', xScale(currentData.statistics.median))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', COLOR_SCHEMES.risk[2])
      .style('stroke-width', 2)
      .style('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => formatNumber(d, 'currency', 0));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => formatNumber(d, 'percent', 1));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + dimensions.margin.bottom - 5)
      .text('Value');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -dimensions.margin.left + 15)
      .text('Probability');

    // Add interaction
    const overlay = g.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const value = xScale.invert(mouseX);

      // Find closest data point
      const closestPoint = currentData.results.reduce((prev, curr) =>
        Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
      );

      onInteraction?.({
        type: 'hover',
        data: { value: closestPoint.value, probability: closestPoint.probability },
        position: { x: event.clientX, y: event.clientY },
        element: event.target as SVGElement
      });
    });

    svgRef.current = svg.node();
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: `monte-carlo-${currentData.scenario.toLowerCase().replace(/\s+/g, '-')}`
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    const interval = setInterval(() => {
      runSimulation(iterations[0]);
    }, 1000);

    setTimeout(() => {
      setIsSimulating(false);
      clearInterval(interval);
    }, 10000); // Run for 10 seconds
  };

  const resetSimulation = () => {
    setCurrentData(data);
    setIsSimulating(false);
  };

  useEffect(() => {
    renderDistribution();
  }, [currentData, selectedConfidenceLevel, config]);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      runSimulation(iterations[0]);
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, iterations]);

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monte Carlo Simulation - {currentData.scenario}</CardTitle>
          <div className="flex items-center gap-2">
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        {enableRealTimeSimulation && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={isSimulating ? () => setIsSimulating(false) : startSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {isSimulating ? 'Running...' : 'Start Simulation'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetSimulation}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Iterations:</label>
              <div className="w-32">
                <Slider
                  value={iterations}
                  onValueChange={setIterations}
                  max={10000}
                  min={100}
                  step={100}
                />
              </div>
              <span className="text-sm text-gray-600">{iterations[0]}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Confidence:</label>
              <select
                value={selectedConfidenceLevel}
                onChange={(e) => setSelectedConfidenceLevel(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={0.68}>68%</option>
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(currentData.statistics.mean, 'currency', 0)}
            </div>
            <div className="text-sm text-gray-600">Mean</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(currentData.statistics.median, 'currency', 0)}
            </div>
            <div className="text-sm text-gray-600">Median</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(currentData.statistics.standardDeviation, 'currency', 0)}
            </div>
            <div className="text-sm text-gray-600">Std Dev</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(currentData.statistics.percentiles[95] - currentData.statistics.percentiles[5], 'currency', 0)}
            </div>
            <div className="text-sm text-gray-600">90% Range</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span>Mean</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500 border-dashed border-t"></div>
              <span>Median</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500 border-dashed border-t"></div>
              <span>{formatNumber(selectedConfidenceLevel, 'percent', 0)} Confidence</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}