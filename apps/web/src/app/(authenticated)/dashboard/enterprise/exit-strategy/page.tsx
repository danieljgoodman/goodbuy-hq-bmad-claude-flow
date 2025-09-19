'use client';

import React from 'react';
import { ExitStrategyDashboard } from '@/components/dashboard/enterprise';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Exit Strategy Modeling Page
 *
 * This page demonstrates the ExitStrategyDashboard component from Story 11.7
 * with all required subcomponents and functionality:
 *
 * - ExitOptionSelector: 6 exit types with feasibility scoring
 * - TimeHorizonSlider: 12-84 month range selection
 * - ExitValuationChart: Timeline analysis and projections
 * - TransactionReadinessScore: Assessment component
 * - ExitOptimizationActions: Recommendations interface
 * - MarketTimingIndicator: Market analysis
 */

export default function ExitStrategyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-tier-enterprise mb-2">
          Exit Strategy Modeling Dashboard
        </h1>
        <p className="text-gray-600">
          Strategic exit planning with valuation optimization and transaction readiness analysis
        </p>
      </div>

      {/* Main Exit Strategy Dashboard Component */}
      <div className="grid grid-cols-1 gap-6">
        <ExitStrategyDashboard />
      </div>

      {/* Component Information Card */}
      <Card className="mt-8 border-tier-enterprise/20">
        <CardHeader>
          <CardTitle className="text-tier-enterprise">
            Component Implementation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Implemented Features:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  6 Exit strategy types (strategic, financial, IPO, MBO, ESOP, family)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Feasibility scoring system (0-100%)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Time horizon slider (12-84 months)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Valuation projections with timeline analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Transaction readiness assessment
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Optimization recommendations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Market timing analysis
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Technical Integration:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  TypeScript types integrated with enterprise-dashboard.ts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  All subcomponents exportable individually
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Enterprise tier brand styling
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Responsive grid layout
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Component exports updated in index.ts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-5

                  rounded-full"></div>
                  Mock data provided for demonstration
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}