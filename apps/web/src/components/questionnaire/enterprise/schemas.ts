import { z } from 'zod';

// Common validation helpers
export const percentageSchema = z.number().min(0).max(100);
export const positiveNumberSchema = z.number().min(0);
export const currencySchema = z.number().min(0);
export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Operational Scalability Schema
export const operationalScalabilitySchema = z.object({
  processDocumentation: z.object({
    documentedProcessesPercent: percentageSchema,
    keyPersonDependencies: positiveNumberSchema,
    knowledgeRiskLevel: riskLevelSchema,
    processMaturityScore: percentageSchema,
    documentationGaps: z.array(z.string()),
    improvementPriority: prioritySchema
  }),
  managementSystems: z.object({
    ownerKnowledgeConcentration: percentageSchema,
    managerCount: positiveNumberSchema,
    delegationEffectiveness: percentageSchema,
    leadershipDepth: z.enum(['shallow', 'moderate', 'deep', 'excellent']),
    successionPlan: z.boolean(),
    managementGaps: z.array(z.string())
  }),
  technologyInfrastructure: z.object({
    operationalUtilization: percentageSchema,
    automationOpportunities: z.array(z.string()),
    techInvestmentAnnual: currencySchema,
    systemIntegration: z.enum(['poor', 'fair', 'good', 'excellent']),
    cloudReadiness: percentageSchema,
    cybersecurityScore: percentageSchema
  }),
  scalabilityMetrics: z.object({
    infrastructureThreshold: currencySchema,
    investmentRequired: currencySchema,
    identifiedBottlenecks: z.array(z.string()),
    scalabilityScore: percentageSchema,
    growthCapacity: z.enum(['limited', 'moderate', 'strong', 'unlimited']),
    timelineToScale: positiveNumberSchema
  })
});

// Financial Optimization Schema
export const financialOptimizationSchema = z.object({
  taxStrategy: z.object({
    entityType: z.enum(['sole_proprietorship', 'partnership', 'llc', 's_corp', 'c_corp', 'other']),
    optimizationOpportunities: z.array(z.string()),
    taxAdvisorEngaged: z.boolean(),
    effectiveTaxRate: percentageSchema,
    annualTaxSavings: currencySchema,
    taxPlanningScore: percentageSchema
  }),
  workingCapital: z.object({
    currentRatio: positiveNumberSchema,
    benchmarkRatio: positiveNumberSchema,
    optimizationPotential: currencySchema,
    cashCycleDays: positiveNumberSchema,
    inventoryTurnover: positiveNumberSchema,
    receivablesDays: positiveNumberSchema,
    payablesDays: positiveNumberSchema
  }),
  capitalStructure: z.object({
    debtToEquityCurrent: positiveNumberSchema,
    debtToEquityOptimal: positiveNumberSchema,
    debtServiceCoverage: positiveNumberSchema,
    availableCapacity: currencySchema,
    costOfCapital: positiveNumberSchema,
    creditRating: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown'])
  }),
  ownerCompensation: z.object({
    currentTotal: currencySchema,
    marketRate: currencySchema,
    adjustmentOpportunity: z.number(),
    compensationStructure: z.array(z.string()),
    benefitsPackage: z.array(z.string()),
    retirementContributions: currencySchema
  })
});

// Strategic Scenario Planning Schema
export const strategicScenarioPlanningSchema = z.object({
  growthScenarios: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    probability: percentageSchema,
    revenueGrowth: z.number(),
    marginImprovement: z.number(),
    capitalRequirement: currencySchema,
    timeline: positiveNumberSchema,
    riskLevel: riskLevelSchema,
    keyAssumptions: z.array(z.string()),
    investmentAreas: z.array(z.string()),
    expectedROI: z.number(),
    valuationImpact: z.number()
  })),
  investmentStrategies: z.object({
    organicGrowth: z.object({
      priority: z.number().min(1).max(10),
      investmentAmount: currencySchema,
      expectedReturn: z.number(),
      timeline: positiveNumberSchema,
      riskAssessment: riskLevelSchema.exclude(['critical']),
      keyInitiatives: z.array(z.string())
    }),
    acquisition: z.object({
      priority: z.number().min(1).max(10),
      targetMarketSize: currencySchema,
      averageDealSize: currencySchema,
      expectedSynergies: z.number(),
      integrationComplexity: z.enum(['low', 'medium', 'high']),
      targetCriteria: z.array(z.string())
    }),
    marketExpansion: z.object({
      priority: z.number().min(1).max(10),
      targetMarkets: z.array(z.string()),
      investmentRequired: currencySchema,
      expectedRevenue: currencySchema,
      timeToBreakeven: positiveNumberSchema,
      marketingStrategy: z.string()
    })
  }),
  exitPlanning: z.object({
    preferredTimeline: positiveNumberSchema,
    exitStrategy: z.enum(['strategic_sale', 'financial_buyer', 'ipo', 'management_buyout', 'family_succession', 'liquidation']),
    strategyRanking: z.array(z.string()),
    readinessScore: percentageSchema,
    advisorTeam: z.object({
      investmentBanker: z.boolean(),
      attorney: z.boolean(),
      accountant: z.boolean(),
      taxAdvisor: z.boolean(),
      wealthManager: z.boolean()
    }),
    preparationGaps: z.array(z.string())
  }),
  valueMaximization: z.object({
    driverPriorities: z.array(z.object({
      driver: z.string(),
      currentScore: percentageSchema,
      targetScore: percentageSchema,
      investmentRequired: currencySchema,
      timeline: positiveNumberSchema,
      impactLevel: riskLevelSchema
    })),
    investmentSequencing: z.array(z.string()),
    riskMitigation: z.array(z.object({
      risk: z.string(),
      impact: riskLevelSchema,
      probability: z.enum(['low', 'medium', 'high']),
      mitigation: z.string(),
      cost: currencySchema
    }))
  })
});

// Multi-Year Projections Schema
export const multiYearProjectionsSchema = z.object({
  fiveYearProjections: z.object({
    revenueProjections: z.array(z.object({
      year: z.number(),
      revenue: currencySchema,
      growthRate: z.number(),
      assumptions: z.array(z.string())
    })),
    marginEvolution: z.array(z.object({
      year: z.number(),
      grossMargin: z.number(),
      operatingMargin: z.number(),
      netMargin: z.number(),
      drivers: z.array(z.string())
    })),
    capitalRequirements: z.array(z.object({
      year: z.number(),
      capex: currencySchema,
      workingCapital: z.number(),
      totalCapital: currencySchema,
      fundingSources: z.array(z.string())
    }))
  }),
  marketEvolution: z.object({
    marketPosition: z.enum(['leader', 'challenger', 'follower', 'niche']),
    competitiveThreats: z.array(z.object({
      threat: z.string(),
      impact: riskLevelSchema,
      timeline: positiveNumberSchema,
      mitigation: z.string()
    })),
    disruptionRisk: riskLevelSchema,
    technologyImpact: z.string(),
    regulatoryChanges: z.array(z.string())
  }),
  strategicOptions: z.array(z.object({
    option: z.string(),
    description: z.string(),
    type: z.enum(['international_expansion', 'platform_development', 'franchising', 'vertical_integration', 'rollup', 'other']),
    investmentRequired: currencySchema,
    expectedROI: z.number(),
    timeline: positiveNumberSchema,
    riskLevel: riskLevelSchema,
    prerequisites: z.array(z.string()),
    successFactors: z.array(z.string())
  })),
  optionAnalysis: z.object({
    prioritization: z.array(z.string()),
    investmentSequencing: z.array(z.object({
      phase: z.number(),
      options: z.array(z.string()),
      totalInvestment: currencySchema,
      timeline: positiveNumberSchema
    })),
    sensitivityAnalysis: z.array(z.object({
      variable: z.string(),
      baseCase: z.number(),
      optimistic: z.number(),
      pessimistic: z.number(),
      impact: z.string()
    }))
  })
});

// Combined Enterprise Questionnaire Schema
export const enterpriseQuestionnaireSchema = z.object({
  operationalScalability: operationalScalabilitySchema.optional(),
  financialOptimization: financialOptimizationSchema.optional(),
  strategicScenarioPlanning: strategicScenarioPlanningSchema.optional(),
  multiYearProjections: multiYearProjectionsSchema.optional()
});

// Validation helper functions
export const validateSection = (section: keyof typeof enterpriseQuestionnaireSchema.shape, data: any) => {
  try {
    const sectionSchema = enterpriseQuestionnaireSchema.shape[section];
    return sectionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, errors: [{ path: 'unknown', message: 'Validation failed' }] };
  }
};

export const validateEntireQuestionnaire = (data: any) => {
  try {
    return {
      success: true,
      data: enterpriseQuestionnaireSchema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          section: err.path[0]
        }))
      };
    }
    return { success: false, errors: [{ path: 'unknown', message: 'Validation failed' }] };
  }
};

// Data transformation helpers
export const transformDataForAPI = (data: any) => {
  // Convert form data to API format
  return {
    ...data,
    // Add any necessary transformations here
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
};

export const getCompletionPercentage = (data: any) => {
  const sections = [
    'operationalScalability',
    'financialOptimization',
    'strategicScenarioPlanning',
    'multiYearProjections'
  ];

  let completed = 0;
  let total = sections.length;

  sections.forEach(section => {
    if (data[section] && Object.keys(data[section]).length > 0) {
      completed++;
    }
  });

  return Math.round((completed / total) * 100);
};

// Type exports for TypeScript
export type OperationalScalabilityData = z.infer<typeof operationalScalabilitySchema>;
export type FinancialOptimizationData = z.infer<typeof financialOptimizationSchema>;
export type StrategicScenarioPlanningData = z.infer<typeof strategicScenarioPlanningSchema>;
export type MultiYearProjectionsData = z.infer<typeof multiYearProjectionsSchema>;
export type EnterpriseQuestionnaireData = z.infer<typeof enterpriseQuestionnaireSchema>;