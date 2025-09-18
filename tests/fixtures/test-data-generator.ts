import { faker } from '@faker-js/faker'
import {
  type ProfessionalTierData,
  type ProfessionalFinancialMetrics,
  type CustomerAnalytics,
  type OperationalEfficiency,
  type MarketIntelligence,
  type FinancialPlanning,
  type Compliance,
  type ProfessionalEvaluation,
  type ProfessionalBusinessData
} from '@/lib/validations/professional-tier'

export class TestDataGenerator {
  private static instance: TestDataGenerator
  private seedValue: number = 12345

  private constructor() {
    this.setSeed(this.seedValue)
  }

  static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator()
    }
    return TestDataGenerator.instance
  }

  setSeed(seed: number): void {
    this.seedValue = seed
    faker.seed(seed)
  }

  resetSeed(): void {
    this.setSeed(this.seedValue)
  }

  // Professional Financial Metrics Generator
  generateProfessionalFinancialMetrics(): ProfessionalFinancialMetrics {
    const annualRevenue = faker.number.int({ min: 100000, max: 50000000 })
    const expenses = faker.number.int({ min: annualRevenue * 0.5, max: annualRevenue * 0.9 })
    const grossMargin = faker.number.float({ min: 10, max: 80, fractionDigits: 1 })

    return {
      // Core metrics
      annualRevenue,
      monthlyRecurring: Math.floor(annualRevenue / 12),
      expenses,
      cashFlow: annualRevenue - expenses,
      grossMargin,

      // Professional additions
      netProfit: faker.number.int({ min: annualRevenue * 0.05, max: annualRevenue * 0.25 }),
      ebitda: faker.number.int({ min: annualRevenue * 0.1, max: annualRevenue * 0.3 }),
      burnRate: faker.number.int({ min: 10000, max: 500000 }),
      runwayMonths: faker.number.int({ min: 6, max: 60 }),
      debtToEquityRatio: faker.number.float({ min: 0, max: 3, fractionDigits: 2 }),
      currentRatio: faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 }),
      quickRatio: faker.number.float({ min: 0.3, max: 3, fractionDigits: 2 }),
      inventoryTurnover: faker.number.float({ min: 2, max: 20, fractionDigits: 1 }),
      receivablesTurnover: faker.number.float({ min: 4, max: 15, fractionDigits: 1 }),
      workingCapital: faker.number.int({ min: -500000, max: 2000000 })
    }
  }

  // Customer Analytics Generator
  generateCustomerAnalytics(): CustomerAnalytics {
    return {
      customerAcquisitionCost: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
      customerLifetimeValue: faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }),
      churnRate: faker.number.float({ min: 0.5, max: 25, fractionDigits: 1 }),
      netPromoterScore: faker.number.int({ min: -100, max: 100 }),
      monthlyActiveUsers: faker.number.int({ min: 100, max: 100000 }),
      conversionRate: faker.number.float({ min: 0.5, max: 15, fractionDigits: 1 }),
      averageOrderValue: faker.number.float({ min: 25, max: 1000, fractionDigits: 2 }),
      repeatCustomerRate: faker.number.float({ min: 10, max: 80, fractionDigits: 1 })
    }
  }

  // Operational Efficiency Generator
  generateOperationalEfficiency(): OperationalEfficiency {
    return {
      employeeProductivity: faker.number.int({ min: 30000, max: 150000 }),
      operatingExpenseRatio: faker.number.float({ min: 20, max: 95, fractionDigits: 1 }),
      capacityUtilization: faker.number.float({ min: 40, max: 100, fractionDigits: 1 }),
      inventoryDaysOnHand: faker.number.int({ min: 15, max: 120 }),
      paymentTermsDays: faker.number.int({ min: 15, max: 90 }),
      vendorPaymentDays: faker.number.int({ min: 30, max: 120 }),
      cashConversionCycle: faker.number.int({ min: -30, max: 90 })
    }
  }

  // Market Intelligence Generator
  generateMarketIntelligence(): MarketIntelligence {
    const competitorCount = faker.number.int({ min: 1, max: 5 })
    const trendCount = faker.number.int({ min: 1, max: 8 })

    return {
      marketShare: faker.number.float({ min: 0.1, max: 50, fractionDigits: 1 }),
      marketGrowthRate: faker.number.float({ min: -10, max: 30, fractionDigits: 1 }),
      competitorAnalysis: Array.from({ length: competitorCount }, () => ({
        name: faker.company.name(),
        marketShare: faker.number.float({ min: 1, max: 40, fractionDigits: 1 }),
        strengths: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
          faker.helpers.arrayElement([
            'Strong brand recognition',
            'Wide distribution network',
            'Competitive pricing',
            'Product innovation',
            'Customer service excellence',
            'Market leadership',
            'Technology advantage',
            'Cost efficiency'
          ])
        ),
        weaknesses: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
          faker.helpers.arrayElement([
            'High pricing',
            'Limited market presence',
            'Outdated technology',
            'Poor customer service',
            'Quality issues',
            'Slow innovation',
            'Weak online presence',
            'Limited product range'
          ])
        )
      })),
      marketTrends: Array.from({ length: trendCount }, () =>
        faker.helpers.arrayElement([
          'Digital transformation',
          'Sustainability focus',
          'Remote work adoption',
          'AI integration',
          'Data privacy regulations',
          'Subscription economy',
          'Mobile-first approach',
          'Personalization demand'
        ])
      ),
      threatLevel: faker.helpers.arrayElement(['low', 'medium', 'high']),
      opportunityScore: faker.number.int({ min: 10, max: 100 })
    }
  }

  // Financial Planning Generator
  generateFinancialPlanning(): FinancialPlanning {
    const baseRevenue = faker.number.int({ min: 50000, max: 500000 })
    const growthRate = faker.number.float({ min: 0.95, max: 1.15, fractionDigits: 3 })

    return {
      revenueForecast12Month: Array.from({ length: 12 }, (_, i) =>
        Math.floor(baseRevenue * Math.pow(growthRate, i))
      ),
      expenseForecast12Month: Array.from({ length: 12 }, (_, i) =>
        Math.floor(baseRevenue * Math.pow(growthRate, i) * faker.number.float({ min: 0.6, max: 0.9 }))
      ),
      cashFlowForecast12Month: Array.from({ length: 12 }, (_, i) => {
        const revenue = baseRevenue * Math.pow(growthRate, i)
        const expenses = revenue * faker.number.float({ min: 0.6, max: 0.9 })
        return Math.floor(revenue - expenses)
      }),
      scenarioAnalysis: {
        optimistic: {
          revenue: faker.number.int({ min: baseRevenue * 12 * 1.2, max: baseRevenue * 12 * 1.8 }),
          expenses: faker.number.int({ min: baseRevenue * 12 * 0.5, max: baseRevenue * 12 * 0.7 })
        },
        realistic: {
          revenue: faker.number.int({ min: baseRevenue * 12 * 1.0, max: baseRevenue * 12 * 1.2 }),
          expenses: faker.number.int({ min: baseRevenue * 12 * 0.6, max: baseRevenue * 12 * 0.8 })
        },
        pessimistic: {
          revenue: faker.number.int({ min: baseRevenue * 12 * 0.7, max: baseRevenue * 12 * 1.0 }),
          expenses: faker.number.int({ min: baseRevenue * 12 * 0.7, max: baseRevenue * 12 * 0.9 })
        }
      },
      budgetVariance: faker.number.float({ min: -25, max: 25, fractionDigits: 1 })
    }
  }

  // Compliance Generator
  generateCompliance(): Compliance {
    const regulationCount = faker.number.int({ min: 1, max: 4 })
    const insuranceCount = faker.number.int({ min: 1, max: 3 })
    const auditCount = faker.number.int({ min: 1, max: 10 })

    return {
      regulatoryCompliance: Array.from({ length: regulationCount }, () => ({
        regulation: faker.helpers.arrayElement([
          'SOX', 'GDPR', 'HIPAA', 'PCI DSS', 'ISO 27001', 'FDA', 'OSHA', 'CCPA'
        ]),
        status: faker.helpers.arrayElement(['compliant', 'non-compliant', 'pending']),
        lastAuditDate: faker.date.past({ years: 2 }),
        nextAuditDate: faker.date.future({ years: 1 })
      })),
      riskAssessment: {
        financialRisk: faker.helpers.arrayElement(['low', 'medium', 'high']),
        operationalRisk: faker.helpers.arrayElement(['low', 'medium', 'high']),
        marketRisk: faker.helpers.arrayElement(['low', 'medium', 'high']),
        overallRiskScore: faker.number.int({ min: 15, max: 95 })
      },
      insuranceCoverage: Array.from({ length: insuranceCount }, () => ({
        type: faker.helpers.arrayElement([
          'General Liability',
          'Professional Liability',
          'Cyber Liability',
          'Directors & Officers',
          'Workers Compensation'
        ]),
        coverage: faker.number.int({ min: 100000, max: 10000000 }),
        premium: faker.number.int({ min: 1000, max: 50000 }),
        expires: faker.date.future({ years: 1 })
      })),
      auditTrail: Array.from({ length: auditCount }, () => ({
        date: faker.date.past({ years: 1 }),
        action: faker.helpers.arrayElement([
          'Risk assessment updated',
          'Compliance status changed',
          'Insurance policy renewed',
          'Audit completed',
          'Regulation review conducted',
          'Policy violation reported',
          'Training completed',
          'Security incident logged'
        ]),
        user: faker.internet.email(),
        details: faker.lorem.sentence()
      }))
    }
  }

  // Complete Professional Tier Data Generator
  generateProfessionalTierData(): ProfessionalTierData {
    return {
      financialMetrics: this.generateProfessionalFinancialMetrics(),
      customerAnalytics: this.generateCustomerAnalytics(),
      operationalEfficiency: this.generateOperationalEfficiency(),
      marketIntelligence: this.generateMarketIntelligence(),
      financialPlanning: this.generateFinancialPlanning(),
      compliance: this.generateCompliance()
    }
  }

  // Professional Business Data Generator
  generateProfessionalBusinessData(): ProfessionalBusinessData {
    const annualRevenue = faker.number.int({ min: 100000, max: 50000000 })
    const expenses = faker.number.int({ min: annualRevenue * 0.5, max: annualRevenue * 0.9 })

    return {
      // Basic tier fields
      businessType: faker.helpers.arrayElement(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']),
      industryFocus: faker.helpers.arrayElement([
        'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
        'Education', 'Real Estate', 'Consulting'
      ]),
      yearsInBusiness: faker.number.int({ min: 0, max: 50 }),
      businessModel: faker.helpers.arrayElement(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS']),
      revenueModel: faker.helpers.arrayElement([
        'Subscription', 'One-time sales', 'Commission', 'Advertising', 'Freemium'
      ]),

      // Financial data
      annualRevenue,
      monthlyRecurring: faker.number.int({ min: 0, max: annualRevenue / 12 }),
      expenses,
      cashFlow: annualRevenue - expenses,
      grossMargin: faker.number.float({ min: 10, max: 80, fractionDigits: 1 }),

      // Operational data
      customerCount: faker.number.int({ min: 10, max: 10000 }),
      employeeCount: faker.number.int({ min: 1, max: 1000 }),
      marketPosition: faker.helpers.arrayElement(['Startup', 'Emerging', 'Growing', 'Established', 'Market Leader']),
      competitiveAdvantages: Array.from({
        length: faker.number.int({ min: 1, max: 5 })
      }, () => faker.helpers.arrayElement([
        'Product quality', 'Customer service', 'Innovation', 'Cost efficiency',
        'Brand recognition', 'Market expertise', 'Technology', 'Location'
      ])),
      primaryChannels: Array.from({
        length: faker.number.int({ min: 1, max: 4 })
      }, () => faker.helpers.arrayElement([
        'Online', 'Direct sales', 'Retail stores', 'Distributors', 'Partners'
      ])),
      assets: faker.number.int({ min: 50000, max: 10000000 }),
      liabilities: faker.number.int({ min: 0, max: 5000000 }),

      // Professional tier data
      professionalTierData: this.generateProfessionalTierData()
    }
  }

  // Professional Evaluation Generator
  generateProfessionalEvaluation(): ProfessionalEvaluation {
    const businessData = this.generateProfessionalBusinessData()
    const assetBased = faker.number.int({ min: 100000, max: 10000000 })
    const incomeBased = faker.number.int({ min: 200000, max: 15000000 })
    const marketBased = faker.number.int({ min: 150000, max: 12000000 })

    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      businessData,
      valuations: {
        assetBased,
        incomeBased,
        marketBased,
        weighted: Math.floor((assetBased + incomeBased + marketBased) / 3),
        methodology: 'Weighted average of asset-based, income-based, and market-based approaches',
        discountedCashFlow: faker.number.int({ min: incomeBased * 0.8, max: incomeBased * 1.2 }),
        comparableCompany: faker.number.int({ min: marketBased * 0.9, max: marketBased * 1.1 }),
        precedentTransaction: faker.number.int({ min: marketBased * 0.85, max: marketBased * 1.15 })
      },
      healthScore: faker.number.int({ min: 30, max: 100 }),
      confidenceScore: faker.number.int({ min: 60, max: 95 }),
      opportunities: this.generateOpportunities(),
      status: faker.helpers.arrayElement(['processing', 'completed', 'failed']),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
      tier: 'professional',
      advancedAnalytics: {
        benchmarkComparison: {
          industryAverage: this.generateBenchmarkData(),
          topQuartile: this.generateBenchmarkData(1.5),
          bottomQuartile: this.generateBenchmarkData(0.5)
        },
        predictiveModeling: {
          growthPrediction: faker.number.float({ min: -0.1, max: 0.3, fractionDigits: 3 }),
          riskPrediction: faker.number.float({ min: 0.1, max: 0.8, fractionDigits: 3 }),
          valuationTrend: Array.from({ length: 12 }, () =>
            faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 3 })
          )
        },
        sensitivityAnalysis: {
          revenue: Array.from({ length: 5 }, () =>
            faker.number.float({ min: -0.2, max: 0.2, fractionDigits: 3 })
          ),
          costs: Array.from({ length: 5 }, () =>
            faker.number.float({ min: -0.15, max: 0.15, fractionDigits: 3 })
          ),
          market: Array.from({ length: 5 }, () =>
            faker.number.float({ min: -0.1, max: 0.1, fractionDigits: 3 })
          )
        }
      }
    }
  }

  // Generate opportunities for evaluation
  private generateOpportunities() {
    const opportunityCount = faker.number.int({ min: 3, max: 8 })

    return Array.from({ length: opportunityCount }, () => ({
      id: faker.string.uuid(),
      category: faker.helpers.arrayElement(['operational', 'financial', 'strategic', 'market']),
      title: faker.helpers.arrayElement([
        'Optimize inventory management',
        'Improve customer retention',
        'Expand market reach',
        'Streamline operations',
        'Enhance digital presence',
        'Reduce operational costs',
        'Increase pricing strategy',
        'Develop new revenue streams'
      ]),
      description: faker.lorem.sentences(2),
      impactEstimate: {
        dollarAmount: faker.number.int({ min: 10000, max: 500000 }),
        percentageIncrease: faker.number.float({ min: 2, max: 25, fractionDigits: 1 }),
        confidence: faker.number.int({ min: 60, max: 95 })
      },
      difficulty: faker.helpers.arrayElement(['low', 'medium', 'high']),
      timeframe: faker.helpers.arrayElement([
        '1-3 months', '3-6 months', '6-12 months', '12+ months'
      ]),
      priority: faker.number.int({ min: 1, max: 10 }),
      implementationGuide: faker.lorem.paragraph(),
      requiredResources: Array.from({
        length: faker.number.int({ min: 2, max: 5 })
      }, () => faker.helpers.arrayElement([
        'Staff training', 'Software implementation', 'Capital investment',
        'Process redesign', 'External consulting', 'Technology upgrade'
      ]))
    }))
  }

  // Generate benchmark data
  private generateBenchmarkData(multiplier: number = 1) {
    return {
      revenue: faker.number.int({ min: 100000 * multiplier, max: 5000000 * multiplier }),
      profit: faker.number.int({ min: 10000 * multiplier, max: 500000 * multiplier }),
      employees: faker.number.int({ min: 5 * multiplier, max: 200 * multiplier }),
      customerCount: faker.number.int({ min: 50 * multiplier, max: 5000 * multiplier })
    }
  }

  // Legacy basic tier data for backward compatibility testing
  generateLegacyBasicTierData() {
    return {
      businessData: {
        businessType: faker.helpers.arrayElement(['LLC', 'Corporation', 'Partnership']),
        industryFocus: faker.helpers.arrayElement(['Technology', 'Retail', 'Services']),
        yearsInBusiness: faker.number.int({ min: 1, max: 20 }),
        businessModel: faker.helpers.arrayElement(['B2B', 'B2C', 'B2B2C']),
        revenueModel: faker.helpers.arrayElement(['Subscription', 'One-time sales', 'Commission']),
        annualRevenue: faker.number.int({ min: 50000, max: 2000000 }),
        monthlyRecurring: faker.number.int({ min: 0, max: 100000 }),
        expenses: faker.number.int({ min: 30000, max: 1500000 }),
        cashFlow: faker.number.int({ min: -50000, max: 500000 }),
        grossMargin: faker.number.float({ min: 15, max: 70, fractionDigits: 1 }),
        customerCount: faker.number.int({ min: 10, max: 1000 }),
        employeeCount: faker.number.int({ min: 1, max: 50 }),
        marketPosition: faker.helpers.arrayElement(['Startup', 'Growing', 'Established']),
        competitiveAdvantages: ['Quality products', 'Customer service'],
        primaryChannels: ['Online', 'Direct sales'],
        assets: faker.number.int({ min: 25000, max: 1000000 }),
        liabilities: faker.number.int({ min: 0, max: 500000 })
      },
      basicEvaluation: {
        basicMetrics: {
          revenue: faker.number.int({ min: 50000, max: 2000000 }),
          expenses: faker.number.int({ min: 30000, max: 1500000 }),
          profit: faker.number.int({ min: -20000, max: 500000 }),
          employees: faker.number.int({ min: 1, max: 50 }),
          customers: faker.number.int({ min: 10, max: 1000 })
        }
      }
    }
  }

  // Modern basic tier data for compatibility testing
  generateModernBasicTierData() {
    const legacyData = this.generateLegacyBasicTierData()
    return {
      ...legacyData.businessData,
      // Add optional professional fields as undefined
      professionalTierData: undefined
    }
  }

  // Large dataset for performance testing
  generateProfessionalTierDataLarge(): ProfessionalTierData {
    const data = this.generateProfessionalTierData()

    // Expand arrays for larger data
    data.marketIntelligence.competitorAnalysis = Array.from({ length: 20 }, () => ({
      name: faker.company.name(),
      marketShare: faker.number.float({ min: 0.1, max: 15, fractionDigits: 2 }),
      strengths: Array.from({ length: 8 }, () => faker.lorem.words(3)),
      weaknesses: Array.from({ length: 8 }, () => faker.lorem.words(3))
    }))

    data.marketIntelligence.marketTrends = Array.from({ length: 50 }, () =>
      faker.lorem.words(faker.number.int({ min: 2, max: 6 }))
    )

    data.compliance.auditTrail = Array.from({ length: 100 }, () => ({
      date: faker.date.past({ years: 2 }),
      action: faker.lorem.sentence(),
      user: faker.internet.email(),
      details: faker.lorem.paragraph()
    }))

    return data
  }

  // Batch generation methods
  professionalTierData(count: number): ProfessionalTierData[] {
    return Array.from({ length: count }, () => this.generateProfessionalTierData())
  }

  professionalEvaluations(count: number): ProfessionalEvaluation[] {
    return Array.from({ length: count }, () => this.generateProfessionalEvaluation())
  }

  professionalBusinessData(count: number): ProfessionalBusinessData[] {
    return Array.from({ length: count }, () => this.generateProfessionalBusinessData())
  }

  // Single instance exports
  professionalTierData1 = () => this.generateProfessionalTierData()
  professionalEvaluation = () => this.generateProfessionalEvaluation()
  professionalBusinessData1 = () => this.generateProfessionalBusinessData()
  professionalTierDataLarge = () => this.generateProfessionalTierDataLarge()
  legacyBasicTierData = () => this.generateLegacyBasicTierData()
  modernBasicTierData = () => this.generateModernBasicTierData()
}

// Export singleton instance
export const generateTestData = TestDataGenerator.getInstance()

// Export class for custom instances
export { TestDataGenerator }

// Export default for easy importing
export default generateTestData