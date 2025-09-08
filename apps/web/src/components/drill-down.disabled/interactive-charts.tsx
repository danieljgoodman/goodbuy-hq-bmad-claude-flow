'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Filter, Download, Maximize2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { usePremiumAccess } from '@/stores/unified-dashboard-store';

interface InteractiveChartsProps {
  data: any[];
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  title: string;
  component: 'valuation' | 'health' | 'documents' | 'opportunities';
  onDataPointClick?: (dataPoint: any) => void;
  onZoom?: (zoomLevel: number) => void;
  onFilter?: (filters: any) => void;
}

interface ChartState {
  zoomLevel: number;
  selectedTimeRange: string;
  selectedCategories: string[];
  viewMode: 'standard' | 'comparison' | 'trend';
  filterOptions: any;
}

export function InteractiveCharts({
  data,
  chartType,
  title,
  component,
  onDataPointClick,
  onZoom,
  onFilter
}: InteractiveChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { hasAccess: hasPremiumAccess } = usePremiumAccess();
  const [chartState, setChartState] = useState<ChartState>({
    zoomLevel: 100,
    selectedTimeRange: '1Y',
    selectedCategories: [],
    viewMode: 'standard',
    filterOptions: {}
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any>(null);

  // Chart configuration based on type and component
  const getChartConfig = () => {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: !isFullscreen,
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        tooltip: {
          enabled: true,
          callbacks: {
            afterBody: hasPremiumAccess ? (context: any) => [
              'Click for detailed analysis',
              'Drag to zoom'
            ] : undefined
          }
        }
      },
      scales: {
        x: {
          type: 'time' as const,
          display: true,
          title: {
            display: true,
            text: getXAxisLabel()
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          title: {
            display: true,
            text: getYAxisLabel()
          }
        }
      },
      onClick: (event: any, elements: any[]) => {
        if (elements.length > 0 && onDataPointClick) {
          const dataIndex = elements[0].index;
          const dataPoint = data[dataIndex];
          onDataPointClick(dataPoint);
        }
      },
      onHover: (event: any, elements: any[]) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          setHoveredDataPoint(data[dataIndex]);
        } else {
          setHoveredDataPoint(null);
        }
      }
    };

    // Add premium features
    if (hasPremiumAccess) {
      (baseConfig as any).plugins = {
        ...baseConfig.plugins,
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy' as const
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'xy' as const,
            onZoomComplete: ({ chart }: any) => {
              const newZoomLevel = Math.round(chart.getZoomLevel() * 100);
              setChartState(prev => ({ ...prev, zoomLevel: newZoomLevel }));
              onZoom?.(newZoomLevel);
            }
          }
        },
        annotation: {
          annotations: getAnnotations()
        }
      };
    }

    return baseConfig;
  };

  const getXAxisLabel = () => {
    const labels = {
      valuation: 'Time Period',
      health: 'Assessment Date',
      documents: 'Document Date',
      opportunities: 'Opportunity Timeline'
    };
    return labels[component];
  };

  const getYAxisLabel = () => {
    const labels = {
      valuation: 'Business Value ($)',
      health: 'Health Score',
      documents: 'Document Count',
      opportunities: 'Opportunity Value ($)'
    };
    return labels[component];
  };

  const getAnnotations = () => {
    // Add trend lines, benchmarks, and key events for premium users
    return {
      trendLine: {
        type: 'line',
        scaleID: 'x',
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 2,
        label: {
          content: 'Trend Line',
          enabled: true
        }
      },
      benchmark: {
        type: 'line',
        scaleID: 'y',
        value: getBenchmarkValue(),
        borderColor: 'rgba(54, 162, 235, 0.8)',
        borderWidth: 1,
        borderDash: [5, 5],
        label: {
          content: 'Industry Benchmark',
          enabled: true
        }
      }
    };
  };

  const getBenchmarkValue = () => {
    // Calculate appropriate benchmark based on component type
    switch (component) {
      case 'valuation':
        return data.length > 0 ? Math.max(...data.map(d => d.value)) * 0.8 : 0;
      case 'health':
        return 75; // Industry average health score
      case 'documents':
        return data.length > 0 ? data.length * 0.5 : 0;
      case 'opportunities':
        return data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0;
      default:
        return 0;
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(chartState.zoomLevel + 25, 500);
    setChartState(prev => ({ ...prev, zoomLevel: newZoom }));
    onZoom?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(chartState.zoomLevel - 25, 25);
    setChartState(prev => ({ ...prev, zoomLevel: newZoom }));
    onZoom?.(newZoom);
  };

  const handleZoomReset = () => {
    setChartState(prev => ({ ...prev, zoomLevel: 100 }));
    onZoom?.(100);
  };

  const handleTimeRangeChange = (range: string) => {
    setChartState(prev => ({ ...prev, selectedTimeRange: range }));
    // Filter data based on time range
    const filteredData = filterDataByTimeRange(data, range);
    onFilter?.({ timeRange: range, data: filteredData });
  };

  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = new Date();
    const ranges = {
      '1M': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3M': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '6M': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      '1Y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      'ALL': new Date(0)
    };

    const cutoffDate = ranges[range as keyof typeof ranges];
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const exportChart = () => {
    if (chartRef.current) {
      // Export chart as image or data
      const canvas = chartRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''} transition-all duration-300`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              {!hasPremiumAccess && (
                <Badge variant="secondary">Basic View</Badge>
              )}
            </CardTitle>
            {hoveredDataPoint && (
              <p className="text-sm text-muted-foreground mt-1">
                Hover Value: {hoveredDataPoint.value} • {hoveredDataPoint.label}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Time Range Selector */}
            <Select
              value={chartState.selectedTimeRange}
              onValueChange={handleTimeRangeChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="3M">3M</SelectItem>
                <SelectItem value="6M">6M</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-12 text-center">
                {chartState.zoomLevel}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleFullscreenToggle}>
              <Maximize2 className="h-4 w-4" />
            </Button>

            {hasPremiumAccess && (
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div 
          ref={chartRef} 
          className={`relative ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'}`}
        >
          {/* Chart would be rendered here using a library like Chart.js or Recharts */}
          <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">
                Interactive {chartType} chart for {component}
              </div>
              <div className="text-sm text-muted-foreground">
                Zoom: {chartState.zoomLevel}% • Range: {chartState.selectedTimeRange}
              </div>
            </div>
          </div>
        </div>

        {hasPremiumAccess && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm">View Mode:</label>
                  <Select
                    value={chartState.viewMode}
                    onValueChange={(value) => setChartState(prev => ({ 
                      ...prev, 
                      viewMode: value as ChartState['viewMode'] 
                    }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="comparison">Comparison</SelectItem>
                      <SelectItem value="trend">Trend Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleZoomReset}>
                  Reset Zoom
                </Button>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}