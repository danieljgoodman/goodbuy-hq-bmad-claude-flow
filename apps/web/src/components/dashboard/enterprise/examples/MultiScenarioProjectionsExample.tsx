'use client';

import React from 'react';
import MultiScenarioProjections from '../MultiScenarioProjections';
import { createSampleProjectionData } from '@/lib/utils/enterprise-calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Share2 } from 'lucide-react';

/**
 * Example usage of the MultiScenarioProjections component
 * Demonstrates how to integrate with enterprise calculation utilities
 */
const MultiScenarioProjectionsExample: React.FC = () => {
  const [projectionData, setProjectionData] = React.useState(() => createSampleProjectionData());
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate new sample data
    setProjectionData(createSampleProjectionData());
    setIsLoading(false);
  };

  const handleExportData = () => {
    // In a real implementation, this would export to Excel/PDF
    const dataStr = JSON.stringify(projectionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'multi-scenario-projections.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareAnalysis = () => {
    // In a real implementation, this would generate a shareable link
    navigator.clipboard.writeText(window.location.href);
    // You could show a toast notification here
    console.log('Analysis link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Multi-Scenario Financial Projections Demo</CardTitle>
              <CardDescription>
                Interactive demonstration of 5-year financial projections with multiple scenarios,
                sensitivity analysis, and confidence intervals
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareAnalysis}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Base Case Revenue CAGR</div>
              <div className="text-lg font-bold text-blue-600">
                {(() => {
                  const projections = projectionData.baseCase.projections;
                  if (projections.length > 1) {
                    const initialRevenue = projections[0].revenue;
                    const finalRevenue = projections[projections.length - 1].revenue;
                    const years = projections.length - 1;
                    const cagr = (Math.pow(finalRevenue / initialRevenue, 1 / years) - 1) * 100;
                    return `${cagr.toFixed(1)}%`;
                  }
                  return 'N/A';
                })()}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Scenarios Analyzed</div>
              <div className="text-lg font-bold text-green-600">
                {3 + projectionData.customScenarios.length}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Confidence Level</div>
              <div className="text-lg font-bold text-purple-600">
                {projectionData.baseCase.confidence}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main component */}
      <MultiScenarioProjections data={projectionData} />

      {/* Additional insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scenario Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-3">
                <div className="font-medium">Base Case</div>
                <div className="text-sm text-gray-600">
                  {projectionData.baseCase.assumptions.slice(0, 2).map(a => a.description).join(', ')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {projectionData.baseCase.confidence}% | Probability: {projectionData.baseCase.probability}%
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-3">
                <div className="font-medium">Optimistic Case</div>
                <div className="text-sm text-gray-600">
                  {projectionData.optimisticCase.assumptions.slice(0, 2).map(a => a.description).join(', ')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {projectionData.optimisticCase.confidence}% | Probability: {projectionData.optimisticCase.probability}%
                </div>
              </div>

              <div className="border-l-4 border-red-500 pl-3">
                <div className="font-medium">Conservative Case</div>
                <div className="text-sm text-gray-600">
                  {projectionData.conservativeCase.assumptions.slice(0, 2).map(a => a.description).join(', ')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {projectionData.conservativeCase.confidence}% | Probability: {projectionData.conservativeCase.probability}%
                </div>
              </div>

              {projectionData.customScenarios.map((scenario, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-3">
                  <div className="font-medium">{scenario.scenarioName}</div>
                  <div className="text-sm text-gray-600">
                    {scenario.assumptions.slice(0, 2).map(a => a.description).join(', ')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {scenario.confidence}% | Probability: {scenario.probability}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Assumptions & Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-green-700 mb-2">Key Value Drivers</div>
                <div className="space-y-1">
                  {projectionData.baseCase.keyDrivers.slice(0, 3).map((driver, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{driver.name}</span>
                      <span className={`font-medium ${
                        driver.impact === 'critical' ? 'text-red-600' :
                        driver.impact === 'high' ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {driver.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-red-700 mb-2">Risk Factors</div>
                <div className="space-y-1">
                  {projectionData.baseCase.riskFactors.slice(0, 3).map((risk, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{risk.description}</span>
                      <span className="font-medium text-gray-600">
                        {risk.probability}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-blue-700 mb-2">Sensitivity Variables</div>
                <div className="space-y-1">
                  {projectionData.sensitivityAnalysis.variables.slice(0, 3).map((variable, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{variable.name}</span>
                      <span className="font-medium text-gray-600">
                        ±{Math.max(
                          Math.abs(variable.variations.optimistic - variable.baseValue),
                          Math.abs(variable.variations.pessimistic - variable.baseValue)
                        ).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration notes */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">Integration Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Data Source:</strong> This example uses the <code>createSampleProjectionData()</code>
              function from enterprise-calculations.ts. In production, data would come from your
              Enterprise questionnaire responses and financial models.
            </p>
            <p>
              <strong>Customization:</strong> The component supports custom scenarios beyond the standard
              base/optimistic/conservative cases. Industries can have custom valuation multiples.
            </p>
            <p>
              <strong>API Integration:</strong> Connect to your enterprise evaluation API endpoints
              at <code>/api/evaluations/enterprise/scenarios</code> for real-time scenario modeling.
            </p>
            <p>
              <strong>Export Features:</strong> Implement PDF/Excel export using the calculation utilities
              and chart data for board presentations and investor materials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiScenarioProjectionsExample;