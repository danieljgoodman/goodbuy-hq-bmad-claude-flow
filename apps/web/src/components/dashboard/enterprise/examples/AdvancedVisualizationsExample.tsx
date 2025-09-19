/**
 * Example component demonstrating advanced visualizations
 * Shows how to integrate all visualization components with real-world data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, PlayIcon } from 'lucide-react';

import { AdvancedVisualizations } from '../AdvancedVisualizations';
import type { ChartInteraction } from '@/lib/types/visualization';

interface ExampleScenario {
  id: string;
  name: string;
  description: string;
  industry: string;
  complexity: 'Simple' | 'Moderate' | 'Complex';
}

export function AdvancedVisualizationsExample() {
  const [selectedScenario, setSelectedScenario] = useState<string>('tech-startup');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionLog, setInteractionLog] = useState<ChartInteraction[]>([]);

  // Example scenarios
  const scenarios: ExampleScenario[] = [
    {
      id: 'tech-startup',
      name: 'Tech Startup Valuation',
      description: 'Early-stage SaaS company with high growth potential and market uncertainty',
      industry: 'Technology',
      complexity: 'Complex'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing Operations',
      description: 'Established manufacturing company with predictable cash flows and operational metrics',
      industry: 'Manufacturing',
      complexity: 'Moderate'
    },
    {
      id: 'retail-chain',
      name: 'Retail Chain Expansion',
      description: 'Multi-location retail business evaluating expansion opportunities',
      industry: 'Retail',
      complexity: 'Moderate'
    },
    {
      id: 'real-estate',
      name: 'Commercial Real Estate',
      description: 'Commercial real estate portfolio with diverse property types and markets',
      industry: 'Real Estate',
      complexity: 'Simple'
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  // Handle visualization interactions
  const handleVisualizationInteraction = (interaction: ChartInteraction) => {
    setInteractionLog(prev => [
      {
        ...interaction,
        timestamp: new Date()
      },
      ...prev.slice(0, 9) // Keep last 10 interactions
    ]);
  };

  // Load scenario data
  const loadScenario = async (scenarioId: string) => {
    setIsLoading(true);

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSelectedScenario(scenarioId);
    setInteractionLog([]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Advanced Visualizations Demo
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Interactive D3.js visualizations for enterprise financial analysis and decision making
          </p>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              This demo showcases advanced visualization capabilities including Monte Carlo simulations,
              sensitivity analysis, 3D surface plots, risk heat maps, Sankey diagrams, network graphs,
              and time series forecasting with confidence bands.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Analysis Scenario</CardTitle>
          <p className="text-gray-600">
            Choose a business scenario to explore different visualization techniques
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedScenario === scenario.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => loadScenario(scenario.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{scenario.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        scenario.complexity === 'Complex'
                          ? 'bg-red-100 text-red-800'
                          : scenario.complexity === 'Moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {scenario.complexity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {scenario.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600">
                      {scenario.industry}
                    </span>
                    {selectedScenario === scenario.id && (
                      <PlayIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Scenario Details */}
      {currentScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Scenario: {currentScenario.name}
              <span className="text-sm font-normal text-gray-600">
                ({currentScenario.industry})
              </span>
            </CardTitle>
            <p className="text-gray-600">{currentScenario.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Analysis Type:</span>
                <div className="mt-1">
                  Enterprise Financial Modeling
                </div>
              </div>
              <div>
                <span className="font-medium">Data Points:</span>
                <div className="mt-1">
                  ~50,000 simulated transactions
                </div>
              </div>
              <div>
                <span className="font-medium">Time Horizon:</span>
                <div className="mt-1">
                  3-year projection period
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualization Components */}
      {!isLoading && (
        <AdvancedVisualizations
          onVisualizationInteraction={handleVisualizationInteraction}
          enableFullscreen={true}
          enableExportAll={true}
          className="mt-6"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold">Loading Scenario Data</h3>
              <p className="text-gray-600">
                Generating visualizations for {currentScenario?.name}...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interaction Log */}
      {interactionLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Interactions</CardTitle>
            <p className="text-gray-600 text-sm">
              Latest user interactions with visualizations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {interactionLog.map((interaction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        interaction.type === 'click'
                          ? 'bg-blue-500'
                          : interaction.type === 'hover'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium capitalize">
                      {interaction.type} Interaction
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      {typeof interaction.data === 'object'
                        ? JSON.stringify(interaction.data, null, 2).slice(0, 100) + '...'
                        : String(interaction.data)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {new Date(interaction.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Monte Carlo Simulation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 10,000+ iteration probability analysis</li>
                <li>• Real-time confidence intervals</li>
                <li>• Statistical distribution visualization</li>
                <li>• Interactive parameter adjustment</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-green-600 mb-2">Sensitivity Analysis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tornado charts for impact ranking</li>
                <li>• Variable significance filtering</li>
                <li>• Interactive drill-down capabilities</li>
                <li>• Sortable impact analysis</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-600 mb-2">3D Surface Plots</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-variable optimization</li>
                <li>• Three.js powered 3D rendering</li>
                <li>• Interactive rotation and zoom</li>
                <li>• Optimum point identification</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-red-600 mb-2">Risk Heat Maps</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Risk matrix visualization</li>
                <li>• Interactive cell selection</li>
                <li>• Color-coded risk levels</li>
                <li>• Statistical summaries</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-orange-600 mb-2">Cash Flow Analysis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sankey diagram flow visualization</li>
                <li>• Interactive node and link selection</li>
                <li>• Proportional flow representation</li>
                <li>• Category-based analysis</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-teal-600 mb-2">Network Relationships</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Force-directed graph layout</li>
                <li>• Business relationship mapping</li>
                <li>• Interactive node clustering</li>
                <li>• Connection strength visualization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Optimizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Canvas Rendering</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• High-performance rendering for large datasets</li>
                <li>• Automatic fallback from SVG to Canvas</li>
                <li>• Level-of-detail rendering</li>
                <li>• Adaptive quality adjustment</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Data Processing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Web Worker background processing</li>
                <li>• Data virtualization for large sets</li>
                <li>• Memory-efficient streaming</li>
                <li>• Real-time performance monitoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">PNG Export</h3>
              <p className="text-blue-600">
                High-resolution raster images for presentations and reports
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">SVG Export</h3>
              <p className="text-green-600">
                Scalable vector graphics for professional publications
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">PDF Export</h3>
              <p className="text-purple-600">
                Document-ready formats for formal reporting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}