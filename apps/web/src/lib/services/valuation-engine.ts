import { WeightedValuationEngine } from '@/lib/algorithms/weighted-valuation';
import { BusinessEvaluation } from '@/types/valuation';

export interface ValuationRequest {
  userId: string;
  businessData: {
    annualRevenue: number;
    monthlyRecurring: number;
    expenses: number;
    cashFlow: number;
    assets: {
      tangible: number;
      intangible: number;
      inventory: number;
      equipment: number;
      realEstate: number;
    };
    liabilities: {
      shortTerm: number;
      longTerm: number;
      contingent: number;
    };
    customerCount: number;
    marketPosition: string;
    industry: string;
    businessAge: number;
    growthRate: number;
  };
}

export interface ValuationResponse {
  success: boolean;
  data?: BusinessEvaluation;
  error?: string;
  processingTime: number;
}

export class ValuationEngineService {
  private weightedEngine = new WeightedValuationEngine();
  private cache = new Map<string, { result: BusinessEvaluation; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds

  async performValuation(request: ValuationRequest): Promise<ValuationResponse> {
    const startTime = Date.now();
    
    try {
      // Generate cache key based on business data
      const cacheKey = this.generateCacheKey(request.businessData);
      
      // Check cache first
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          processingTime: Date.now() - startTime,
        };
      }

      // Validate input data
      const validation = this.validateBusinessData(request.businessData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid business data: ${validation.errors.join(', ')}`,
          processingTime: Date.now() - startTime,
        };
      }

      // Perform the valuation
      const evaluation = await this.weightedEngine.calculateWeightedValuation(
        request.businessData,
        request.userId
      );

      // Cache the result
      this.cacheResult(cacheKey, evaluation);

      return {
        success: true,
        data: evaluation,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Valuation engine error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown valuation error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private generateCacheKey(businessData: any): string {
    // Create a stable hash of the business data for caching
    const keyData = {
      revenue: businessData.annualRevenue,
      cashFlow: businessData.cashFlow,
      industry: businessData.industry,
      assets: Object.values(businessData.assets).reduce((sum: number, val: any) => sum + val, 0),
      liabilities: Object.values(businessData.liabilities).reduce((sum: number, val: any) => sum + val, 0),
      customers: businessData.customerCount,
      age: businessData.businessAge,
      growth: businessData.growthRate,
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  private getCachedResult(cacheKey: string): BusinessEvaluation | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.result;
  }

  private cacheResult(cacheKey: string, result: BusinessEvaluation): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
    
    // Clean up old cache entries (simple LRU)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  private validateBusinessData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required numeric fields
    const requiredNumbers = [
      'annualRevenue', 'monthlyRecurring', 'expenses', 'cashFlow', 
      'customerCount', 'businessAge', 'growthRate'
    ];
    
    for (const field of requiredNumbers) {
      if (typeof data[field] !== 'number' || isNaN(data[field])) {
        errors.push(`${field} must be a valid number`);
      }
    }
    
    // Required string fields
    const requiredStrings = ['industry', 'marketPosition'];
    for (const field of requiredStrings) {
      if (!data[field] || typeof data[field] !== 'string') {
        errors.push(`${field} is required and must be a string`);
      }
    }
    
    // Assets validation
    if (!data.assets || typeof data.assets !== 'object') {
      errors.push('Assets data is required');
    } else {
      const assetFields = ['tangible', 'intangible', 'inventory', 'equipment', 'realEstate'];
      for (const field of assetFields) {
        if (typeof data.assets[field] !== 'number' || isNaN(data.assets[field])) {
          errors.push(`assets.${field} must be a valid number`);
        }
      }
    }
    
    // Liabilities validation
    if (!data.liabilities || typeof data.liabilities !== 'object') {
      errors.push('Liabilities data is required');
    } else {
      const liabilityFields = ['shortTerm', 'longTerm', 'contingent'];
      for (const field of liabilityFields) {
        if (typeof data.liabilities[field] !== 'number' || isNaN(data.liabilities[field])) {
          errors.push(`liabilities.${field} must be a valid number`);
        }
      }
    }
    
    // Business logic validations
    if (data.annualRevenue < 0) {
      errors.push('Annual revenue cannot be negative');
    }
    
    if (data.businessAge < 0 || data.businessAge > 100) {
      errors.push('Business age must be between 0 and 100 years');
    }
    
    if (data.customerCount < 0) {
      errors.push('Customer count cannot be negative');
    }
    
    if (data.growthRate < -1 || data.growthRate > 10) {
      errors.push('Growth rate must be between -100% and 1000%');
    }
    
    // Asset/Liability consistency
    const totalAssets = Object.values(data.assets || {}).reduce((sum: number, val) => sum + (val as number), 0);
    const totalLiabilities = Object.values(data.liabilities || {}).reduce((sum: number, val) => sum + (val as number), 0);
    
    if (totalAssets < 0) {
      errors.push('Total assets cannot be negative');
    }
    
    if (totalLiabilities < 0) {
      errors.push('Total liabilities cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    avgProcessingTime: number;
  } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to track hits/misses for real implementation
      avgProcessingTime: 0, // Would need to track processing times
    };
  }

  // Clean up cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get detailed breakdown for a specific valuation
  async getValuationBreakdown(evaluationId: string): Promise<{
    methodologyComparison: {
      asset: { value: number; weight: number; confidence: number };
      income: { value: number; weight: number; confidence: number };
      market: { value: number; weight: number; confidence: number };
    };
    sensitivityAnalysis: {
      scenario: string;
      value: number;
      change: number;
    }[];
  }> {
    // This would typically fetch from database in real implementation
    // For now, return placeholder structure
    return {
      methodologyComparison: {
        asset: { value: 0, weight: 0, confidence: 0 },
        income: { value: 0, weight: 0, confidence: 0 },
        market: { value: 0, weight: 0, confidence: 0 },
      },
      sensitivityAnalysis: [
        { scenario: 'Conservative', value: 0, change: -0.2 },
        { scenario: 'Base Case', value: 0, change: 0 },
        { scenario: 'Optimistic', value: 0, change: 0.2 },
      ],
    };
  }
}

// Export singleton instance
export const valuationEngine = new ValuationEngineService();