/**
 * Advanced Visualizations Dashboard Component
 * Integrates all D3.js visualization components with interactive drill-down capabilities
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Network,
  Zap,
  Target,
  Thermometer,
  GitBranch,
  Calendar,
  Download,
  Maximize2,
  Minimize2,
  Filter,
  Settings,
  RefreshCw
} from 'lucide-react';

// Import visualization components
import { MonteCarloVisualization } from './visualizations/MonteCarloVisualization';
import { SensitivityAnalysisChart } from './visualizations/SensitivityAnalysisChart';
import { SurfacePlot3D } from './visualizations/SurfacePlot3D';
import { RiskHeatMap } from './visualizations/RiskHeatMap';
import { SankeyDiagram } from './visualizations/SankeyDiagram';
import { NetworkGraph } from './visualizations/NetworkGraph';
import { TimeSeriesForecast } from './visualizations/TimeSeriesForecast';

// Import types
import type {
  MonteCarloSimulationData,
  SensitivityAnalysisData,
  SurfacePlotData,
  HeatMapData,
  SankeyNode,
  SankeyLink,
  NetworkNode,
  NetworkLink,
  TimeSeriesData,
  VisualizationConfig,
  ChartInteraction,
  ExportOptions,
  DrillDownConfig
} from '@/lib/types/visualization';

import { formatNumber, formatDate, exportChart } from '@/lib/utils/visualization-helpers';

interface AdvancedVisualizationsProps {
  className?: string;
  onVisualizationInteraction?: (interaction: ChartInteraction) => void;
  enableFullscreen?: boolean;
  enableExportAll?: boolean;
}

interface VisualizationTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
  status: 'active' | 'loading' | 'error';
}

export function AdvancedVisualizations({
  className = '',
  onVisualizationInteraction,
  enableFullscreen = true,
  enableExportAll = true
}: AdvancedVisualizationsProps) {
  // State management
  const [activeTab, setActiveTab] = useState('monte-carlo');
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [drillDownState, setDrillDownState] = useState<{
    level: number;
    path: string[];
    filters: Record<string, any>;
  }>({
    level: 0,
    path: [],
    filters: {}
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDataRange, setSelectedDataRange] = useState<[Date, Date] | null>(null);

  // Sample data generation functions
  const generateMonteCarloData = useCallback((): MonteCarloSimulationData => {
    const results: { value: number; probability: number }[] = [];
    const values: number[] = [];

    // Generate 10,000 random samples for demonstration
    for (let i = 0; i < 10000; i++) {
      const value = Math.random() * 100 + Math.random() * 50 + 25; // Bimodal distribution
      values.push(value);
    }

    // Create histogram
    const bins = 50;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && v < binEnd).length;

      results.push({
        value: binStart + binWidth / 2,
        probability: count / values.length
      });
    }

    return {
      scenario: 'Market Valuation Analysis',
      iterations: 10000,
      results,
      statistics: {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        standardDeviation: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) / values.length),
        variance: values.reduce((sum, val) => sum + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) / values.length,
        skewness: 0.5,
        kurtosis: 3.2,
        percentiles: {
          5: values.sort((a, b) => a - b)[Math.floor(values.length * 0.05)],
          10: values.sort((a, b) => a - b)[Math.floor(values.length * 0.10)],
          25: values.sort((a, b) => a - b)[Math.floor(values.length * 0.25)],
          50: values.sort((a, b) => a - b)[Math.floor(values.length * 0.50)],
          75: values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)],
          90: values.sort((a, b) => a - b)[Math.floor(values.length * 0.90)],
          95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
        }
      },
      confidenceIntervals: [
        { level: 0.68, lower: 45, upper: 85 },
        { level: 0.95, lower: 35, upper: 95 },
        { level: 0.99, lower: 25, upper: 105 }
      ]
    };
  }, []);

  const generateSensitivityData = useCallback((): SensitivityAnalysisData[] => {
    return [
      { variable: 'Revenue Growth Rate', baseValue: 100, impact: 25, lowValue: 75, highValue: 125, change: 0.15, isPositive: true },
      { variable: 'Market Share', baseValue: 100, impact: 20, lowValue: 80, highValue: 120, change: 0.12, isPositive: true },
      { variable: 'Operating Margins', baseValue: 100, impact: 18, lowValue: 82, highValue: 118, change: 0.10, isPositive: true },
      { variable: 'Customer Acquisition Cost', baseValue: 100, impact: -15, lowValue: 115, highValue: 85, change: 0.08, isPositive: false },
      { variable: 'Churn Rate', baseValue: 100, impact: -12, lowValue: 112, highValue: 88, change: 0.07, isPositive: false },
      { variable: 'Discount Rate', baseValue: 100, impact: -10, lowValue: 110, highValue: 90, change: 0.05, isPositive: false }
    ];
  }, []);

  const generateSurfaceData = useCallback((): SurfacePlotData[] => {
    const data: SurfacePlotData[] = [];
    const xRange = 20;
    const yRange = 20;

    for (let x = 0; x < xRange; x++) {
      for (let y = 0; y < yRange; y++) {
        const xVal = (x - xRange / 2) / 2;
        const yVal = (y - yRange / 2) / 2;
        const z = Math.sin(xVal) * Math.cos(yVal) * 10 + Math.random() * 2;

        data.push({
          x: xVal,
          y: yVal,
          z: z + 50,
          label: `Point (${xVal.toFixed(1)}, ${yVal.toFixed(1)})`
        });
      }
    }

    return data;
  }, []);

  const generateHeatMapData = useCallback((): HeatMapData[] => {
    const categories = ['Low Impact', 'Medium Impact', 'High Impact', 'Critical Impact'];
    const probabilities = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    const data: HeatMapData[] = [];

    categories.forEach((category, i) => {
      probabilities.forEach((prob, j) => {
        const riskValue = (i + 1) * (j + 1) * Math.random() * 2;
        data.push({
          x: category,
          y: prob,
          value: riskValue,
          metadata: {
            riskLevel: riskValue > 6 ? 'High' : riskValue > 3 ? 'Medium' : 'Low',
            mitigationRequired: riskValue > 5
          }
        });
      });
    });

    return data;
  }, []);

  const generateSankeyData = useCallback((): { nodes: SankeyNode[]; links: SankeyLink[] } => {
    const nodes: SankeyNode[] = [
      { id: 'revenue', name: 'Total Revenue', category: 'Income' },
      { id: 'product-sales', name: 'Product Sales', category: 'Income' },
      { id: 'services', name: 'Services', category: 'Income' },
      { id: 'operating-costs', name: 'Operating Costs', category: 'Expense' },
      { id: 'marketing', name: 'Marketing', category: 'Expense' },
      { id: 'rd', name: 'R&D', category: 'Expense' },
      { id: 'profit', name: 'Net Profit', category: 'Result' }
    ];

    const links: SankeyLink[] = [
      { source: 'revenue', target: 'product-sales', value: 750000 },
      { source: 'revenue', target: 'services', value: 250000 },
      { source: 'product-sales', target: 'operating-costs', value: 300000 },
      { source: 'product-sales', target: 'marketing', value: 150000 },
      { source: 'product-sales', target: 'rd', value: 100000 },
      { source: 'product-sales', target: 'profit', value: 200000 },
      { source: 'services', target: 'operating-costs', value: 100000 },
      { source: 'services', target: 'marketing', value: 50000 },
      { source: 'services', target: 'profit', value: 100000 }
    ];

    return { nodes, links };
  }, []);

  const generateNetworkData = useCallback((): { nodes: NetworkNode[]; links: NetworkLink[] } => {
    const nodes: NetworkNode[] = [
      { id: 'company', name: 'Our Company', group: 'Primary', value: 100 },
      { id: 'customer-1', name: 'Customer A', group: 'Customer', value: 80 },
      { id: 'customer-2', name: 'Customer B', group: 'Customer', value: 60 },
      { id: 'supplier-1', name: 'Supplier X', group: 'Supplier', value: 70 },
      { id: 'supplier-2', name: 'Supplier Y', group: 'Supplier', value: 50 },
      { id: 'partner-1', name: 'Partner Alpha', group: 'Partner', value: 65 },
      { id: 'partner-2', name: 'Partner Beta', group: 'Partner', value: 45 },
      { id: 'competitor-1', name: 'Competitor 1', group: 'Competitor', value: 85 },
      { id: 'competitor-2', name: 'Competitor 2', group: 'Competitor', value: 75 }
    ];

    const links: NetworkLink[] = [
      { source: 'company', target: 'customer-1', value: 0.9, type: 'revenue' },
      { source: 'company', target: 'customer-2', value: 0.7, type: 'revenue' },
      { source: 'supplier-1', target: 'company', value: 0.8, type: 'supply' },
      { source: 'supplier-2', target: 'company', value: 0.6, type: 'supply' },
      { source: 'company', target: 'partner-1', value: 0.7, type: 'partnership' },
      { source: 'company', target: 'partner-2', value: 0.5, type: 'partnership' },
      { source: 'customer-1', target: 'competitor-1', value: 0.3, type: 'competition' },
      { source: 'customer-2', target: 'competitor-2', value: 0.4, type: 'competition' }
    ];

    return { nodes, links };
  }, []);

  const generateTimeSeriesData = useCallback((): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2024-12-31');
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                     (endDate.getMonth() - startDate.getMonth());

    for (let i = 0; i <= monthDiff; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      const trend = i * 2;
      const seasonal = Math.sin((i % 12) * Math.PI / 6) * 10;
      const noise = (Math.random() - 0.5) * 20;
      const actual = date <= new Date() ? 100 + trend + seasonal + noise : undefined;
      const forecast = date > new Date() ? 100 + trend + seasonal : undefined;

      data.push({
        date,
        actual,
        forecast,
        trend: 100 + trend,
        seasonal,
        upperBound: forecast ? forecast + 15 : undefined,
        lowerBound: forecast ? forecast - 15 : undefined,
        confidence: 0.95
      });
    }

    return data;
  }, []);

  // Generate data
  const monteCarloData = useMemo(() => generateMonteCarloData(), [generateMonteCarloData]);
  const sensitivityData = useMemo(() => generateSensitivityData(), [generateSensitivityData]);
  const surfaceData = useMemo(() => generateSurfaceData(), [generateSurfaceData]);
  const heatMapData = useMemo(() => generateHeatMapData(), [generateHeatMapData]);
  const sankeyData = useMemo(() => generateSankeyData(), [generateSankeyData]);
  const networkData = useMemo(() => generateNetworkData(), [generateNetworkData]);
  const timeSeriesData = useMemo(() => generateTimeSeriesData(), [generateTimeSeriesData]);

  // Visualization configuration
  const visualizationConfig: VisualizationConfig = {
    theme: 'light',
    colors: ['#2563eb', '#dc2626', '#f59e0b', '#059669', '#7c3aed'],
    responsive: true,
    animations: true,
    dimensions: {
      width: fullscreenChart ? window.innerWidth - 100 : 800,
      height: fullscreenChart ? window.innerHeight - 200 : 500,
      margin: { top: 20, right: 30, bottom: 40, left: 50 }
    },
    drillDown: {
      enabled: true,
      levels: ['overview', 'detailed', 'individual'],
      onDrillDown: handleDrillDown,
      onDrillUp: handleDrillUp
    }
  };

  // Event handlers
  const handleInteraction = useCallback((interaction: ChartInteraction) => {
    console.log('Chart interaction:', interaction);
    onVisualizationInteraction?.(interaction);
  }, [onVisualizationInteraction]);

  const handleExport = useCallback((options: ExportOptions) => {
    console.log('Export requested:', options);
  }, []);

  function handleDrillDown(level: string, data: any) {
    setDrillDownState(prev => ({
      level: prev.level + 1,
      path: [...prev.path, level],
      filters: { ...prev.filters, [level]: data }
    }));
  }

  function handleDrillUp(level: string) {
    setDrillDownState(prev => ({
      level: Math.max(0, prev.level - 1),
      path: prev.path.slice(0, -1),
      filters: Object.fromEntries(
        Object.entries(prev.filters).filter(([key]) => key !== level)
      )
    }));
  }

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const exportAllCharts = useCallback(async () => {
    const charts = ['monte-carlo', 'sensitivity', 'surface', 'heatmap', 'sankey', 'network', 'timeseries'];

    for (const chartId of charts) {
      try {
        const element = document.querySelector(`[data-testid="${chartId}-visualization"]`) as HTMLElement;
        if (element) {
          await exportChart(element, {
            format: 'png',
            filename: `advanced-visualization-${chartId}`
          });
        }
      } catch (error) {
        console.error(`Failed to export ${chartId}:`, error);
      }
    }
  }, []);

  // Define visualization tabs
  const visualizationTabs: VisualizationTab[] = [
    {
      id: 'monte-carlo',
      name: 'Monte Carlo',
      icon: <Zap className="w-4 h-4" />,
      description: 'Probability distribution analysis with confidence intervals',
      status: 'active',
      component: (
        <MonteCarloVisualization
          data={monteCarloData}
          config={visualizationConfig}
          onInteraction={handleInteraction}
          onExport={handleExport}
          enableRealTimeSimulation={true}
          testId="monte-carlo-visualization"
        />
      )
    },
    {
      id: 'sensitivity',
      name: 'Sensitivity Analysis',
      icon: <Target className="w-4 h-4" />,
      description: 'Tornado chart showing variable impact on outcomes',
      status: 'active',
      component: (
        <SensitivityAnalysisChart
          data={sensitivityData}
          baseValue={100}
          config={visualizationConfig}
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="sensitivity-visualization"
        />
      )
    },
    {
      id: 'surface',
      name: '3D Surface Plot',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Multi-variable optimization visualization',
      status: 'active',
      component: (
        <SurfacePlot3D
          data={surfaceData}
          config={visualizationConfig}
          xLabel="Risk Factor"
          yLabel="Market Condition"
          zLabel="Expected Return"
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="surface-visualization"
        />
      )
    },
    {
      id: 'heatmap',
      name: 'Risk Heat Map',
      icon: <Thermometer className="w-4 h-4" />,
      description: 'Risk assessment matrix with interactive cells',
      status: 'active',
      component: (
        <RiskHeatMap
          data={heatMapData}
          config={visualizationConfig}
          colorScheme="risk"
          showValues={true}
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="heatmap-visualization"
        />
      )
    },
    {
      id: 'sankey',
      name: 'Cash Flow',
      icon: <GitBranch className="w-4 h-4" />,
      description: 'Sankey diagram for cash flow analysis',
      status: 'active',
      component: (
        <SankeyDiagram
          nodes={sankeyData.nodes}
          links={sankeyData.links}
          config={visualizationConfig}
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="sankey-visualization"
        />
      )
    },
    {
      id: 'network',
      name: 'Business Network',
      icon: <Network className="w-4 h-4" />,
      description: 'Network graph of business relationships',
      status: 'active',
      component: (
        <NetworkGraph
          nodes={networkData.nodes}
          links={networkData.links}
          config={visualizationConfig}
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="network-visualization"
        />
      )
    },
    {
      id: 'timeseries',
      name: 'Time Series',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Forecasting with confidence bands',
      status: 'active',
      component: (
        <TimeSeriesForecast
          data={timeSeriesData}
          config={visualizationConfig}
          onInteraction={handleInteraction}
          onExport={handleExport}
          testId="timeseries-visualization"
        />
      )
    }
  ];

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Advanced Analytics Dashboard</CardTitle>
              <p className="text-gray-600 mt-2">
                Interactive D3.js visualizations with drill-down capabilities and real-time analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {enableExportAll && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportAllCharts}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export All
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Drill-down breadcrumb */}
          {drillDownState.level > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary">
                Level {drillDownState.level}
              </Badge>
              <div className="flex items-center gap-1">
                {drillDownState.path.map((level, index) => (
                  <React.Fragment key={level}>
                    <button
                      onClick={() => handleDrillUp(level)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {level}
                    </button>
                    {index < drillDownState.path.length - 1 && (
                      <span className="text-gray-400">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {visualizationTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {visualizationTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <div className="space-y-4">
              {/* Tab description */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      <div>
                        <h3 className="font-semibold">{tab.name}</h3>
                        <p className="text-sm text-gray-600">{tab.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tab.status === 'active' ? 'default' : 'secondary'}
                      >
                        {tab.status}
                      </Badge>
                      {enableFullscreen && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFullscreenChart(
                            fullscreenChart === tab.id ? null : tab.id
                          )}
                        >
                          {fullscreenChart === tab.id ? (
                            <Minimize2 className="w-4 h-4" />
                          ) : (
                            <Maximize2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization component */}
              <div className={fullscreenChart === tab.id ? 'fixed inset-0 z-50 bg-white p-4' : ''}>
                {tab.component}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Data range selector */}
      {selectedDataRange && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Selected Data Range</h4>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedDataRange[0], 'medium')} - {formatDate(selectedDataRange[1], 'medium')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDataRange(null)}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}