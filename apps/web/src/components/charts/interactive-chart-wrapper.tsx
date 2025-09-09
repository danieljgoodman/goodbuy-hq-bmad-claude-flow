'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Maximize2, 
  Settings,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Brush,
  ReferenceLine
} from 'recharts'
import type { ChartDataPoint, DateRange } from '@/types/dashboard'

interface InteractiveChartWrapperProps {
  title: string
  subtitle?: string
  data: ChartDataPoint[]
  chartType: 'line' | 'bar'
  height?: number
  onDrillDown?: (dataPoint: ChartDataPoint) => void
  onExport?: () => void
  showZoom?: boolean
  showBrush?: boolean
  showCustomPeriod?: boolean
  className?: string
}

interface ChartState {
  zoomLevel: number
  isFullscreen: boolean
  selectedPeriod: '7d' | '30d' | '90d' | '1y' | 'custom'
  brushDomain?: [number, number]
  showGrid: boolean
  showTooltip: boolean
}

const TIME_PERIODS = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
  { value: '1y', label: '1 Year', days: 365 },
  { value: 'custom', label: 'Custom', days: 0 }
]

export default function InteractiveChartWrapper({
  title,
  subtitle,
  data,
  chartType,
  height = 350,
  onDrillDown,
  onExport,
  showZoom = true,
  showBrush = true,
  showCustomPeriod = true,
  className = ""
}: InteractiveChartWrapperProps) {
  const [chartState, setChartState] = useState<ChartState>({
    zoomLevel: 1,
    isFullscreen: false,
    selectedPeriod: '30d',
    showGrid: true,
    showTooltip: true
  })

  const chartRef = useRef<any>(null)
  const [filteredData, setFilteredData] = useState(data)

  // Filter data based on selected period
  useEffect(() => {
    if (chartState.selectedPeriod === 'custom') {
      setFilteredData(data)
      return
    }

    const period = TIME_PERIODS.find(p => p.value === chartState.selectedPeriod)
    if (!period || period.days === 0) {
      setFilteredData(data)
      return
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - period.days)

    const filtered = data.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= cutoffDate
    })

    setFilteredData(filtered)
  }, [data, chartState.selectedPeriod])

  const handleZoomIn = () => {
    setChartState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel * 1.5, 5)
    }))
  }

  const handleZoomOut = () => {
    setChartState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel / 1.5, 0.5)
    }))
  }

  const handleResetZoom = () => {
    setChartState(prev => ({
      ...prev,
      zoomLevel: 1,
      brushDomain: undefined
    }))
  }

  const handlePeriodChange = (period: string) => {
    setChartState(prev => ({
      ...prev,
      selectedPeriod: period as any
    }))
  }

  const handleDataPointClick = (data: any, index: number) => {
    if (onDrillDown && filteredData[index]) {
      onDrillDown(filteredData[index])
    }
  }

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setChartState(prev => ({
        ...prev,
        brushDomain: [brushData.startIndex, brushData.endIndex]
      }))
    }
  }

  const formatTooltip = (value: any, name: string, props: any) => {
    if (typeof value === 'number') {
      return [
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          notation: value >= 1000000 ? 'compact' : 'standard'
        }).format(value),
        name
      ]
    }
    return [value, name]
  }

  const formatXAxisLabel = (tickItem: any) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart
  const DataComponent = chartType === 'line' ? Line : Bar

  return (
    <Card className={`${className} ${chartState.isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0 flex-1 pr-4">
          <CardTitle className="text-base font-medium leading-tight">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 leading-tight">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Time Period Selector */}
          {showCustomPeriod && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Period:</span>
              <Select value={chartState.selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[85px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIODS.map((period) => (
                    <SelectItem key={period.value} value={period.value} className="text-xs">
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Chart Controls */}
          <div className="flex items-center space-x-1 border-l pl-3">
            {showZoom && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleZoomIn} 
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleZoomOut} 
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleResetZoom} 
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {onExport && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onExport} 
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Export Chart"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setChartState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Fullscreen"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Stats */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-primary/60" />
              <span>{filteredData.length} data points</span>
            </div>
            {filteredData.length > 0 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-primary/60" />
                <span>
                  {new Date(filteredData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                  {new Date(filteredData[filteredData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {chartState.zoomLevel !== 1 && (
              <Badge variant="outline" className="text-xs">
                {(chartState.zoomLevel * 100).toFixed(0)}%
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-primary/5">
              {chartType.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Chart */}
        <div 
          style={{ 
            height: chartState.isFullscreen ? 'calc(100vh - 200px)' : height,
            transform: `scale(${chartState.zoomLevel})`,
            transformOrigin: 'top left'
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              ref={chartRef}
              data={filteredData}
              onClick={handleDataPointClick}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {chartState.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                angle={filteredData.length > 10 ? -45 : 0}
                textAnchor={filteredData.length > 10 ? 'end' : 'middle'}
                height={filteredData.length > 10 ? 60 : 30}
              />
              <YAxis tickFormatter={(value) => {
                if (typeof value === 'number' && value >= 1000) {
                  return new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(value)
                }
                return value
              }} />
              
              {chartState.showTooltip && (
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(label) => formatXAxisLabel(label)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              )}
              
              <Legend />
              
              <DataComponent
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                strokeWidth={chartType === 'line' ? 2 : 0}
                dot={chartType === 'line' ? { fill: '#3b82f6', strokeWidth: 2, r: 4 } : undefined}
                activeDot={chartType === 'line' ? { r: 6 } : undefined}
              />
              
              {showBrush && filteredData.length > 10 && (
                <Brush 
                  dataKey="date" 
                  height={30}
                  stroke="#3b82f6"
                  onChange={handleBrushChange}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Chart Options */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={chartState.showGrid}
                onChange={(e) => setChartState(prev => ({ ...prev, showGrid: e.target.checked }))}
                className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 w-3 h-3"
              />
              <span>Grid</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={chartState.showTooltip}
                onChange={(e) => setChartState(prev => ({ ...prev, showTooltip: e.target.checked }))}
                className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 w-3 h-3"
              />
              <span>Tooltip</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {onDrillDown && (
              <span className="hidden sm:inline">Click data points to drill down</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}