/**
 * Enterprise Database Queries
 * Comprehensive data access layer for Enterprise dashboard
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  EnterpriseTierData,
  StrategicValueDrivers,
  OperationalScalability,
  FinancialOptimization,
  StrategicScenarioPlanning,
  MultiYearProjections
} from '@/lib/validations/enterprise-tier';
import {
  decryptEnterpriseData,
  encryptEnterpriseData
} from '@/lib/security/enterprise-form-encryption';
import {
  decompressScenarioData,
  compressScenarioData
} from '@/lib/storage/enterprise-data-compression';

// Types for API responses
export interface EnterpriseMetrics {
  totalRevenue: number;
  totalAssets: number;
  grossMargin: number;
  netMargin: number;
  employeeCount: number;
  marketShare: number;
  debtToEquity: number;
  workingCapital: number;
  lastUpdated: Date;
}

export interface StrategicScenario {
  id: string;
  name: string;
  type: 'conservative' | 'base' | 'optimistic' | 'custom';
  revenueProjection: number[];
  profitProjection: number[];
  cashFlowProjection: number[];
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  assumptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExitStrategyOption {
  id: string;
  type: 'strategic' | 'financial' | 'mbo' | 'esop' | 'ipo' | 'family';
  feasibility: 'high' | 'medium' | 'low';
  timeline: string;
  estimatedValue: number;
  pros: string[];
  cons: string[];
  requirements: string[];
  rank: number;
}

export interface CapitalStructureData {
  currentDebt: number;
  currentEquity: number;
  debtToEquityRatio: number;
  debtServiceCoverage: number;
  debtCapacity: number;
  workingCapitalNeeds: number;
  cashPosition: number;
  creditLines: number;
  optimalStructure: {
    targetDebtRatio: number;
    recommendations: string[];
  };
}

export interface FinancialProjections {
  baseCase: YearlyProjection[];
  optimisticCase: YearlyProjection[];
  conservativeCase: YearlyProjection[];
  currentMetrics: {
    grossMargin: number;
    netMargin: number;
    growth: number;
  };
  projectedMetrics: {
    grossMargin: number;
    netMargin: number;
    growth: number;
  };
  keyAssumptions: string[];
}

interface YearlyProjection {
  year: number;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  cashFlow: number;
  capex: number;
}

export interface StrategicOptions {
  internationalExpansion: MarketExpansionOption[];
  acquisitionTargets: AcquisitionOption[];
  strategicPartnerships: PartnershipOption[];
  platformStrategies: PlatformOption[];
  franchising: FranchisingOption[];
}

interface MarketExpansionOption {
  market: string;
  opportunitySize: number;
  timeToEntry: number;
  investmentRequired: number;
  expectedROI: number;
  riskFactors: string[];
}

interface AcquisitionOption {
  targetType: string;
  synergies: number;
  integrationRisk: 'low' | 'medium' | 'high';
  paybackPeriod: number;
}

interface PartnershipOption {
  type: string;
  strategicValue: number;
  revenuePotential: number;
}

interface PlatformOption {
  strategy: string;
  valueCreation: number;
  feasibilityScore: number;
}

interface FranchisingOption {
  model: string;
  scalability: number;
  capitalRequirement: number;
}

/**
 * Get comprehensive Enterprise metrics
 */
export async function getEnterpriseMetrics(
  evaluationId: string,
  userId: string
): Promise<EnterpriseMetrics | null> {
  try {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      },
      select: {
        enterpriseTierData: true,
        professionalTierData: true,
        updatedAt: true
      }
    });

    if (!evaluation) return null;

    // Decrypt enterprise data
    const enterpriseData = evaluation.enterpriseTierData
      ? decryptEnterpriseData(evaluation.enterpriseTierData)
      : null;

    if (!enterpriseData) return null;

    // Extract metrics from enterprise data
    const financialOpt = enterpriseData.financialOptimization;
    const strategicDrivers = enterpriseData.strategicValueDrivers;
    const projections = enterpriseData.multiYearProjections;

    return {
      totalRevenue: projections.baseCase[0]?.revenue || 0,
      totalAssets: financialOpt.debtServiceRequirements + (financialOpt.debtServiceRequirements / financialOpt.debtToEquityRatio) || 0,
      grossMargin: projections.currentGrossMargin,
      netMargin: projections.currentNetMargin,
      employeeCount: enterpriseData.operationalScalability.operationalManagerCount || 0,
      marketShare: 0, // Would need additional data
      debtToEquity: financialOpt.debtToEquityRatio,
      workingCapital: financialOpt.workingCapitalPercentage,
      lastUpdated: evaluation.updatedAt
    };
  } catch (error) {
    console.error('Error fetching enterprise metrics:', error);
    return null;
  }
}

/**
 * Get strategic scenarios with projections
 */
export async function getStrategicScenarios(
  evaluationId: string,
  userId: string
): Promise<StrategicScenario[]> {
  try {
    const scenarios = await prisma.enterpriseScenarioModel.findFirst({
      where: {
        businessEvaluationId: evaluationId,
        businessEvaluation: {
          userId: userId
        }
      }
    });

    if (!scenarios) return [];

    const results: StrategicScenario[] = [];

    // Decompress and process base scenario
    if (scenarios.baseScenario) {
      const baseData = await decompressScenarioData(scenarios.baseScenario, 'gzip');
      results.push({
        id: `${evaluationId}-base`,
        name: 'Base Case',
        type: 'base',
        revenueProjection: baseData.revenueProjection || [],
        profitProjection: baseData.profitProjection || [],
        cashFlowProjection: baseData.cashFlowProjection || [],
        riskLevel: 'medium',
        probability: 0.6,
        assumptions: baseData.assumptions || [],
        createdAt: scenarios.createdAt,
        updatedAt: scenarios.lastUpdated || scenarios.createdAt
      });
    }

    // Process optimistic scenario
    if (scenarios.optimisticScenario) {
      const optimisticData = await decompressScenarioData(scenarios.optimisticScenario, 'gzip');
      results.push({
        id: `${evaluationId}-optimistic`,
        name: 'Optimistic Case',
        type: 'optimistic',
        revenueProjection: optimisticData.revenueProjection || [],
        profitProjection: optimisticData.profitProjection || [],
        cashFlowProjection: optimisticData.cashFlowProjection || [],
        riskLevel: 'high',
        probability: 0.2,
        assumptions: optimisticData.assumptions || [],
        createdAt: scenarios.createdAt,
        updatedAt: scenarios.lastUpdated || scenarios.createdAt
      });
    }

    // Process conservative scenario
    if (scenarios.conservativeScenario) {
      const conservativeData = await decompressScenarioData(scenarios.conservativeScenario, 'gzip');
      results.push({
        id: `${evaluationId}-conservative`,
        name: 'Conservative Case',
        type: 'conservative',
        revenueProjection: conservativeData.revenueProjection || [],
        profitProjection: conservativeData.profitProjection || [],
        cashFlowProjection: conservativeData.cashFlowProjection || [],
        riskLevel: 'low',
        probability: 0.2,
        assumptions: conservativeData.assumptions || [],
        createdAt: scenarios.createdAt,
        updatedAt: scenarios.lastUpdated || scenarios.createdAt
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching strategic scenarios:', error);
    return [];
  }
}

/**
 * Get exit strategy options with feasibility analysis
 */
export async function getExitStrategyOptions(
  evaluationId: string,
  userId: string
): Promise<ExitStrategyOption[]> {
  try {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      },
      select: {
        enterpriseTierData: true
      }
    });

    if (!evaluation?.enterpriseTierData) return [];

    const enterpriseData = decryptEnterpriseData(evaluation.enterpriseTierData);
    const scenarioPlanning = enterpriseData.strategicScenarioPlanning;

    return scenarioPlanning.exitStrategyPreferences.map(exit => ({
      id: `${evaluationId}-exit-${exit.rank}`,
      type: exit.type,
      feasibility: exit.feasibility,
      timeline: scenarioPlanning.preferredExitTimeline,
      estimatedValue: calculateExitValue(enterpriseData, exit.type),
      pros: getExitStrategyPros(exit.type),
      cons: getExitStrategyCons(exit.type),
      requirements: getExitStrategyRequirements(exit.type, scenarioPlanning.transactionReadiness),
      rank: exit.rank
    }));
  } catch (error) {
    console.error('Error fetching exit strategy options:', error);
    return [];
  }
}

/**
 * Get capital structure analysis
 */
export async function getCapitalStructureData(
  evaluationId: string,
  userId: string
): Promise<CapitalStructureData | null> {
  try {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      },
      select: {
        enterpriseTierData: true
      }
    });

    if (!evaluation?.enterpriseTierData) return null;

    const enterpriseData = decryptEnterpriseData(evaluation.enterpriseTierData);
    const financialOpt = enterpriseData.financialOptimization;

    const currentEquity = financialOpt.debtServiceRequirements / financialOpt.debtToEquityRatio;
    const currentDebt = financialOpt.debtServiceRequirements;

    return {
      currentDebt,
      currentEquity,
      debtToEquityRatio: financialOpt.debtToEquityRatio,
      debtServiceCoverage: calculateDebtServiceCoverage(enterpriseData),
      debtCapacity: financialOpt.debtCapacityGrowth,
      workingCapitalNeeds: financialOpt.workingCapitalReduction,
      cashPosition: estimateCashPosition(enterpriseData),
      creditLines: estimateCreditLines(financialOpt),
      optimalStructure: {
        targetDebtRatio: calculateOptimalDebtRatio(financialOpt),
        recommendations: generateCapitalStructureRecommendations(financialOpt)
      }
    };
  } catch (error) {
    console.error('Error fetching capital structure data:', error);
    return null;
  }
}

/**
 * Get financial projections across scenarios
 */
export async function getFinancialProjections(
  evaluationId: string,
  userId: string
): Promise<FinancialProjections | null> {
  try {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      },
      select: {
        enterpriseTierData: true
      }
    });

    if (!evaluation?.enterpriseTierData) return null;

    const enterpriseData = decryptEnterpriseData(evaluation.enterpriseTierData);
    const projections = enterpriseData.multiYearProjections;

    return {
      baseCase: projections.baseCase,
      optimisticCase: projections.optimisticCase,
      conservativeCase: projections.conservativeCase,
      currentMetrics: {
        grossMargin: projections.currentGrossMargin,
        netMargin: projections.currentNetMargin,
        growth: calculateCurrentGrowthRate(projections)
      },
      projectedMetrics: {
        grossMargin: projections.projectedGrossMarginYear5,
        netMargin: projections.projectedNetMarginYear5,
        growth: calculateProjectedGrowthRate(projections)
      },
      keyAssumptions: extractKeyAssumptions(enterpriseData)
    };
  } catch (error) {
    console.error('Error fetching financial projections:', error);
    return null;
  }
}

/**
 * Get strategic options analysis
 */
export async function getStrategicOptions(
  evaluationId: string,
  userId: string
): Promise<StrategicOptions | null> {
  try {
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      },
      select: {
        enterpriseTierData: true
      }
    });

    if (!evaluation?.enterpriseTierData) return null;

    const enterpriseData = decryptEnterpriseData(evaluation.enterpriseTierData);
    const scenarioPlanning = enterpriseData.strategicScenarioPlanning;
    const projections = enterpriseData.multiYearProjections;

    return {
      internationalExpansion: scenarioPlanning.marketExpansionOpportunities,
      acquisitionTargets: generateAcquisitionOptions(enterpriseData),
      strategicPartnerships: generatePartnershipOptions(enterpriseData),
      platformStrategies: projections.strategicOptions.filter(opt => opt.type === 'platform'),
      franchising: projections.strategicOptions.filter(opt => opt.type === 'franchise')
    };
  } catch (error) {
    console.error('Error fetching strategic options:', error);
    return null;
  }
}

/**
 * Save scenario configuration
 */
export async function saveScenarioConfiguration(
  evaluationId: string,
  userId: string,
  scenarioData: any
): Promise<boolean> {
  try {
    // Verify ownership
    const evaluation = await prisma.businessEvaluation.findFirst({
      where: {
        id: evaluationId,
        userId: userId,
        subscriptionTier: 'ENTERPRISE'
      }
    });

    if (!evaluation) return false;

    // Compress scenario data
    const compressedData = await compressScenarioData(scenarioData);

    // Update scenario model
    await prisma.enterpriseScenarioModel.upsert({
      where: { businessEvaluationId: evaluationId },
      create: {
        businessEvaluationId: evaluationId,
        baseScenario: compressedData.compressed,
        projectionHorizon: scenarioData.horizon || 5,
        calculationVersion: '1.0.0'
      },
      update: {
        baseScenario: compressedData.compressed,
        lastUpdated: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Error saving scenario configuration:', error);
    return false;
  }
}

/**
 * Load scenario configuration
 */
export async function loadScenarioConfiguration(
  evaluationId: string,
  userId: string
): Promise<any | null> {
  try {
    const scenario = await prisma.enterpriseScenarioModel.findFirst({
      where: {
        businessEvaluationId: evaluationId,
        businessEvaluation: {
          userId: userId
        }
      }
    });

    if (!scenario?.baseScenario) return null;

    return await decompressScenarioData(scenario.baseScenario, 'gzip');
  } catch (error) {
    console.error('Error loading scenario configuration:', error);
    return null;
  }
}

// Helper functions for calculations
function calculateExitValue(data: EnterpriseTierData, exitType: string): number {
  const baseRevenue = data.multiYearProjections.baseCase[4]?.revenue || 0;
  const multipliers = {
    strategic: 8,
    financial: 6,
    mbo: 5,
    esop: 4,
    ipo: 12,
    family: 3
  };
  return baseRevenue * (multipliers[exitType as keyof typeof multipliers] || 5);
}

function getExitStrategyPros(type: string): string[] {
  const prosMap: Record<string, string[]> = {
    strategic: ['Higher valuations', 'Synergy premiums', 'Faster process'],
    financial: ['Professional buyers', 'Growth capital', 'Retained ownership'],
    mbo: ['Continuity', 'Employee retention', 'Cultural preservation'],
    esop: ['Tax benefits', 'Employee ownership', 'Gradual transition'],
    ipo: ['Highest valuations', 'Liquidity', 'Growth capital'],
    family: ['Legacy preservation', 'Family control', 'Gradual transition']
  };
  return prosMap[type] || [];
}

function getExitStrategyCons(type: string): string[] {
  const consMap: Record<string, string[]> = {
    strategic: ['Cultural changes', 'Employee uncertainty', 'Integration risk'],
    financial: ['High leverage', 'Performance pressure', 'Limited strategic resources'],
    mbo: ['Financing challenges', 'Management risk', 'Limited resources'],
    esop: ['Complex structure', 'Valuation challenges', 'Administrative burden'],
    ipo: ['Public scrutiny', 'Regulatory requirements', 'Market volatility'],
    family: ['Limited resources', 'Succession planning', 'Competency gaps']
  };
  return consMap[type] || [];
}

function getExitStrategyRequirements(type: string, readiness: string): string[] {
  const baseRequirements = [
    'Financial audits',
    'Legal compliance',
    'Management team',
    'Growth trajectory'
  ];

  const typeSpecific: Record<string, string[]> = {
    strategic: ['Synergy identification', 'Due diligence preparation'],
    financial: ['Management presentation', 'Growth plan'],
    mbo: ['Management financing', 'Business plan'],
    esop: ['ESOP valuation', 'Trustee selection'],
    ipo: ['SEC compliance', 'Investment banking'],
    family: ['Succession plan', 'Family governance']
  };

  return [...baseRequirements, ...(typeSpecific[type] || [])];
}

function calculateDebtServiceCoverage(data: EnterpriseTierData): number {
  const ebitda = data.multiYearProjections.baseCase[0]?.cashFlow || 0;
  const debtService = data.financialOptimization.debtServiceRequirements;
  return debtService > 0 ? ebitda / debtService : 0;
}

function estimateCashPosition(data: EnterpriseTierData): number {
  return data.multiYearProjections.baseCase[0]?.cashFlow || 0;
}

function estimateCreditLines(financialOpt: FinancialOptimization): number {
  return financialOpt.debtCapacityGrowth * 0.3; // Assume 30% of debt capacity as credit lines
}

function calculateOptimalDebtRatio(financialOpt: FinancialOptimization): number {
  // Industry best practice ranges
  const currentRatio = financialOpt.debtToEquityRatio;
  if (currentRatio > 3) return 2.5; // Too high, reduce
  if (currentRatio < 0.5) return 1.0; // Too low, increase for tax benefits
  return currentRatio;
}

function generateCapitalStructureRecommendations(financialOpt: FinancialOptimization): string[] {
  const recommendations: string[] = [];

  if (financialOpt.debtToEquityRatio > 3) {
    recommendations.push('Consider debt reduction to improve financial stability');
  }

  if (financialOpt.workingCapitalPercentage > 25) {
    recommendations.push('Optimize working capital management');
  }

  if (financialOpt.ownerCompensation > financialOpt.marketRateCompensation * 2) {
    recommendations.push('Normalize owner compensation for exit preparation');
  }

  return recommendations;
}

function calculateCurrentGrowthRate(projections: MultiYearProjections): number {
  const years = projections.baseCase;
  if (years.length < 2) return 0;
  return ((years[1].revenue - years[0].revenue) / years[0].revenue) * 100;
}

function calculateProjectedGrowthRate(projections: MultiYearProjections): number {
  const years = projections.baseCase;
  if (years.length < 5) return 0;
  const cagr = Math.pow(years[4].revenue / years[0].revenue, 1/4) - 1;
  return cagr * 100;
}

function extractKeyAssumptions(data: EnterpriseTierData): string[] {
  return [
    `Growth rate: ${data.strategicScenarioPlanning.realisticGrowthRate}%`,
    `Market position: ${data.multiYearProjections.projectedMarketPosition}`,
    `Gross margin evolution: ${data.multiYearProjections.currentGrossMargin}% to ${data.multiYearProjections.projectedGrossMarginYear5}%`,
    `Capital intensity: ${data.multiYearProjections.maintenanceCapexPercentage}%`
  ];
}

function generateAcquisitionOptions(data: EnterpriseTierData): AcquisitionOption[] {
  return [
    {
      targetType: 'Horizontal competitor',
      synergies: data.strategicValueDrivers.partnershipRevenuePercentage * 1000000,
      integrationRisk: 'medium' as const,
      paybackPeriod: 3
    },
    {
      targetType: 'Vertical supplier',
      synergies: data.financialOptimization.workingCapitalReduction,
      integrationRisk: 'low' as const,
      paybackPeriod: 2
    },
    {
      targetType: 'Technology company',
      synergies: data.operationalScalability.technologyInvestmentThreeYear,
      integrationRisk: 'high' as const,
      paybackPeriod: 4
    }
  ];
}

function generatePartnershipOptions(data: EnterpriseTierData): PartnershipOption[] {
  return [
    {
      type: 'Strategic alliance',
      strategicValue: data.strategicValueDrivers.partnershipAgreementsValue,
      revenuePotential: data.strategicValueDrivers.partnershipRevenuePercentage * 1000000
    },
    {
      type: 'Joint venture',
      strategicValue: data.strategicValueDrivers.brandDevelopmentInvestment,
      revenuePotential: data.multiYearProjections.baseCase[2]?.revenue * 0.15 || 0
    }
  ];
}