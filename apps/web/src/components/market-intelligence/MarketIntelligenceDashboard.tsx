'use client'

import { useState, useEffect } from 'react'
import { MarketIntelligence } from '@/types'
import { TrendAnalysisCard } from './TrendAnalysisCard'
import { CompetitivePositioningCard } from './CompetitivePositioningCard'
import { OpportunityHeatmap } from './OpportunityHeatmap'
import { MarketAlertsPanel } from './MarketAlertsPanel'
import { IndustrySelector } from './IndustrySelector'
import { DrillDownModal } from './DrillDownModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, TrendingUp, Users, Target, AlertTriangle } from 'lucide-react'

interface MarketIntelligenceDashboardProps {
  userId: string
  initialData?: MarketIntelligence[]
}

export function MarketIntelligenceDashboard({ userId, initialData = [] }: MarketIntelligenceDashboardProps) {
  const [intelligence, setIntelligence] = useState<MarketIntelligence[]>(initialData)
  const [selectedIntelligence, setSelectedIntelligence] = useState<MarketIntelligence | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [drillDownData, setDrillDownData] = useState<any>(null)
  const [drillDownType, setDrillDownType] = useState<'trends' | 'competitive' | 'opportunities' | null>(null)

  useEffect(() => {
    if (intelligence.length > 0 && !selectedIntelligence) {
      setSelectedIntelligence(intelligence[0])
      setSelectedIndustry(intelligence[0].industry)
      setSelectedSector(intelligence[0].sector)
    }
  }, [intelligence, selectedIntelligence])

  const handleIndustryChange = async (industry: string, sector: string) => {
    setSelectedIndustry(industry)
    setSelectedSector(sector)
    
    // Find existing intelligence or load new data
    const existing = intelligence.find(
      intel => intel.industry === industry && intel.sector === sector
    )
    
    if (existing) {
      setSelectedIntelligence(existing)
    } else {
      await loadMarketIntelligence(industry, sector)
    }
  }

  const loadMarketIntelligence = async (industry: string, sector: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/market-intelligence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          industry,
          sector,
          businessData: {
            annualRevenue: 500000, // Would get from user profile
            yearsInBusiness: 5,
            employeeCount: 10,
            marketPosition: 'Growing Player'
          }
        })
      })

      if (response.ok) {
        const newIntelligence = await response.json()
        setIntelligence(prev => [...prev.filter(i => !(i.industry === industry && i.sector === sector)), newIntelligence])
        setSelectedIntelligence(newIntelligence)
      }
    } catch (error) {
      console.error('Failed to load market intelligence:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!selectedIntelligence) return
    
    setRefreshing(true)
    try {
      const response = await fetch('/api/market-intelligence/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intelligenceId: selectedIntelligence.id
        })
      })

      if (response.ok) {
        const refreshedIntelligence = await response.json()
        setIntelligence(prev => 
          prev.map(intel => 
            intel.id === refreshedIntelligence.id ? refreshedIntelligence : intel
          )
        )
        setSelectedIntelligence(refreshedIntelligence)
      }
    } catch (error) {
      console.error('Failed to refresh market intelligence:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDrillDown = (type: 'trends' | 'competitive' | 'opportunities', data: any) => {
    setDrillDownType(type)
    setDrillDownData(data)
  }

  const getLastUpdatedText = (date: Date): string => {
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Updated just now'
    if (diffHours < 24) return `Updated ${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `Updated ${diffDays}d ago`
    return `Updated ${Math.floor(diffDays / 7)}w ago`
  }

  const getMarketMaturityColor = (maturity: string): string => {
    switch (maturity.toLowerCase()) {
      case 'emerging': return 'bg-green-100 text-green-800'
      case 'growth': return 'bg-blue-100 text-blue-800'
      case 'mature': return 'bg-gray-100 text-gray-800'
      case 'declining': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && intelligence.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading market intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-600">AI-powered industry insights and competitive analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <IndustrySelector
            selectedIndustry={selectedIndustry}
            selectedSector={selectedSector}
            onIndustryChange={handleIndustryChange}
            disabled={loading}
          />
          <Button
            onClick={handleRefresh}
            disabled={!selectedIntelligence || refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {selectedIntelligence && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{selectedIntelligence.trendAnalysis.growth_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600">Annual growth rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Position</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedIntelligence.competitivePositioning.positioning_score.toFixed(0)}
                </div>
                <p className="text-xs text-gray-600">Competitive score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {selectedIntelligence.opportunities.length}
                </div>
                <p className="text-xs text-gray-600">High-impact opportunities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Stage</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <Badge 
                    className={getMarketMaturityColor(selectedIntelligence.trendAnalysis.market_maturity)}
                    variant="secondary"
                  >
                    {selectedIntelligence.trendAnalysis.market_maturity}
                  </Badge>
                  <p className="text-xs text-gray-600">
                    {getLastUpdatedText(selectedIntelligence.lastUpdated)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Trend Analysis */}
            <div className="xl:col-span-1">
              <TrendAnalysisCard
                trendAnalysis={selectedIntelligence.trendAnalysis}
                industry={selectedIntelligence.industry}
                onDrillDown={(data) => handleDrillDown('trends', data)}
              />
            </div>

            {/* Middle Column - Competitive Positioning */}
            <div className="xl:col-span-1">
              <CompetitivePositioningCard
                competitivePositioning={selectedIntelligence.competitivePositioning}
                industry={selectedIntelligence.industry}
                onDrillDown={(data) => handleDrillDown('competitive', data)}
              />
            </div>

            {/* Right Column - Market Alerts */}
            <div className="xl:col-span-1">
              <MarketAlertsPanel
                userId={userId}
                industry={selectedIntelligence.industry}
                sector={selectedIntelligence.sector}
              />
            </div>
          </div>

          {/* Bottom Section - Opportunities */}
          <div className="grid grid-cols-1 gap-6">
            <OpportunityHeatmap
              opportunities={selectedIntelligence.opportunities}
              industry={selectedIntelligence.industry}
              onDrillDown={(data) => handleDrillDown('opportunities', data)}
            />
          </div>
        </>
      )}

      {/* Drill Down Modal */}
      {drillDownType && drillDownData && (
        <DrillDownModal
          type={drillDownType}
          data={drillDownData}
          isOpen={!!drillDownType}
          onClose={() => {
            setDrillDownType(null)
            setDrillDownData(null)
          }}
        />
      )}
    </div>
  )
}