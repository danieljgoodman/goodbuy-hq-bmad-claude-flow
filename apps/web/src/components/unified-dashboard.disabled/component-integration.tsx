'use client';

import { useState } from 'react';
import { ChevronRight, TrendingUp, FileText, Heart, Target, AlertCircle, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUnifiedDashboardStore } from '@/stores/unified-dashboard-store';

interface ComponentIntegrationProps {
  type: 'valuation' | 'healthScore' | 'documentIntelligence' | 'opportunities';
  data: any;
  isLoading: boolean;
  businessId: string;
  expanded?: boolean;
}

const componentConfig = {
  valuation: {
    icon: TrendingUp,
    title: 'Business Valuation',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  healthScore: {
    icon: Heart,
    title: 'Health Score',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  documentIntelligence: {
    icon: FileText,
    title: 'Document Intelligence',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  opportunities: {
    icon: Target,
    title: 'Growth Opportunities',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
};

export function ComponentIntegration({
  type,
  data,
  isLoading,
  businessId,
  expanded = false
}: ComponentIntegrationProps) {
  const [showDetails, setShowDetails] = useState(expanded);
  const { refreshComponent, toggleDrillDown } = useUnifiedDashboardStore();

  const config = componentConfig[type];
  const IconComponent = config.icon;

  const handleRefresh = () => {
    refreshComponent(type, businessId);
  };

  const handleDrillDown = () => {
    toggleDrillDown(type);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      current: { variant: 'default' as const, text: 'Current' },
      outdated: { variant: 'secondary' as const, text: 'Outdated' },
      processing: { variant: 'outline' as const, text: 'Processing' },
      error: { variant: 'destructive' as const, text: 'Error' }
    };

    return (
      <Badge variant={statusConfig[status as keyof typeof statusConfig]?.variant || 'secondary'}>
        {statusConfig[status as keyof typeof statusConfig]?.text || status}
      </Badge>
    );
  };

  const renderSummaryContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (data.status === 'error') {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load data</p>
          </div>
        </div>
      );
    }

    // Render component-specific summary based on type
    switch (type) {
      case 'valuation':
        return renderValuationSummary();
      case 'healthScore':
        return renderHealthScoreSummary();
      case 'documentIntelligence':
        return renderDocumentSummary();
      case 'opportunities':
        return renderOpportunitiesSummary();
      default:
        return <p className="text-muted-foreground">No summary available</p>;
    }
  };

  const renderValuationSummary = () => {
    const summary = data.summary;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold text-blue-600">
              ${summary?.currentValue?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confidence</p>
            <div className="flex items-center space-x-2">
              <Progress value={summary?.confidence || 0} className="flex-1" />
              <span className="text-sm">{summary?.confidence || 0}%</span>
            </div>
          </div>
        </div>
        {expanded && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Market Multiple</p>
              <p className="font-semibold">{summary?.marketMultiple || 'N/A'}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Multiple</p>
              <p className="font-semibold">{summary?.revenueMultiple || 'N/A'}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <p className="font-semibold">{summary?.growthRate || 'N/A'}%</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHealthScoreSummary = () => {
    const summary = data.summary;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="text-2xl font-bold text-green-600">
              {summary?.overallScore || 0}/100
            </p>
          </div>
          <div className="w-24 h-24">
            <Progress 
              value={summary?.overallScore || 0} 
              className="h-2 rotate-90 origin-center"
            />
          </div>
        </div>
        {expanded && summary?.categoryScores && (
          <div className="space-y-2">
            {Object.entries(summary.categoryScores).map(([category, score]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm capitalize">{category}</span>
                <div className="flex items-center space-x-2 w-32">
                  <Progress value={score as number} className="flex-1" />
                  <span className="text-sm w-8">{score as number}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDocumentSummary = () => {
    const summary = data.summary;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Documents Analyzed</p>
            <p className="text-2xl font-bold text-purple-600">
              {summary?.totalDocuments || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Key Insights</p>
            <p className="text-2xl font-bold text-purple-600">
              {summary?.keyInsights || 0}
            </p>
          </div>
        </div>
        {expanded && summary?.documentTypes && (
          <div className="space-y-2">
            {Object.entries(summary.documentTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="text-sm capitalize">{type}</span>
                <span className="text-sm font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOpportunitiesSummary = () => {
    const summary = data.summary;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Opportunities</p>
            <p className="text-2xl font-bold text-orange-600">
              {summary?.totalOpportunities || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Value</p>
            <p className="text-2xl font-bold text-orange-600">
              ${summary?.potentialValue?.toLocaleString() || 'N/A'}
            </p>
          </div>
        </div>
        {expanded && summary?.topOpportunities && (
          <div className="space-y-2">
            {summary.topOpportunities.slice(0, 3).map((opportunity: any, index: number) => (
              <div key={index} className="p-2 bg-orange-50 rounded">
                <p className="text-sm font-medium">{opportunity.title}</p>
                <p className="text-xs text-muted-foreground">{opportunity.impact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={expanded ? 'col-span-full' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <IconComponent className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(data.lastCalculated || data.lastAnalyzed || data.lastGenerated).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(data.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderSummaryContent()}
        
        {!expanded && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
              <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDrillDown}
              >
                Analyze
              </Button>
            </div>
          </div>
        )}
        
        {expanded && (
          <div className="flex space-x-2 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDrillDown}
            >
              Detailed Analysis
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled
              title="Export functionality coming soon"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}