'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { PortfolioAllocation } from '@/types/enterprise-dashboard';

interface PortfolioTabProps {
  portfolioData: PortfolioAllocation[];
  isLoading?: boolean;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  portfolioData,
  isLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'underweight' | 'high-risk'>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const filteredData = portfolioData.filter(allocation => {
    if (filter === 'underweight') return allocation.variance < 0;
    if (filter === 'high-risk') return allocation.riskLevel === 'high';
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="enterprise-slide-up space-y-6">
      <Card className="enterprise-card">
        <CardHeader className="enterprise-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="enterprise-card-title">Portfolio Allocation Analysis</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Show All
              </Button>
              <Button
                variant={filter === 'underweight' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('underweight')}
              >
                Underweight Only
              </Button>
              <Button
                variant={filter === 'high-risk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('high-risk')}
              >
                High Risk Only
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="enterprise-chart-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-full max-w-md">
                  {(() => {
                    let currentAngle = 0;
                    const colors = [
                      '#c96442', '#b05730', '#9c87f5', '#b4552d',
                      '#10b981', '#f59e0b', '#3b82f6', '#ded8c4'
                    ];

                    return filteredData.map((allocation, index) => {
                      const percentage = allocation.currentAllocation / 100;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;

                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;

                      const x1 = 200 + 150 * Math.cos(startRad);
                      const y1 = 200 + 150 * Math.sin(startRad);
                      const x2 = 200 + 150 * Math.cos(endRad);
                      const y2 = 200 + 150 * Math.sin(endRad);

                      const largeArc = angle > 180 ? 1 : 0;
                      const path = `M 200 200 L ${x1} ${y1} A 150 150 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      currentAngle = endAngle;

                      return (
                        <g key={index}>
                          <path
                            d={path}
                            fill={colors[index % colors.length]}
                            opacity="0.9"
                            className="hover:opacity-100 transition-opacity cursor-pointer"
                          />
                        </g>
                      );
                    });
                  })()}
                  <circle cx="200" cy="200" r="80" fill="white" />
                  <text x="200" y="195" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                    {formatCurrency(filteredData.reduce((sum, a) => sum + a.totalValue, 0))}
                  </text>
                  <text x="200" y="220" textAnchor="middle" className="text-sm fill-gray-500">
                    Total Value
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-col justify-center space-y-3">
                {filteredData.map((allocation, index) => {
                  const colors = [
                    '#c96442', '#b05730', '#9c87f5', '#b4552d',
                    '#10b981', '#f59e0b', '#3b82f6', '#ded8c4'
                  ];
                  return (
                    <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700">{allocation.assetClass}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{allocation.currentAllocation}%</span>
                        <span className="text-xs text-gray-500">{formatCurrency(allocation.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="enterprise-card">
        <CardHeader className="enterprise-card-header">
          <CardTitle className="enterprise-card-title">Asset Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Asset Class ↕
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Current ↕
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Target ↕
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Performance ↕
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Risk ↕
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-[var(--accent)]">
                    Value ↕
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((allocation, index) => (
                  <TableRow key={index} className="hover:bg-[var(--accent)]">
                    <TableCell className="font-medium">{allocation.assetClass}</TableCell>
                    <TableCell>{allocation.currentAllocation}%</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{allocation.targetAllocation}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={allocation.performance > 0 ? 'text-[var(--success)] font-medium' : 'text-[var(--error)] font-medium'}>
                          {formatPercentage(allocation.performance)}
                        </span>
                        {allocation.variance !== 0 && (
                          <Badge variant={allocation.variance > 0 ? 'secondary' : 'default'}>
                            {allocation.variance > 0 ? '+' : ''}{allocation.variance}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        allocation.riskLevel === 'low' ? 'default' :
                        allocation.riskLevel === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        {allocation.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(allocation.totalValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
