import { POST } from '@/app/api/opportunities/identify/route';
import { NextRequest } from 'next/server';

// Mock the services
jest.mock('@/lib/services/opportunity-service');
jest.mock('@/lib/services/impact-service');
jest.mock('@/lib/services/priority-service');

describe('/api/opportunities/identify', () => {
  const mockBusinessMetrics = {
    revenue: 1000000,
    expenses: 800000,
    profit: 200000,
    profitMargin: 0.2,
    employeeCount: 50,
    customerCount: 1000,
    marketShare: 0.05
  };

  const mockRequestBody = {
    evaluationId: 'eval_123',
    businessMetrics: mockBusinessMetrics,
    industryData: { industry: 'Technology' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid businessMetrics', async () => {
      const invalidRequest = {
        evaluationId: 'eval_123',
        businessMetrics: {
          revenue: 'invalid', // Should be number
          expenses: 800000
        }
      };

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid businessMetrics structure');
    });

    it('should return 400 for incomplete businessMetrics', async () => {
      const incompleteRequest = {
        evaluationId: 'eval_123',
        businessMetrics: {
          revenue: 1000000,
          expenses: 800000
          // Missing required fields: profit, profitMargin, employeeCount, customerCount
        }
      };

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteRequest)
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid businessMetrics structure');
    });

    it('should successfully process valid request', async () => {
      // Mock the service responses
      const mockOpportunityService = require('@/lib/services/opportunity-service').OpportunityService;
      const mockImpactService = require('@/lib/services/impact-service').ImpactService;
      const mockPriorityService = require('@/lib/services/priority-service').PriorityService;

      const mockComprehensiveAnalysis = {
        evaluationId: 'eval_123',
        opportunities: [
          {
            id: 'opp_1',
            title: 'Test Opportunity',
            category: 'financial',
            impactEstimate: {
              revenueIncrease: { amount: 50000 },
              costReduction: { amount: 30000 }
            }
          }
        ],
        topRecommendations: [
          {
            id: 'opp_1',
            title: 'Test Opportunity',
            category: 'financial',
            impactEstimate: {
              revenueIncrease: { amount: 50000 },
              costReduction: { amount: 30000 }
            }
          }
        ],
        totalPotentialValue: 80000,
        confidence: 0.8,
        categorySummary: {
          financial: { overallScore: 0.9 },
          operational: { overallScore: 0.7 },
          marketing: { overallScore: 0.6 },
          strategic: { overallScore: 0.5 }
        },
        methodology: 'Test methodology'
      };

      const mockImpactAnalyses = [
        {
          opportunityId: 'opp_1',
          roiAnalysis: { roi: 25 },
          confidenceLevel: 0.8
        }
      ];

      const mockPriorityAnalysis = {
        matrix: {
          id: 'matrix_1',
          opportunities: []
        },
        recommendations: ['Focus on high-impact opportunities'],
        sequence: [
          {
            phase: 1,
            opportunities: ['opp_1'],
            duration: '3-6 months',
            expectedValue: 80000
          }
        ]
      };

      mockOpportunityService.prototype.identifyOpportunities.mockResolvedValue(mockComprehensiveAnalysis);
      mockImpactService.prototype.performComprehensiveImpactAnalysis.mockResolvedValue(mockImpactAnalyses[0]);
      mockPriorityService.prototype.calculatePriorityMatrix.mockResolvedValue(mockPriorityAnalysis);

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequestBody)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('evaluationId', 'eval_123');
      expect(data).toHaveProperty('analysis');
      expect(data).toHaveProperty('impactAnalyses');
      expect(data).toHaveProperty('priorityMatrix');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('metadata');

      // Verify summary structure
      expect(data.summary).toHaveProperty('totalOpportunities');
      expect(data.summary).toHaveProperty('totalPotentialValue');
      expect(data.summary).toHaveProperty('overallConfidence');
      expect(data.summary).toHaveProperty('topCategories');
      expect(data.summary).toHaveProperty('implementationSequence');

      expect(data.summary.topCategories).toEqual(['financial', 'operational', 'marketing']);
    });

    it('should handle service errors gracefully', async () => {
      const mockOpportunityService = require('@/lib/services/opportunity-service').OpportunityService;
      mockOpportunityService.prototype.identifyOpportunities.mockRejectedValue(
        new Error('Service error')
      );

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequestBody)
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('Internal server error');
      expect(data.details).toBe('Service error');
    });

    it('should handle invalid JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('Internal server error');
    });

    it('should process optional industryData', async () => {
      const mockOpportunityService = require('@/lib/services/opportunity-service').OpportunityService;
      const mockImpactService = require('@/lib/services/impact-service').ImpactService;
      const mockPriorityService = require('@/lib/services/priority-service').PriorityService;

      const mockAnalysis = {
        evaluationId: 'eval_123',
        opportunities: [],
        topRecommendations: [],
        totalPotentialValue: 0,
        confidence: 0.8,
        categorySummary: {},
        methodology: 'Test'
      };

      mockOpportunityService.prototype.identifyOpportunities.mockResolvedValue(mockAnalysis);
      mockImpactService.prototype.performComprehensiveImpactAnalysis.mockResolvedValue({});
      mockPriorityService.prototype.calculatePriorityMatrix.mockResolvedValue({
        matrix: { id: 'test' },
        recommendations: [],
        sequence: []
      });

      const requestWithoutIndustryData = {
        evaluationId: 'eval_123',
        businessMetrics: mockBusinessMetrics
        // No industryData
      };

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithoutIndustryData)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify that services were called with undefined industryData
      expect(mockOpportunityService.prototype.identifyOpportunities).toHaveBeenCalledWith(
        'eval_123',
        mockBusinessMetrics,
        undefined
      );
    });
  });

  describe('business metrics validation', () => {
    it('should accept valid business metrics with all required fields', async () => {
      const mockOpportunityService = require('@/lib/services/opportunity-service').OpportunityService;
      const mockImpactService = require('@/lib/services/impact-service').ImpactService;
      const mockPriorityService = require('@/lib/services/priority-service').PriorityService;

      mockOpportunityService.prototype.identifyOpportunities.mockResolvedValue({
        evaluationId: 'eval_123',
        opportunities: [],
        topRecommendations: [],
        totalPotentialValue: 0,
        confidence: 0.8,
        categorySummary: {},
        methodology: 'Test'
      });
      mockImpactService.prototype.performComprehensiveImpactAnalysis.mockResolvedValue({});
      mockPriorityService.prototype.calculatePriorityMatrix.mockResolvedValue({
        matrix: { id: 'test' },
        recommendations: [],
        sequence: []
      });

      const validMetrics = {
        revenue: 1000000,
        expenses: 800000,
        profit: 200000,
        profitMargin: 0.2,
        employeeCount: 50,
        customerCount: 1000,
        marketShare: 0.05
      };

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: 'eval_123',
          businessMetrics: validMetrics
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should accept business metrics without optional marketShare', async () => {
      const mockOpportunityService = require('@/lib/services/opportunity-service').OpportunityService;
      const mockImpactService = require('@/lib/services/impact-service').ImpactService;
      const mockPriorityService = require('@/lib/services/priority-service').PriorityService;

      mockOpportunityService.prototype.identifyOpportunities.mockResolvedValue({
        evaluationId: 'eval_123',
        opportunities: [],
        topRecommendations: [],
        totalPotentialValue: 0,
        confidence: 0.8,
        categorySummary: {},
        methodology: 'Test'
      });
      mockImpactService.prototype.performComprehensiveImpactAnalysis.mockResolvedValue({});
      mockPriorityService.prototype.calculatePriorityMatrix.mockResolvedValue({
        matrix: { id: 'test' },
        recommendations: [],
        sequence: []
      });

      const metricsWithoutMarketShare = {
        revenue: 1000000,
        expenses: 800000,
        profit: 200000,
        profitMargin: 0.2,
        employeeCount: 50,
        customerCount: 1000
      };

      const request = new NextRequest('http://localhost:3000/api/opportunities/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: 'eval_123',
          businessMetrics: metricsWithoutMarketShare
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });
});