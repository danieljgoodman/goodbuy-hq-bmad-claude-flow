'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { PortfolioAllocation } from '@/types/enterprise-dashboard';

interface PortfolioTabProps {
  portfolioData: PortfolioAllocation[];
  isLoading?: boolean;
}

export const PortfolioTabProfessional: React.FC<PortfolioTabProps> = ({
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
      <div className="section-spacing">
        <Skeleton className="h-96 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="enterprise-fade-in">
      {/* Filter Controls - Minimal Tabs */}
      <div className="section-spacing">
        <div className="flex gap-0 border-b border-[var(--border)]">
          <button
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              filter === 'all'
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setFilter('all')}
          >
            All Assets
            {filter === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              filter === 'underweight'
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setFilter('underweight')}
          >
            Underweight
            {filter === 'underweight' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              filter === 'high-risk'
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setFilter('high-risk')}
          >
            High Risk
            {filter === 'high-risk' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Portfolio Total - Hero Metric */}
      <div className="hero-metric-card">
        <div className="metric-label">Total Portfolio Value</div>
        <div className="metric-primary">
          {formatCurrency(filteredData.reduce((sum, a) => sum + a.totalValue, 0))}
        </div>
        <div className="metric-context">
          {filteredData.length} asset {filteredData.length === 1 ? 'class' : 'classes'} · Filtered by {filter === 'all' ? 'all assets' : filter === 'underweight' ? 'underweight positions' : 'high risk'}
        </div>
      </div>

      {/* Asset Allocation Table - Professional */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Asset Allocation</h2>
        <table className="professional-table">
          <thead>
            <tr>
              <th>Asset Class</th>
              <th className="text-right">Value</th>
              <th className="text-right">Current</th>
              <th className="text-right">Target</th>
              <th className="text-right">Variance</th>
              <th className="text-right">Performance</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((allocation, index) => (
              <tr key={index}>
                <td>
                  <div className="font-medium">{allocation.assetClass}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    {allocation.riskLevel} risk
                  </div>
                </td>
                <td className="text-right font-mono font-medium">
                  {formatCurrency(allocation.totalValue)}
                </td>
                <td className="text-right font-mono">
                  {allocation.currentAllocation}%
                </td>
                <td className="text-right font-mono text-muted-foreground">
                  {allocation.targetAllocation}%
                </td>
                <td className={`text-right font-mono font-semibold ${
                  allocation.variance > 0 ? 'text-success' :
                  allocation.variance < 0 ? 'text-error' :
                  'text-muted-foreground'
                }`}>
                  {allocation.variance !== 0 ? formatPercentage(allocation.variance) : '—'}
                </td>
                <td className={`text-right font-mono font-semibold ${
                  allocation.performance > 0 ? 'text-success' : 'text-error'
                }`}>
                  {formatPercentage(allocation.performance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Allocation Visualization - Minimal Bar Chart */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Allocation Distribution</h2>
        <div className="space-y-4">
          {filteredData.map((allocation, index) => {
            const colors = [
              'var(--primary)', '#b05730', '#9c87f5', '#b4552d',
              'var(--success)', 'var(--warning)', 'var(--info)', '#ded8c4'
            ];
            const color = colors[index % colors.length];

            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{allocation.assetClass}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono">{allocation.currentAllocation}%</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(allocation.totalValue)}
                    </span>
                  </div>
                </div>
                <div className="progress-container h-2">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${allocation.currentAllocation}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Distribution - Minimal Summary */}
      <div className="section-spacing">
        <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
        <div className="grid-layout-3">
          {['low', 'medium', 'high'].map(riskLevel => {
            const count = filteredData.filter(a => a.riskLevel === riskLevel).length;
            const totalValue = filteredData
              .filter(a => a.riskLevel === riskLevel)
              .reduce((sum, a) => sum + a.totalValue, 0);
            const percentage = (totalValue / filteredData.reduce((sum, a) => sum + a.totalValue, 0)) * 100;

            return (
              <div key={riskLevel} className="metric-row flex-col items-start">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {riskLevel} Risk
                </div>
                <div className="text-2xl font-light mb-1">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(totalValue)} · {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
