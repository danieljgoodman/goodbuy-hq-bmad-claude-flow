# Story 9.5: Advanced Business Questionnaire - Brownfield Addition

## User Story

As a **business owner seeking accurate business valuation**,
I want **an comprehensive business questionnaire that collects key financial metrics including EBITDA and industry best practices**,
So that **I receive more precise AI valuations and actionable insights based on complete financial data**.

## Story Context

**Existing System Integration:**

- Integrates with: Current business evaluation form, BusinessEvaluation model, AI valuation engine
- Technology: Next.js forms with Zod validation, Claude AI integration, PostgreSQL data storage
- Follows pattern: Existing evaluation form structure and AI processing workflow
- Touch points: Business data collection, AI valuation processing, financial metrics analysis

## Acceptance Criteria

**Enhanced Financial Data Collection:**

1. Add comprehensive financial metrics section including EBITDA, gross margin, and cash flow details
2. Implement industry-specific financial ratio collection (SaaS: ARR, MRR, churn; E-commerce: inventory turnover, etc.)
3. Add competitive positioning questions (market share, competitive advantages, differentiation factors)
4. Include growth trajectory data (historical growth rates, future projections, expansion plans)
5. Collect operational metrics (customer acquisition costs, lifetime value, employee productivity)

**Data Quality & Validation:**

6. Implement intelligent field validation with industry benchmarks and reasonableness checks
7. Add financial data verification prompts with explanation tooltips for complex metrics
8. Create conditional logic that shows/hides relevant questions based on business type and size
9. Include data confidence scoring to help users understand the impact of incomplete information
10. Add option to upload supporting financial documents for automatic data extraction and validation

**AI Integration Enhancement:**

11. Enhanced questionnaire data improves AI valuation accuracy by providing comprehensive business context
12. New financial metrics integrate with existing Claude AI processing for more sophisticated analysis
13. Industry-specific data enables more accurate benchmarking and competitive analysis

## Technical Notes

- **Integration Approach:** Extend existing BusinessEvaluation model and evaluation form with progressive disclosure
- **Existing Pattern Reference:** Follow current multi-step evaluation form and AI processing patterns
- **Key Constraints:** Must maintain user experience while significantly expanding data collection depth

## Definition of Done

- [x] Comprehensive financial questionnaire implemented with industry best practices
- [x] Enhanced data integrates with existing AI valuation engine for improved accuracy
- [x] Existing evaluation flow continues to work with enhanced data optional
- [x] Code follows existing form validation and AI processing patterns
- [x] Tests pass for new questionnaire logic and AI integration
- [x] Financial metrics validation ensures data quality and user understanding

## Risk and Compatibility Check

**Minimal Risk Assessment:**

- **Primary Risk:** Complex financial questionnaire overwhelms users and reduces completion rates
- **Mitigation:** Progressive disclosure, smart defaults, extensive help text, and optional advanced sections
- **Rollback:** Feature flag to revert to simplified questionnaire, preserve enhanced data for users who provided it

**Compatibility Verification:**

- [x] No breaking changes to existing evaluation API or data models
- [x] Database changes are additive only (enhanced financial fields)
- [x] UI follows existing evaluation form patterns with progressive enhancement
- [x] AI processing maintains current performance with optional enhanced analysis

## Implementation Details

**Enhanced BusinessEvaluation Model:**
```sql
-- Add comprehensive financial metrics
ALTER TABLE business_evaluations ADD COLUMN enhanced_financials JSONB;
ALTER TABLE business_evaluations ADD COLUMN industry_metrics JSONB;
ALTER TABLE business_evaluations ADD COLUMN competitive_data JSONB;
ALTER TABLE business_evaluations ADD COLUMN growth_projections JSONB;
ALTER TABLE business_evaluations ADD COLUMN operational_metrics JSONB;
ALTER TABLE business_evaluations ADD COLUMN data_confidence_score INTEGER;

-- Add questionnaire completion tracking
ALTER TABLE business_evaluations ADD COLUMN questionnaire_version VARCHAR(10) DEFAULT '1.0';
ALTER TABLE business_evaluations ADD COLUMN completion_percentage INTEGER DEFAULT 0;
```

**Financial Metrics Structure:**
```typescript
interface EnhancedFinancials {
  // Core Financial Metrics
  ebitda: number;
  ebitdaMargin: number;
  grossMargin: number;
  operatingMargin: number;
  freeCashFlow: number;
  workingCapital: number;
  
  // Profitability Analysis
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnInvestment: number;
  
  // Growth Metrics
  revenueGrowthRate: number;
  profitGrowthRate: number;
  customerGrowthRate: number;
  
  // Industry-Specific Metrics
  industrySpecific: {
    // SaaS Metrics
    arr?: number;
    mrr?: number;
    churnRate?: number;
    cac?: number;
    ltv?: number;
    
    // E-commerce Metrics
    inventoryTurnover?: number;
    averageOrderValue?: number;
    conversionRate?: number;
    
    // Service Business Metrics
    utilizationRate?: number;
    billableHours?: number;
    clientRetentionRate?: number;
  };
}
```

**Enhanced Questionnaire Sections:**

**Section 1: Financial Foundation**
- Revenue breakdown by source
- EBITDA calculation with guidance
- Cash flow statement summary
- Balance sheet key items

**Section 2: Industry-Specific Metrics**
- Dynamic questions based on industry selection
- SaaS: Subscription metrics and unit economics
- E-commerce: Sales and inventory data
- Services: Utilization and client metrics

**Section 3: Competitive Position**
- Market size and share estimates
- Competitive advantages assessment
- Pricing strategy and differentiation
- Customer concentration analysis

**Section 4: Growth Analysis**
- Historical performance trends
- Future growth projections
- Investment and expansion plans
- Market opportunity assessment

**Enhanced AI Processing:**
- Industry-specific valuation methodologies
- Benchmarking against similar businesses
- Risk assessment based on financial ratios
- Growth potential scoring and analysis

**User Experience Enhancements:**
- Financial metrics calculator tools
- Industry benchmarking displays
- Progress tracking with completion incentives
- Export functionality for financial analysis

## Financial Metrics Research Integration

**Industry Best Practices:**
- Research standard financial ratios by industry
- Implement benchmark comparisons
- Add explanatory content for complex metrics
- Provide calculation assistance and validation

**Data Quality Assurance:**
- Cross-validation between related metrics
- Reasonableness checks against industry norms
- Optional CPA/accountant verification workflow
- Confidence scoring based on data completeness

## Estimated Effort: 15-18 hours focused development