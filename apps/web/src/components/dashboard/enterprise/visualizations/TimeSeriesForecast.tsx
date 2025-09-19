/**
 * Time Series Forecasting Component with Confidence Bands
 * Interactive chart showing historical data, forecasts, and confidence intervals
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import type {
  TimeSeriesData,
  VisualizationProps,
  ChartInteraction,
  ExportOptions
} from '@/lib/types/visualization';
import {
  createSVG,
  formatNumber,
  formatDate,
  generateForecast,
  exportChart,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS
} from '@/lib/utils/visualization-helpers';

interface TimeSeriesForecastProps extends Omit<VisualizationProps, 'data'> {
  data: TimeSeriesData[];
  forecastPeriods?: number;
  confidenceLevels?: number[];
  showTrend?: boolean;
  showSeasonal?: boolean;
  onPointClick?: (data: TimeSeriesData) => void;
  enableBrushing?: boolean;
}

export function TimeSeriesForecast({
  data,
  config,
  forecastPeriods = 12,
  confidenceLevels = [0.68, 0.95],
  showTrend = true,
  showSeasonal = false,
  onInteraction,
  onExport,
  onPointClick,
  enableBrushing = true,
  className = '',
  testId = 'time-series-forecast'
}: TimeSeriesForecastProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<[Date, Date] | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesData | null>(null);
  const [forecastLength, setForecastLength] = useState([forecastPeriods]);
  const [selectedConfidence, setSelectedConfidence] = useState(0.95);
  const [viewMode, setViewMode] = useState<'full' | 'recent'>('full');

  // Generate forecast data
  const forecastData = React.useMemo(() => {
    const historicalData = data.filter(d => d.actual !== undefined);
    return generateForecast(historicalData, forecastLength[0], selectedConfidence);
  }, [data, forecastLength, selectedConfidence]);

  // Combine historical and forecast data
  const combinedData = React.useMemo(() => {
    return [...data, ...forecastData];
  }, [data, forecastData]);

  // Filter data based on view mode
  const displayData = React.useMemo(() => {
    if (viewMode === 'recent') {
      const lastHistoricalDate = Math.max(...data.map(d => d.date.getTime()));
      const sixMonthsAgo = lastHistoricalDate - (6 * 30 * 24 * 60 * 60 * 1000);
      return combinedData.filter(d => d.date.getTime() >= sixMonthsAgo);
    }
    return combinedData;
  }, [combinedData, viewMode]);

  const renderChart = () => {
    if (!containerRef.current || displayData.length === 0) return;

    const container = d3.select(containerRef.current);
    container.select('svg').remove();

    const dimensions = config.dimensions || {
      ...DEFAULT_DIMENSIONS,
      height: 500
    };

    const svg = createSVG(container, dimensions, 'time-series-svg');

    const width = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const height = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // Scales
    const xExtent = d3.extent(displayData, d => d.date) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const allValues = displayData.flatMap(d => [
      d.actual,
      d.forecast,
      d.upperBound,
      d.lowerBound,
      d.trend,
      d.seasonal
    ]).filter(v => v !== undefined) as number[];

    const yExtent = d3.extent(allValues) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([height, 0]);

    // Separate historical and forecast data
    const historicalData = displayData.filter(d => d.actual !== undefined);
    const forecastDataOnly = displayData.filter(d => d.forecast !== undefined);

    // Create line generators
    const actualLine = d3.line<TimeSeriesData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.actual!))
      .curve(d3.curveMonotoneX)
      .defined(d => d.actual !== undefined);

    const forecastLine = d3.line<TimeSeriesData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.forecast!))
      .curve(d3.curveMonotoneX)
      .defined(d => d.forecast !== undefined);

    const trendLine = d3.line<TimeSeriesData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.trend!))
      .curve(d3.curveMonotoneX)
      .defined(d => d.trend !== undefined);

    // Create area generators for confidence bands
    const confidenceArea = d3.area<TimeSeriesData>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.lowerBound!))
      .y1(d => yScale(d.upperBound!))
      .curve(d3.curveMonotoneX)
      .defined(d => d.upperBound !== undefined && d.lowerBound !== undefined);

    // Add confidence bands
    if (forecastDataOnly.some(d => d.upperBound && d.lowerBound)) {
      g.append('path')
        .datum(forecastDataOnly)
        .attr('class', 'confidence-area')
        .attr('d', confidenceArea)
        .style('fill', COLOR_SCHEMES.risk[0])
        .style('fill-opacity', 0.2)
        .style('stroke', 'none');
    }

    // Add trend line if enabled
    if (showTrend && historicalData.some(d => d.trend !== undefined)) {
      g.append('path')
        .datum(historicalData)
        .attr('class', 'trend-line')
        .attr('d', trendLine)
        .style('fill', 'none')
        .style('stroke', COLOR_SCHEMES.risk[2])
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');
    }

    // Add seasonal component if enabled
    if (showSeasonal && historicalData.some(d => d.seasonal !== undefined)) {
      const seasonalLine = d3.line<TimeSeriesData>()
        .x(d => xScale(d.date))
        .y(d => yScale((d.seasonal || 0) + yExtent[0]))
        .curve(d3.curveMonotoneX)
        .defined(d => d.seasonal !== undefined);

      g.append('path')
        .datum(historicalData)
        .attr('class', 'seasonal-line')
        .attr('d', seasonalLine)
        .style('fill', 'none')
        .style('stroke', COLOR_SCHEMES.risk[3])
        .style('stroke-width', 1)
        .style('stroke-dasharray', '2,2');
    }

    // Add actual data line
    g.append('path')
      .datum(historicalData)
      .attr('class', 'actual-line')
      .attr('d', actualLine)
      .style('fill', 'none')
      .style('stroke', COLOR_SCHEMES.financial[0])
      .style('stroke-width', 3);

    // Add forecast line
    g.append('path')
      .datum(forecastDataOnly)
      .attr('class', 'forecast-line')
      .attr('d', forecastLine)
      .style('fill', 'none')
      .style('stroke', COLOR_SCHEMES.risk[1])
      .style('stroke-width', 3)
      .style('stroke-dasharray', '8,4');

    // Add data points
    const actualPoints = g.selectAll('.actual-point')
      .data(historicalData)
      .enter()
      .append('circle')
      .attr('class', 'actual-point')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.actual!))
      .attr('r', 3)
      .style('fill', COLOR_SCHEMES.financial[0])
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('cursor', 'pointer');

    const forecastPoints = g.selectAll('.forecast-point')
      .data(forecastDataOnly)
      .enter()
      .append('circle')
      .attr('class', 'forecast-point')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.forecast!))
      .attr('r', 3)
      .style('fill', COLOR_SCHEMES.risk[1])
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add interaction
    const overlay = g.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    // Bisector for finding closest data point
    const bisectDate = d3.bisector((d: TimeSeriesData) => d.date).left;

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const i = bisectDate(displayData, x0, 1);
      const d0 = displayData[i - 1];
      const d1 = displayData[i];
      const d = x0.getTime() - d0?.date.getTime() > d1?.date.getTime() - x0.getTime() ? d1 : d0;

      if (d) {
        setHoveredPoint(d);

        // Add hover line
        g.selectAll('.hover-line').remove();
        g.append('line')
          .attr('class', 'hover-line')
          .attr('x1', xScale(d.date))
          .attr('x2', xScale(d.date))
          .attr('y1', 0)
          .attr('y2', height)
          .style('stroke', '#666')
          .style('stroke-width', 1)
          .style('stroke-dasharray', '3,3');

        onInteraction?.({
          type: 'hover',
          data: d,
          position: { x: event.clientX, y: event.clientY },
          element: event.target as SVGElement
        });
      }
    });

    overlay.on('mouseleave', () => {
      setHoveredPoint(null);
      g.selectAll('.hover-line').remove();
    });

    // Point click interactions
    actualPoints.on('click', (event, d) => {
      onPointClick?.(d);
      onInteraction?.({
        type: 'click',
        data: d,
        position: { x: event.clientX, y: event.clientY },
        element: event.target as SVGElement
      });
    });

    forecastPoints.on('click', (event, d) => {
      onPointClick?.(d);
      onInteraction?.({
        type: 'click',
        data: d,
        position: { x: event.clientX, y: event.clientY },
        element: event.target as SVGElement
      });
    });

    // Brushing for period selection
    if (enableBrushing) {
      const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on('end', (event) => {
          if (!event.selection) {
            setSelectedPeriod(null);
            return;
          }

          const [x0, x1] = event.selection as [number, number];
          const period: [Date, Date] = [xScale.invert(x0), xScale.invert(x1)];
          setSelectedPeriod(period);
        });

      const brushGroup = g.append('g')
        .attr('class', 'brush')
        .call(brush);

      brushGroup.selectAll('.overlay')
        .style('cursor', 'crosshair');
    }

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => formatDate(d as Date, 'short'));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => formatNumber(d, 'currency', 0));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + dimensions.margin.bottom - 5)
      .text('Date');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -dimensions.margin.left + 15)
      .text('Value');

    // Add vertical line separating historical and forecast data
    const lastHistoricalDate = Math.max(...historicalData.map(d => d.date.getTime()));
    g.append('line')
      .attr('class', 'forecast-separator')
      .attr('x1', xScale(new Date(lastHistoricalDate)))
      .attr('x2', xScale(new Date(lastHistoricalDate)))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#999')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '5,5');

    svgRef.current = svg.node();
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    if (!containerRef.current) return;

    const options: ExportOptions = {
      format,
      filename: 'time-series-forecast'
    };

    try {
      await exportChart(containerRef.current, options);
      onExport?.(options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const calculateAccuracy = () => {
    const actualValues = data.filter(d => d.actual !== undefined).map(d => d.actual!);
    const forecastValues = data.filter(d => d.forecast !== undefined).map(d => d.forecast!);

    if (actualValues.length === 0 || forecastValues.length === 0) return null;

    const minLength = Math.min(actualValues.length, forecastValues.length);
    const actualSlice = actualValues.slice(-minLength);
    const forecastSlice = forecastValues.slice(0, minLength);

    const mse = actualSlice.reduce((sum, actual, i) => {
      return sum + Math.pow(actual - forecastSlice[i], 2);
    }, 0) / minLength;

    const mae = actualSlice.reduce((sum, actual, i) => {
      return sum + Math.abs(actual - forecastSlice[i]);
    }, 0) / minLength;

    const mape = actualSlice.reduce((sum, actual, i) => {
      return sum + Math.abs((actual - forecastSlice[i]) / actual);
    }, 0) / minLength;

    return { mse, mae, mape };
  };

  useEffect(() => {
    renderChart();
  }, [displayData, showTrend, showSeasonal, selectedConfidence, config]);

  const accuracy = calculateAccuracy();

  return (
    <Card className={`w-full ${className}`} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Series Forecasting with Confidence Bands</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'full' ? 'default' : 'outline'}
              onClick={() => setViewMode('full')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Full
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'recent' ? 'default' : 'outline'}
              onClick={() => setViewMode('recent')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Recent
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

        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Forecast Periods:</label>
            <div className="w-24">
              <Slider
                value={forecastLength}
                onValueChange={setForecastLength}
                max={36}
                min={3}
                step={3}
              />
            </div>
            <span className="text-sm text-gray-600">{forecastLength[0]}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Confidence:</label>
            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={0.68}>68%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-trend"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="show-trend" className="text-sm font-medium">Show Trend</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-seasonal"
              checked={showSeasonal}
              onChange={(e) => setShowSeasonal(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="show-seasonal" className="text-sm font-medium">Show Seasonal</label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="w-full" />

        {hoveredPoint && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">
              {formatDate(hoveredPoint.date, 'medium')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
              {hoveredPoint.actual !== undefined && (
                <div>
                  <span className="font-medium text-blue-600">Actual:</span>{' '}
                  {formatNumber(hoveredPoint.actual, 'currency', 0)}
                </div>
              )}
              {hoveredPoint.forecast !== undefined && (
                <div>
                  <span className="font-medium text-red-600">Forecast:</span>{' '}
                  {formatNumber(hoveredPoint.forecast, 'currency', 0)}
                </div>
              )}
              {hoveredPoint.upperBound !== undefined && (
                <div>
                  <span className="font-medium text-green-600">Upper:</span>{' '}
                  {formatNumber(hoveredPoint.upperBound, 'currency', 0)}
                </div>
              )}
              {hoveredPoint.lowerBound !== undefined && (
                <div>
                  <span className="font-medium text-orange-600">Lower:</span>{' '}
                  {formatNumber(hoveredPoint.lowerBound, 'currency', 0)}
                </div>
              )}
            </div>
          </div>
        )}

        {accuracy && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatNumber(accuracy.mae, 'currency', 0)}
              </div>
              <div className="text-sm text-gray-600">Mean Absolute Error</div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formatNumber(Math.sqrt(accuracy.mse), 'currency', 0)}
              </div>
              <div className="text-sm text-gray-600">Root Mean Square Error</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {formatNumber(accuracy.mape, 'percent', 1)}
              </div>
              <div className="text-sm text-gray-600">Mean Absolute % Error</div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span>Historical Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-600 border-dashed border-t-2"></div>
              <span>Forecast</span>
            </div>
            {showTrend && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-yellow-600 border-dashed border-t"></div>
                <span>Trend</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-red-200"></div>
              <span>{formatNumber(selectedConfidence, 'percent', 0)} Confidence</span>
            </div>
          </div>
        </div>

        {selectedPeriod && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900">Selected Period</h4>
            <div className="text-sm text-yellow-800 mt-1">
              {formatDate(selectedPeriod[0], 'medium')} - {formatDate(selectedPeriod[1], 'medium')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}