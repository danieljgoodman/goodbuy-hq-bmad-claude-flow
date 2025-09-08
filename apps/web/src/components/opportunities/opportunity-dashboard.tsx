'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Target, 
  BarChart3, 
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ImprovementOpportunity } from '@/types/opportunities';
import { PriorityTier } from '@/types/opportunities';

interface OpportunityDashboardProps {
  opportunities: ImprovementOpportunity[];
  priorityTiers: PriorityTier[];
  totalPotentialValue: number;
  overallConfidence: number;
  onSelectOpportunity: (opportunity: ImprovementOpportunity) => void;
}

export function OpportunityDashboard({
  opportunities,
  priorityTiers,
  totalPotentialValue,
  overallConfidence,
  onSelectOpportunity
}: OpportunityDashboardProps) {
  
  const highPriorityTier = priorityTiers.find(t => t.tier === 'high');
  const mediumPriorityTier = priorityTiers.find(t => t.tier === 'medium');
  const lowPriorityTier = priorityTiers.find(t => t.tier === 'low');
  
  const getOpportunityById = (id: string) => opportunities.find(opp => opp.id === id);
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };
  
  const getCategoryColor = (category: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      operational: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      strategic: 'bg-orange-100 text-orange-800',
      technology: 'bg-cyan-100 text-cyan-800',
      hr: 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'high':
      case 'very_high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Opportunities</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Potential Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPotentialValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Confidence Level</p>
                <div className="flex items-center space-x-2">
                  <Progress value={overallConfidence * 100} className="flex-1" />
                  <span className="text-sm font-semibold">{(overallConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium">High Priority</p>
                <p className="text-2xl font-bold">{highPriorityTier?.opportunities.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Tiers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Opportunity Priorities</h2>
        
        {/* High Priority */}
        {highPriorityTier && highPriorityTier.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Badge variant="destructive">High Priority</Badge>
                    <span>{formatCurrency(highPriorityTier.totalValue)} potential</span>
                  </CardTitle>
                  <CardDescription>{highPriorityTier.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highPriorityTier.opportunities.slice(0, 3).map(oppId => {
                  const opp = getOpportunityById(oppId);
                  if (!opp) return null;
                  
                  return (
                    <div key={oppId} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                         onClick={() => onSelectOpportunity(opp)}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{opp.title}</h3>
                            <Badge className={getCategoryColor(opp.category)}>
                              {opp.category}
                            </Badge>
                            {getDifficultyIcon(opp.implementationRequirements.difficulty)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{opp.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{opp.implementationRequirements.timelineEstimate}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{opp.impactEstimate.roi.percentage.toFixed(1)}% ROI</span>
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {highPriorityTier.opportunities.length > 3 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    View All {highPriorityTier.opportunities.length} High Priority Opportunities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Medium Priority */}
        {mediumPriorityTier && mediumPriorityTier.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Badge variant="secondary">Medium Priority</Badge>
                    <span>{formatCurrency(mediumPriorityTier.totalValue)} potential</span>
                  </CardTitle>
                  <CardDescription>{mediumPriorityTier.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mediumPriorityTier.opportunities.slice(0, 4).map(oppId => {
                  const opp = getOpportunityById(oppId);
                  if (!opp) return null;
                  
                  return (
                    <div key={oppId} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                         onClick={() => onSelectOpportunity(opp)}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{opp.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {opp.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{formatCurrency(opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount)}</span>
                          <span>{opp.impactEstimate.roi.percentage.toFixed(1)}% ROI</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {mediumPriorityTier.opportunities.length > 4 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    View All {mediumPriorityTier.opportunities.length} Medium Priority Opportunities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Low Priority */}
        {lowPriorityTier && lowPriorityTier.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Badge variant="outline">Low Priority</Badge>
                <span className="text-sm text-gray-600">{lowPriorityTier.opportunities.length} opportunities</span>
              </CardTitle>
              <CardDescription>{lowPriorityTier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                View Low Priority Opportunities
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}