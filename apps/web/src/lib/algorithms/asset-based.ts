import { AssetBasedValuation, IndustryAdjustment } from '@/types/valuation';

interface BusinessAssets {
  tangible: number;
  intangible: number;
  inventory: number;
  equipment: number;
  realEstate: number;
}

interface BusinessLiabilities {
  shortTerm: number;
  longTerm: number;
  contingent: number;
}

interface AssetValuationParams {
  assets: BusinessAssets;
  liabilities: BusinessLiabilities;
  industry: string;
  businessAge: number;
  marketConditions: number;
}

export class AssetBasedValuationEngine {
  private industryAdjustments: Map<string, number> = new Map([
    ['technology', 0.85], // Tech assets depreciate faster
    ['manufacturing', 1.15], // Manufacturing assets hold value better
    ['retail', 0.95], // Inventory can be volatile
    ['services', 0.75], // Service businesses have fewer tangible assets
    ['real_estate', 1.25], // Real estate typically appreciates
    ['healthcare', 1.05], // Healthcare equipment holds value
    ['finance', 0.80], // Financial services have fewer physical assets
  ]);

  private marketAdjustmentFactors = {
    excellent: 1.15,
    good: 1.05,
    average: 1.0,
    poor: 0.85,
    crisis: 0.70,
  };

  calculateAssetBasedValuation(params: AssetValuationParams): AssetBasedValuation {
    const { assets, liabilities, industry, businessAge, marketConditions } = params;
    
    // Calculate depreciation factors based on business age
    const depreciationFactor = this.calculateDepreciationFactor(businessAge);
    
    // Apply depreciation to depreciable assets
    const depreciatedTangible = assets.tangible * depreciationFactor;
    const depreciatedEquipment = assets.equipment * depreciationFactor;
    
    // Intangible assets and inventory don't depreciate the same way
    const adjustedIntangible = assets.intangible * this.getIntangibleAdjustment(industry);
    const adjustedInventory = assets.inventory * this.getInventoryAdjustment(industry);
    
    // Real estate typically appreciates or holds value
    const adjustedRealEstate = assets.realEstate * this.getRealEstateAdjustment(businessAge);
    
    // Calculate total adjusted assets
    const totalAdjustedAssets = 
      depreciatedTangible + 
      adjustedIntangible + 
      adjustedInventory + 
      depreciatedEquipment + 
      adjustedRealEstate;
    
    // Calculate total liabilities
    const totalLiabilities = liabilities.shortTerm + liabilities.longTerm + liabilities.contingent;
    
    // Net book value
    const netBookValue = totalAdjustedAssets - totalLiabilities;
    
    // Apply industry-specific adjustments
    const industryAdjustment = this.industryAdjustments.get(industry.toLowerCase()) || 1.0;
    
    // Apply market condition adjustments
    const marketAdjustment = this.getMarketAdjustment(marketConditions);
    
    // Calculate final market-adjusted value
    const marketAdjustments = (industryAdjustment - 1.0 + marketAdjustment - 1.0) * netBookValue;
    const finalValue = netBookValue + marketAdjustments;
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(params, totalAdjustedAssets, totalLiabilities);
    
    // Generate assumptions and adjustments
    const assumptions = this.generateAssumptions(params, depreciationFactor, industryAdjustment);
    const adjustments = this.generateAdjustments(industry, industryAdjustment, marketAdjustment);
    
    return {
      value: Math.max(0, finalValue), // Ensure non-negative value
      confidence,
      methodology: 'Asset-Based Valuation with Market Adjustments',
      assumptions,
      adjustments,
      breakdown: {
        tangibleAssets: depreciatedTangible,
        intangibleAssets: adjustedIntangible,
        inventory: adjustedInventory,
        equipment: depreciatedEquipment,
        realEstate: adjustedRealEstate,
        totalAssets: totalAdjustedAssets,
        totalLiabilities,
        netBookValue,
        marketAdjustments,
      },
    };
  }

  private calculateDepreciationFactor(businessAge: number): number {
    // Depreciation curve: newer businesses have less depreciation
    if (businessAge <= 1) return 0.95;
    if (businessAge <= 3) return 0.85;
    if (businessAge <= 5) return 0.75;
    if (businessAge <= 10) return 0.65;
    return 0.55; // Older businesses have more depreciation
  }

  private getIntangibleAdjustment(industry: string): number {
    const intangibleFactors = {
      technology: 1.2, // Tech IP is valuable
      healthcare: 1.15, // Patents and expertise
      finance: 1.1, // Brand and relationships
      services: 1.05, // Customer relationships
      manufacturing: 0.9, // Less intangible value
      retail: 0.85, // Brand value varies
      real_estate: 0.8, // Primarily tangible assets
    };
    
    return intangibleFactors[industry.toLowerCase() as keyof typeof intangibleFactors] || 1.0;
  }

  private getInventoryAdjustment(industry: string): number {
    const inventoryFactors = {
      retail: 0.8, // Fashion/seasonal risk
      manufacturing: 0.9, // Raw materials risk
      technology: 0.7, // Fast obsolescence
      healthcare: 0.95, // Regulated, stable
      services: 1.0, // Minimal inventory
      finance: 1.0, // No inventory
      real_estate: 1.0, // No inventory
    };
    
    return inventoryFactors[industry.toLowerCase() as keyof typeof inventoryFactors] || 0.85;
  }

  private getRealEstateAdjustment(businessAge: number): number {
    // Real estate typically appreciates over time
    const appreciationRate = 0.03; // 3% annual appreciation
    return 1 + (businessAge * appreciationRate);
  }

  private getMarketAdjustment(marketConditions: number): number {
    // Market conditions: 1-5 scale
    if (marketConditions >= 4.5) return this.marketAdjustmentFactors.excellent;
    if (marketConditions >= 3.5) return this.marketAdjustmentFactors.good;
    if (marketConditions >= 2.5) return this.marketAdjustmentFactors.average;
    if (marketConditions >= 1.5) return this.marketAdjustmentFactors.poor;
    return this.marketAdjustmentFactors.crisis;
  }

  private calculateConfidence(
    params: AssetValuationParams, 
    totalAssets: number, 
    totalLiabilities: number
  ): number {
    let confidence = 0.7; // Base confidence for asset-based approach
    
    // Higher confidence if assets are substantial
    const assetToLiabilityRatio = totalAssets / Math.max(totalLiabilities, 1);
    if (assetToLiabilityRatio > 3) confidence += 0.15;
    else if (assetToLiabilityRatio > 2) confidence += 0.10;
    else if (assetToLiabilityRatio > 1.5) confidence += 0.05;
    
    // Higher confidence for asset-heavy industries
    const assetHeavyIndustries = ['manufacturing', 'real_estate', 'healthcare'];
    if (assetHeavyIndustries.includes(params.industry.toLowerCase())) {
      confidence += 0.10;
    }
    
    // Lower confidence for very young or very old businesses
    if (params.businessAge < 1 || params.businessAge > 20) {
      confidence -= 0.05;
    }
    
    // Adjust for market conditions
    if (params.marketConditions < 2) confidence -= 0.10;
    else if (params.marketConditions > 4) confidence += 0.05;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private generateAssumptions(
    params: AssetValuationParams, 
    depreciationFactor: number, 
    industryAdjustment: number
  ): string[] {
    const assumptions = [
      `Applied ${((1 - depreciationFactor) * 100).toFixed(1)}% depreciation based on ${params.businessAge} years in business`,
      `Industry adjustment factor of ${industryAdjustment.toFixed(2)} applied for ${params.industry} sector`,
    ];
    
    if (params.assets.realEstate > 0) {
      assumptions.push('Real estate values adjusted for appreciation over business lifespan');
    }
    
    if (params.assets.intangible > 0) {
      assumptions.push('Intangible assets valued based on industry-specific factors');
    }
    
    if (params.assets.inventory > 0) {
      assumptions.push('Inventory valued with industry-specific obsolescence risk adjustments');
    }
    
    assumptions.push('Market conditions factored into final valuation adjustment');
    
    return assumptions;
  }

  private generateAdjustments(
    industry: string, 
    industryFactor: number, 
    marketFactor: number
  ): IndustryAdjustment[] {
    const adjustments: IndustryAdjustment[] = [];
    
    if (industryFactor !== 1.0) {
      adjustments.push({
        id: `industry-${industry}-${Date.now()}`,
        industry,
        adjustmentType: industryFactor > 1.0 ? 'premium' : 'discount',
        factor: industryFactor,
        reason: `${industry} industry asset valuation characteristics`,
        confidence: 0.8,
        source: 'Industry Analysis Database',
      });
    }
    
    if (marketFactor !== 1.0) {
      adjustments.push({
        id: `market-conditions-${Date.now()}`,
        industry,
        adjustmentType: marketFactor > 1.0 ? 'premium' : 'discount',
        factor: marketFactor,
        reason: 'Current market conditions impact on asset liquidity',
        confidence: 0.75,
        source: 'Market Conditions Analysis',
      });
    }
    
    return adjustments;
  }
}