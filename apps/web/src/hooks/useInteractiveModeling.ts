'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';
import type { ModelingVariable, ScenarioSnapshot } from '@/components/dashboard/enterprise/InteractiveModeling';

// Integration hook for interactive modeling with existing strategic components
export const useInteractiveModeling = (initialData: StrategicScenarioData) => {
  const [currentData, setCurrentData] = useState<StrategicScenarioData>(initialData);
  const [isModelingActive, setIsModelingActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced update function to prevent excessive recalculations
  const debouncedUpdate = useCallback((variables: ModelingVariable[]) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      // Recalculate strategic data based on modeling variables
      const updatedData = recalculateStrategicData(currentData, variables);
      setCurrentData(updatedData);
      setLastUpdate(new Date());
    }, 300); // 300ms debounce
  }, [currentData]);

  // Integration with ScenarioMatrix
  const updateScenarioMatrix = useCallback((variables: ModelingVariable[]) => {
    const updatedScenarios = currentData.scenarios.map(scenario => {
      const growthRate = variables.find(v => v.id === 'growth_rate')?.value || 0.15;
      const marketConditions = variables.find(v => v.id === 'market_conditions')?.value || 1.0;
      const riskFactor = variables.find(v => v.id === 'risk_factor')?.value || 0.05;

      // Update projections based on variables
      const updatedProjections = scenario.projections.map(projection => ({
        ...projection,
        revenue: projection.revenue * (1 + growthRate) * marketConditions,
        ebitda: projection.ebitda * (1 + growthRate) * marketConditions * 0.9,
        cashFlow: projection.cashFlow * (1 + growthRate) * marketConditions * 0.85,
        valuation: projection.valuation * (1 + growthRate) * marketConditions * (1 - riskFactor)
      }));

      return {
        ...scenario,
        projections: updatedProjections,
        expectedROI: scenario.expectedROI * marketConditions * (1 - riskFactor),
        riskLevel: riskFactor > 0.1 ? 'high' : riskFactor > 0.05 ? 'medium' : 'low' as const
      };
    });

    return { ...currentData, scenarios: updatedScenarios };
  }, [currentData]);

  // Integration with CapitalStructureOptimizer
  const updateCapitalStructure = useCallback((variables: ModelingVariable[]) => {
    const capitalEfficiency = variables.find(v => v.id === 'capital_efficiency')?.value || 0.8;
    const riskFactor = variables.find(v => v.id === 'risk_factor')?.value || 0.05;

    // This would integrate with capital structure calculations
    // For now, we'll just notify that capital structure should be recalculated
    return {
      capitalEfficiencyMultiplier: capitalEfficiency,
      riskAdjustment: riskFactor
    };
  }, []);

  // Integration with ExitStrategyDashboard
  const updateExitStrategy = useCallback((variables: ModelingVariable[]) => {
    const marketConditions = variables.find(v => v.id === 'market_conditions')?.value || 1.0;
    const growthRate = variables.find(v => v.id === 'growth_rate')?.value || 0.15;

    // Calculate exit timing optimization based on variables
    const optimalExitTiming = calculateOptimalExitTiming(marketConditions, growthRate);

    return {
      marketMultiplier: marketConditions,
      growthProjection: growthRate,
      optimalTiming: optimalExitTiming
    };
  }, []);

  // Main integration function
  const integrateWithComponents = useCallback((variables: ModelingVariable[]) => {
    const scenarioUpdate = updateScenarioMatrix(variables);
    const capitalUpdate = updateCapitalStructure(variables);
    const exitUpdate = updateExitStrategy(variables);

    return {
      scenarioMatrix: scenarioUpdate,
      capitalStructure: capitalUpdate,
      exitStrategy: exitUpdate,
      lastUpdated: new Date()
    };
  }, [updateScenarioMatrix, updateCapitalStructure, updateExitStrategy]);

  // Activate modeling mode
  const activateModeling = useCallback(() => {
    setIsModelingActive(true);
  }, []);

  // Deactivate modeling mode
  const deactivateModeling = useCallback(() => {
    setIsModelingActive(false);
    // Reset to original data
    setCurrentData(initialData);
  }, [initialData]);

  // Apply scenario snapshot to all components
  const applyScenarioSnapshot = useCallback((snapshot: ScenarioSnapshot) => {
    const integrationResults = integrateWithComponents(snapshot.variables);

    // Trigger updates in all connected components
    // This would typically use a global state management solution
    return integrationResults;
  }, [integrateWithComponents]);

  // Export current state as scenario
  const exportCurrentState = useCallback((): ScenarioSnapshot => {
    return {
      id: `export_${Date.now()}`,
      name: `Exported ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      variables: [], // Would be populated with current variables
      projections: currentData.scenarios[0]?.projections || [],
      metrics: {
        roi: 0, // Calculate from current data
        npv: 0,
        irr: 0,
        paybackPeriod: 0,
        riskScore: 0
      }
    };
  }, [currentData]);

  return {
    currentData,
    isModelingActive,
    lastUpdate,
    activateModeling,
    deactivateModeling,
    integrateWithComponents,
    applyScenarioSnapshot,
    exportCurrentState,
    debouncedUpdate
  };
};

// Helper function to recalculate strategic data based on modeling variables
const recalculateStrategicData = (
  baseData: StrategicScenarioData,
  variables: ModelingVariable[]
): StrategicScenarioData => {
  // Extract variable values
  const growthRate = variables.find(v => v.id === 'growth_rate')?.value || 0.15;
  const marketConditions = variables.find(v => v.id === 'market_conditions')?.value || 1.0;
  const riskFactor = variables.find(v => v.id === 'risk_factor')?.value || 0.05;
  const costInflation = variables.find(v => v.id === 'cost_inflation')?.value || 0.03;
  const capitalEfficiency = variables.find(v => v.id === 'capital_efficiency')?.value || 0.8;

  // Recalculate scenarios
  const updatedScenarios = baseData.scenarios.map(scenario => {
    const adjustedGrowth = growthRate * marketConditions;
    const adjustedRisk = riskFactor + (1 - marketConditions) * 0.1;

    const updatedProjections = scenario.projections.map((projection, index) => {
      const yearMultiplier = Math.pow(1 + adjustedGrowth, index + 1);
      const costMultiplier = Math.pow(1 + costInflation, index + 1);

      return {
        ...projection,
        revenue: projection.revenue * yearMultiplier,
        ebitda: projection.ebitda * yearMultiplier / costMultiplier,
        cashFlow: projection.cashFlow * yearMultiplier * capitalEfficiency,
        valuation: projection.valuation * yearMultiplier * (1 - adjustedRisk)
      };
    });

    return {
      ...scenario,
      projections: updatedProjections,
      expectedROI: scenario.expectedROI * marketConditions * (1 - adjustedRisk),
      riskLevel: adjustedRisk > 0.1 ? 'high' : adjustedRisk > 0.05 ? 'medium' : 'low' as const,
      probabilityOfSuccess: Math.min(scenario.probabilityOfSuccess * marketConditions, 95)
    };
  });

  // Update risk assessment
  const updatedRiskAssessment = {
    ...baseData.riskAssessment,
    overallRisk: riskFactor > 0.1 ? 'high' : riskFactor > 0.05 ? 'medium' : 'low' as const,
    confidenceLevel: Math.max(baseData.riskAssessment.confidenceLevel * marketConditions, 50)
  };

  return {
    ...baseData,
    scenarios: updatedScenarios,
    riskAssessment: updatedRiskAssessment
  };
};

// Helper function to calculate optimal exit timing
const calculateOptimalExitTiming = (marketConditions: number, growthRate: number): number => {
  // Simplified calculation - in reality this would be much more complex
  if (marketConditions > 1.2 && growthRate > 0.2) {
    return 18; // Exit in 18 months - favorable conditions
  } else if (marketConditions < 0.8 || growthRate < 0.05) {
    return 36; // Wait 36 months - unfavorable conditions
  } else {
    return 24; // Standard 24-month timeline
  }
};

export default useInteractiveModeling;