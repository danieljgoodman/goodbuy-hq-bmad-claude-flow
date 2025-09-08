import { ROICalculator } from '@/lib/calculators/roi-calculator';
import { ROICalculationInputs } from '@/types/impact-analysis';

describe('ROICalculator', () => {
  const mockROIInputs: ROICalculationInputs = {
    initialInvestment: 100000,
    annualBenefits: [50000, 60000, 70000],
    implementationCosts: [20000, 10000, 0],
    maintenanceCosts: [5000, 5000, 5000],
    discountRate: 0.1,
    timeHorizon: 3,
    riskFactor: 0.2
  };

  describe('calculateROI', () => {
    it('should return valid ROI calculation results', () => {
      const result = ROICalculator.calculateROI(mockROIInputs);

      expect(result).toHaveProperty('npv');
      expect(result).toHaveProperty('irr');
      expect(result).toHaveProperty('paybackPeriod');
      expect(result).toHaveProperty('roi');
      expect(result).toHaveProperty('riskAdjustedROI');
      expect(result).toHaveProperty('breakEvenPoint');
      expect(result).toHaveProperty('totalReturn');
      expect(result).toHaveProperty('confidence');

      expect(typeof result.npv).toBe('number');
      expect(typeof result.irr).toBe('number');
      expect(typeof result.paybackPeriod).toBe('number');
      expect(typeof result.roi).toBe('number');
      expect(typeof result.riskAdjustedROI).toBe('number');
      expect(typeof result.breakEvenPoint).toBe('number');
      expect(typeof result.totalReturn).toBe('number');
      expect(typeof result.confidence).toBe('number');
    });

    it('should calculate positive ROI for profitable investments', () => {
      const result = ROICalculator.calculateROI(mockROIInputs);
      
      expect(result.roi).toBeGreaterThan(0);
      expect(result.npv).toBeGreaterThan(0);
      expect(result.totalReturn).toBeGreaterThan(0);
    });

    it('should calculate negative ROI for unprofitable investments', () => {
      const unprofitableInputs: ROICalculationInputs = {
        ...mockROIInputs,
        annualBenefits: [10000, 10000, 10000], // Much lower benefits
        initialInvestment: 200000 // Much higher investment
      };

      const result = ROICalculator.calculateROI(unprofitableInputs);
      
      expect(result.roi).toBeLessThan(0);
      expect(result.npv).toBeLessThan(0);
      expect(result.totalReturn).toBeLessThan(0);
    });

    it('should apply risk adjustment correctly', () => {
      const lowRiskInputs = { ...mockROIInputs, riskFactor: 0.1 };
      const highRiskInputs = { ...mockROIInputs, riskFactor: 0.4 };

      const lowRiskResult = ROICalculator.calculateROI(lowRiskInputs);
      const highRiskResult = ROICalculator.calculateROI(highRiskInputs);

      expect(lowRiskResult.riskAdjustedROI).toBeGreaterThan(highRiskResult.riskAdjustedROI);
    });

    it('should handle zero discount rate', () => {
      const zeroDiscountInputs = { ...mockROIInputs, discountRate: 0 };
      
      expect(() => ROICalculator.calculateROI(zeroDiscountInputs)).not.toThrow();
      const result = ROICalculator.calculateROI(zeroDiscountInputs);
      expect(result.npv).toBeGreaterThan(0);
    });

    it('should calculate reasonable payback period', () => {
      const result = ROICalculator.calculateROI(mockROIInputs);
      
      expect(result.paybackPeriod).toBeGreaterThan(0);
      expect(result.paybackPeriod).toBeLessThanOrEqual(mockROIInputs.timeHorizon + 1);
    });
  });

  describe('NPV calculation', () => {
    it('should decrease with higher discount rates', () => {
      const lowDiscountInputs = { ...mockROIInputs, discountRate: 0.05 };
      const highDiscountInputs = { ...mockROIInputs, discountRate: 0.20 };

      const lowDiscountResult = ROICalculator.calculateROI(lowDiscountInputs);
      const highDiscountResult = ROICalculator.calculateROI(highDiscountInputs);

      expect(lowDiscountResult.npv).toBeGreaterThan(highDiscountResult.npv);
    });

    it('should handle varying cash flows correctly', () => {
      const frontLoadedInputs = {
        ...mockROIInputs,
        annualBenefits: [100000, 30000, 20000]
      };
      
      const backLoadedInputs = {
        ...mockROIInputs,
        annualBenefits: [20000, 30000, 100000]
      };

      const frontLoadedResult = ROICalculator.calculateROI(frontLoadedInputs);
      const backLoadedResult = ROICalculator.calculateROI(backLoadedInputs);

      // Front-loaded benefits should have higher NPV due to time value of money
      expect(frontLoadedResult.npv).toBeGreaterThan(backLoadedResult.npv);
    });
  });

  describe('IRR calculation', () => {
    it('should return reasonable IRR values', () => {
      const result = ROICalculator.calculateROI(mockROIInputs);
      
      // IRR should be positive for profitable projects
      expect(result.irr).toBeGreaterThan(0);
      // IRR should be reasonable (not extremely high)
      expect(result.irr).toBeLessThan(2); // Less than 200%
    });

    it('should handle edge cases', () => {
      const edgeCaseInputs: ROICalculationInputs = {
        initialInvestment: 1000,
        annualBenefits: [500, 600],
        implementationCosts: [0, 0],
        maintenanceCosts: [0, 0],
        discountRate: 0.1,
        timeHorizon: 2,
        riskFactor: 0.1
      };

      expect(() => ROICalculator.calculateROI(edgeCaseInputs)).not.toThrow();
      const result = ROICalculator.calculateROI(edgeCaseInputs);
      expect(typeof result.irr).toBe('number');
    });
  });

  describe('sensitivity analysis', () => {
    it('should perform sensitivity analysis correctly', () => {
      const sensitivityRanges = {
        annualBenefits: { min: 0.8, max: 1.2 },
        implementationCosts: { min: 0.9, max: 1.3 },
        discountRate: { min: 0.05, max: 0.15 }
      };

      const result = ROICalculator.performSensitivityAnalysis(mockROIInputs, sensitivityRanges);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      
      result.forEach(item => {
        expect(item).toHaveProperty('variable');
        expect(item).toHaveProperty('impactOnROI');
        expect(typeof item.impactOnROI).toBe('number');
      });

      // Should be sorted by impact (highest first)
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].impactOnROI).toBeGreaterThanOrEqual(result[i + 1].impactOnROI);
        }
      }
    });
  });

  describe('Monte Carlo simulation', () => {
    it('should run Monte Carlo simulation successfully', () => {
      const variableRanges = {
        annualBenefits: { min: 0.7, max: 1.3, distribution: 'normal' as const },
        implementationCosts: { min: 0.8, max: 1.2, distribution: 'uniform' as const }
      };

      const result = ROICalculator.runMonteCarloSimulation(mockROIInputs, variableRanges, 100);

      expect(result).toHaveProperty('meanROI');
      expect(result).toHaveProperty('medianROI');
      expect(result).toHaveProperty('standardDeviation');
      expect(result).toHaveProperty('confidenceInterval');
      expect(result).toHaveProperty('probabilityOfPositiveROI');

      expect(typeof result.meanROI).toBe('number');
      expect(typeof result.medianROI).toBe('number');
      expect(typeof result.standardDeviation).toBe('number');
      expect(result.probabilityOfPositiveROI).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfPositiveROI).toBeLessThanOrEqual(1);
      
      expect(result.confidenceInterval).toHaveProperty('lower');
      expect(result.confidenceInterval).toHaveProperty('upper');
      expect(result.confidenceInterval.upper).toBeGreaterThan(result.confidenceInterval.lower);
    });

    it('should handle different probability distributions', () => {
      const uniformRanges = {
        annualBenefits: { min: 0.8, max: 1.2, distribution: 'uniform' as const }
      };

      const normalRanges = {
        annualBenefits: { min: 0.8, max: 1.2, distribution: 'normal' as const }
      };

      expect(() => ROICalculator.runMonteCarloSimulation(mockROIInputs, uniformRanges, 50)).not.toThrow();
      expect(() => ROICalculator.runMonteCarloSimulation(mockROIInputs, normalRanges, 50)).not.toThrow();
    });
  });

  describe('confidence calculation', () => {
    it('should return higher confidence for complete inputs', () => {
      const completeInputs: ROICalculationInputs = {
        ...mockROIInputs,
        annualBenefits: [50000, 60000, 70000, 75000], // More data points
        timeHorizon: 4,
        riskFactor: 0.1 // Lower risk
      };

      const incompleteInputs: ROICalculationInputs = {
        ...mockROIInputs,
        annualBenefits: [50000], // Less data
        timeHorizon: 1,
        riskFactor: 0.4 // Higher risk
      };

      const completeResult = ROICalculator.calculateROI(completeInputs);
      const incompleteResult = ROICalculator.calculateROI(incompleteInputs);

      expect(completeResult.confidence).toBeGreaterThan(incompleteResult.confidence);
    });

    it('should cap confidence at 95%', () => {
      const optimalInputs: ROICalculationInputs = {
        ...mockROIInputs,
        annualBenefits: [50000, 60000, 70000, 80000, 90000],
        timeHorizon: 5,
        riskFactor: 0.05,
        discountRate: 0.08
      };

      const result = ROICalculator.calculateROI(optimalInputs);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});