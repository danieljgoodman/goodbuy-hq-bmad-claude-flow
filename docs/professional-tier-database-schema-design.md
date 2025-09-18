# Professional Tier Database Schema Design
## Architecture Decision Record & Implementation Guide

**Story:** 11.1 - Professional Tier Database Schema Extension
**Date:** September 17, 2025
**Status:** Recommended Approach
**Decision:** Extended JSONB with Structured Validation

---

## Executive Summary

After comprehensive analysis of the existing system and Story 11.1 requirements, I recommend an **Extended JSONB Approach** that enhances the current BusinessEvaluation model while maintaining backward compatibility and providing optimal performance for Professional tier's 45+ data fields.

## Current State Analysis

### Existing BusinessEvaluation Model
```prisma
model BusinessEvaluation {
  id              String            @id @default(uuid()) @db.Uuid
  userId          String            @db.Uuid
  businessData    Json              // Currently ~15 basic tier fields
  valuations      Json              // Asset, income, market-based valuations
  healthScore     Float?            // 0-100 score
  confidenceScore Float?            // AI confidence level
  opportunities   Json[]            // Improvement recommendations
  status          EvaluationStatus  @default(PROCESSING)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  implementationGuides ImplementationGuide[]
  businessRevaluations BusinessRevaluation[]

  @@index([deletedAt])
  @@map("business_evaluations")
}
```

### Current Query Patterns
- **Primary Access:** `findByUserId()` - User dashboard evaluation list
- **Secondary Access:** `findById()` - Specific evaluation details
- **Performance Target:** <2s response time for Professional tier
- **Data Volume:** Currently 15 fields, expanding to 45+ fields (3x increase)

## Professional Tier Data Model

### Six Category Structure (45+ Fields)
```typescript
interface ProfessionalTierData {
  // 1. Financial Performance Analysis (13 fields)
  financialPerformance: {
    revenue2024: number;
    revenue2023: number;
    revenue2022: number;
    netIncome2024: number;
    netIncome2023: number;
    netIncome2022: number;
    cashFlow2024: number;
    cashFlow2023: number;
    cashFlow2022: number;
    recurringRevenuePercentage: number;
    averageInventoryInvestment: number;
    averageAccountsReceivable: number;
    tangibleAssetReplacementValue: number;
  };

  // 2. Customer & Risk Analysis (9 fields)
  customerRiskAnalysis: {
    largestCustomerRevenue: number;
    topThreeCustomersRevenue: number;
    topFiveCustomersRevenue: number;
    averageCustomerDuration: 'under6months' | '6to18months' | '18to36months' | 'over3years';
    customerTerminationNotice: 'atwill' | '30days' | '90days' | '180plus';
    peakRevenuePercentage: number;
    lowRevenuePercentage: number;
    customerRetentionRate: number;
    customerReplacementTime: 'under30' | '30to60' | '60to90' | 'over90';
  };

  // 3. Competitive & Market Analysis (7 fields)
  competitiveAnalysis: {
    directCompetitorCount: number;
    competitorReplicationTime: '3to6months' | '6to18months' | '18to36months' | 'over3years';
    marketEntryCapitalRequired: number;
    marketGrowthTrajectory: 'highgrowth' | 'moderategrowth' | 'stable' | 'declining';
    maxRevenueCapacity: number;
    scalabilityInvestmentRequired: number;
    primaryGrowthConstraint: 'demand' | 'capacity' | 'capital' | 'management' | 'competition' | 'regulatory';
  };

  // 4. Operational Risk Analysis (6 fields)
  operationalRisk: {
    businessWithoutOwner: 'fully' | 'limited' | 'significant' | 'cannot';
    criticalEmployeeRoles: string;
    externalThreat: string;
    customerContractRisk: 'atwill' | '30days' | '90days' | '180plus';
    regulatoryRiskFactors: string;
    supplierDependency: 'singlesource' | 'limited' | 'multiple';
  };

  // 5. Strategic Investment Planning (3 fields)
  strategicInvestment: {
    transactionTimeline: '0to12months' | '12to24months' | '24plus' | 'noplans';
    investmentCapacity: '0to25k' | '25to75k' | '75to200k' | 'over200k';
    strategicInvestmentPriorities: string[];
  };

  // 6. Value Enhancement Opportunities (3 fields)
  valueEnhancement: {
    valueOptimizationOpportunity: string;
    processImprovementPotential: string;
    valuationIncreaseRequirements: string;
  };

  // Metadata (4 fields)
  metadata: {
    completionTimestamp: string;
    dataVersion: string;
    analysisDepth: 'professional';
    validationStatus: 'pending' | 'validated' | 'requires_review';
  };
}
```

## Recommended Approach: Extended JSONB with Structured Validation

### Decision Rationale

**Why Extended JSONB over Separate Table:**

1. **Backward Compatibility:** Builds on existing `businessData` pattern
2. **Query Performance:** Single table joins, no additional relationship overhead
3. **Flexibility:** Handles evolving questionnaire fields without schema migrations
4. **Development Speed:** Leverages existing repository patterns and validation
5. **PostgreSQL Optimization:** Excellent JSONB indexing and query performance

### Complete Prisma Schema Modifications

```prisma
model BusinessEvaluation {
  id              String            @id @default(uuid()) @db.Uuid
  userId          String            @db.Uuid

  // Enhanced business data structure
  businessData    Json              // Basic tier: 15 fields, Professional: 15 + extended structure

  // Professional tier extended data (JSONB for structured storage)
  professionalData Json?            // ProfessionalTierData structure when tier = professional

  // Tier and analysis metadata
  subscriptionTier String           @default("basic") // 'basic' | 'professional' | 'enterprise'
  analysisDepth    String           @default("basic") // 'basic' | 'professional' | 'enterprise'
  dataVersion      String           @default("1.0")   // Schema versioning for migrations

  // Existing fields remain unchanged
  valuations      Json
  healthScore     Float?
  confidenceScore Float?
  opportunities   Json[]
  status          EvaluationStatus  @default(PROCESSING)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?

  // Relationships remain unchanged
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  implementationGuides ImplementationGuide[]
  businessRevaluations BusinessRevaluation[]

  // Enhanced indexing strategy for Professional tier performance
  @@index([userId, subscriptionTier])           // Primary user access with tier filtering
  @@index([subscriptionTier, createdAt])        // Tier-based chronological queries
  @@index([userId, createdAt])                  // Existing user timeline queries
  @@index([deletedAt])                          // Existing soft delete queries
  @@index([status, subscriptionTier])           // Status filtering by tier

  // JSONB-specific indexes for Professional tier data access
  @@index([professionalData], type: Gin)        // Full Professional data search

  @@map("business_evaluations")
}

// Optional: Audit table for Professional tier data changes
model ProfessionalDataAudit {
  id                   String   @id @default(uuid()) @db.Uuid
  businessEvaluationId String   @db.Uuid
  userId               String   @db.Uuid
  changeType           String   // 'created' | 'updated' | 'tier_upgraded'
  previousData         Json?    // Previous professional data state
  newData              Json     // New professional data state
  changedFields        String[] // Array of field names that changed
  timestamp            DateTime @default(now())
  userAgent            String?  // Browser/client info
  ipAddress            String?  // Security tracking

  businessEvaluation BusinessEvaluation @relation(fields: [businessEvaluationId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([businessEvaluationId])
  @@index([userId, timestamp])
  @@index([timestamp])
  @@map("professional_data_audit")
}

// Enhanced User model relationships for audit trail
model User {
  // ... existing fields remain unchanged

  // New relationships for Professional tier
  professionalDataAudits ProfessionalDataAudit[]

  // ... existing relationships remain unchanged
}
```

### Data Structure Evolution Strategy

```typescript
// Basic Tier Data (existing - unchanged)
interface BasicBusinessData {
  // Business Basics (5 fields)
  businessType: string;
  industryFocus: string;
  yearsInBusiness: number;
  businessModel: string;
  revenueModel: string;

  // Financial Metrics (5 fields)
  annualRevenue: number;
  monthlyRecurring: number;
  expenses: number;
  cashFlow: number;
  grossMargin: number;

  // Operational Data (5 fields)
  customerCount: number;
  employeeCount: number;
  marketPosition: string;
  competitiveAdvantages: string[];
  primaryChannels: string[];
}

// Professional Tier Extension (new)
interface EnhancedBusinessData extends BasicBusinessData {
  // All basic fields remain + professional tier structure in professionalData field
}
```

## Performance Optimization Strategy

### 1. Strategic Indexing
```sql
-- Primary access patterns
CREATE INDEX CONCURRENTLY idx_business_evaluations_user_tier
ON business_evaluations(user_id, subscription_tier);

-- Professional tier data queries
CREATE INDEX CONCURRENTLY idx_business_evaluations_professional_gin
ON business_evaluations USING gin(professional_data);

-- Specific field access (example: financial performance)
CREATE INDEX CONCURRENTLY idx_professional_financial_revenue
ON business_evaluations USING gin((professional_data->'financialPerformance'));

-- Tier upgrade/analysis depth tracking
CREATE INDEX CONCURRENTLY idx_business_evaluations_tier_analysis
ON business_evaluations(subscription_tier, analysis_depth, created_at);
```

### 2. Query Optimization Patterns
```typescript
// Efficient tier-aware queries
const getTierSpecificData = async (userId: string, userTier: string) => {
  if (userTier === 'basic') {
    // Only fetch basic data - exclude professional_data from selection
    return prisma.businessEvaluation.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        businessData: true,
        valuations: true,
        healthScore: true,
        confidenceScore: true,
        opportunities: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        subscriptionTier: true
        // Explicitly exclude professionalData
      }
    });
  } else {
    // Fetch complete dataset including professional data
    return prisma.businessEvaluation.findMany({
      where: { userId, deletedAt: null },
      // Include all fields for professional users
    });
  }
};
```

### 3. Caching Strategy
```typescript
// Redis caching for frequently accessed professional data
const CACHE_CONFIG = {
  professionalEvaluation: {
    ttl: 3600, // 1 hour
    key: (userId: string, evalId: string) => `prof_eval:${userId}:${evalId}`
  },
  tierValidation: {
    ttl: 900, // 15 minutes
    key: (userId: string) => `tier_access:${userId}`
  }
};
```

## Backward Compatibility & Migration Strategy

### 1. Zero-Downtime Migration
```sql
-- Step 1: Add new columns (non-breaking)
ALTER TABLE business_evaluations
ADD COLUMN professional_data JSONB,
ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'basic',
ADD COLUMN analysis_depth VARCHAR(20) DEFAULT 'basic',
ADD COLUMN data_version VARCHAR(10) DEFAULT '1.0';

-- Step 2: Create indexes concurrently
CREATE INDEX CONCURRENTLY idx_business_evaluations_user_tier
ON business_evaluations(user_id, subscription_tier);

-- Step 3: Backfill existing data
UPDATE business_evaluations
SET subscription_tier = 'basic',
    analysis_depth = 'basic',
    data_version = '1.0'
WHERE subscription_tier IS NULL;

-- Step 4: Add constraints
ALTER TABLE business_evaluations
ALTER COLUMN subscription_tier SET NOT NULL,
ALTER COLUMN analysis_depth SET NOT NULL,
ALTER COLUMN data_version SET NOT NULL;
```

### 2. Data Migration for Tier Upgrades
```typescript
const migrateToProfessionalTier = async (userId: string, evaluationId: string) => {
  const evaluation = await prisma.businessEvaluation.findUnique({
    where: { id: evaluationId, userId }
  });

  if (!evaluation) throw new Error('Evaluation not found');

  // Migrate existing basic data and add professional structure
  const updatedEvaluation = await prisma.businessEvaluation.update({
    where: { id: evaluationId },
    data: {
      subscriptionTier: 'professional',
      analysisDepth: 'professional',
      professionalData: {
        // Initialize with empty professional structure
        financialPerformance: {},
        customerRiskAnalysis: {},
        competitiveAnalysis: {},
        operationalRisk: {},
        strategicInvestment: {},
        valueEnhancement: {},
        metadata: {
          completionTimestamp: new Date().toISOString(),
          dataVersion: '2.0',
          analysisDepth: 'professional',
          validationStatus: 'pending'
        }
      }
    }
  });

  return updatedEvaluation;
};
```

## Validation & Type Safety

### 1. Enhanced Zod Schemas
```typescript
// Professional tier validation schema
export const ProfessionalTierDataSchema = z.object({
  financialPerformance: z.object({
    revenue2024: z.number().min(0),
    revenue2023: z.number().min(0),
    revenue2022: z.number().min(0),
    netIncome2024: z.number(),
    netIncome2023: z.number(),
    netIncome2022: z.number(),
    cashFlow2024: z.number(),
    cashFlow2023: z.number(),
    cashFlow2022: z.number(),
    recurringRevenuePercentage: z.number().min(0).max(100),
    averageInventoryInvestment: z.number().min(0),
    averageAccountsReceivable: z.number().min(0),
    tangibleAssetReplacementValue: z.number().min(0),
  }),

  customerRiskAnalysis: z.object({
    largestCustomerRevenue: z.number().min(0),
    topThreeCustomersRevenue: z.number().min(0),
    topFiveCustomersRevenue: z.number().min(0),
    averageCustomerDuration: z.enum(['under6months', '6to18months', '18to36months', 'over3years']),
    customerTerminationNotice: z.enum(['atwill', '30days', '90days', '180plus']),
    peakRevenuePercentage: z.number().min(0).max(100),
    lowRevenuePercentage: z.number().min(0).max(100),
    customerRetentionRate: z.number().min(0).max(100),
    customerReplacementTime: z.enum(['under30', '30to60', '60to90', 'over90']),
  }),

  // ... other categories following same pattern

  metadata: z.object({
    completionTimestamp: z.string(),
    dataVersion: z.string(),
    analysisDepth: z.literal('professional'),
    validationStatus: z.enum(['pending', 'validated', 'requires_review']),
  }),
});

// Tier-aware business data schema
export const TierAwareBusinessDataSchema = z.object({
  // Basic tier fields (existing)
  ...BusinessDataSchema.shape,

  // Professional tier extension
  professionalData: ProfessionalTierDataSchema.optional(),
  subscriptionTier: z.enum(['basic', 'professional', 'enterprise']),
  analysisDepth: z.enum(['basic', 'professional', 'enterprise']),
  dataVersion: z.string(),
});

export type ProfessionalTierData = z.infer<typeof ProfessionalTierDataSchema>;
export type TierAwareBusinessData = z.infer<typeof TierAwareBusinessDataSchema>;
```

### 2. API Validation Middleware
```typescript
export const validateTierAccess = (requiredTier: 'basic' | 'professional' | 'enterprise') => {
  return async (req: NextRequest, userId: string) => {
    const user = await getUserWithSubscription(userId);

    const tierHierarchy = { basic: 1, professional: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[user.subscriptionTier as keyof typeof tierHierarchy];
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      throw new Error(`Insufficient tier access. Required: ${requiredTier}, Current: ${user.subscriptionTier}`);
    }

    return user;
  };
};
```

## API Endpoint Modifications

### 1. Enhanced Evaluation Endpoints
```typescript
// GET /api/evaluations/[id] - Tier-aware response
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  const user = await validateTierAccess('basic')(request, userId);

  const evaluation = await prisma.businessEvaluation.findUnique({
    where: { id: params.id, userId },
    select: {
      id: true,
      businessData: true,
      valuations: true,
      healthScore: true,
      confidenceScore: true,
      opportunities: true,
      status: true,
      subscriptionTier: true,
      createdAt: true,
      updatedAt: true,
      // Conditionally include professional data based on user tier
      ...(user.subscriptionTier !== 'basic' && {
        professionalData: true,
        analysisDepth: true,
        dataVersion: true,
      }),
    },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  // Filter response based on user's tier access
  const filteredEvaluation = filterEvaluationByTier(evaluation, user.subscriptionTier);

  return NextResponse.json(filteredEvaluation);
}

// POST /api/evaluations - Tier-aware creation
export async function POST(request: NextRequest) {
  const { userId } = auth();
  const { businessData, professionalData, requestedTier } = await request.json();

  // Validate tier access for professional data submission
  if (professionalData || requestedTier === 'professional') {
    await validateTierAccess('professional')(request, userId);
  }

  // Validate data according to tier
  const validatedData = requestedTier === 'professional'
    ? TierAwareBusinessDataSchema.parse({
        ...businessData,
        professionalData,
        subscriptionTier: 'professional',
        analysisDepth: 'professional',
        dataVersion: '2.0'
      })
    : BusinessDataSchema.parse(businessData);

  const evaluation = await prisma.businessEvaluation.create({
    data: {
      userId,
      businessData: validatedData,
      professionalData: validatedData.professionalData || null,
      subscriptionTier: requestedTier || 'basic',
      analysisDepth: requestedTier || 'basic',
      dataVersion: validatedData.dataVersion || '1.0',
      status: 'PROCESSING',
    },
  });

  return NextResponse.json(evaluation);
}
```

### 2. Tier Upgrade Endpoint
```typescript
// POST /api/evaluations/[id]/upgrade-tier
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  const { targetTier, professionalData } = await request.json();

  // Validate tier access
  await validateTierAccess(targetTier)(request, userId);

  const evaluation = await prisma.businessEvaluation.findUnique({
    where: { id: params.id, userId },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  // Upgrade evaluation with professional data
  const upgradedEvaluation = await prisma.businessEvaluation.update({
    where: { id: params.id },
    data: {
      subscriptionTier: targetTier,
      analysisDepth: targetTier,
      professionalData: ProfessionalTierDataSchema.parse(professionalData),
      dataVersion: '2.0',
      updatedAt: new Date(),
    },
  });

  // Create audit log entry
  await prisma.professionalDataAudit.create({
    data: {
      businessEvaluationId: params.id,
      userId,
      changeType: 'tier_upgraded',
      previousData: evaluation.professionalData,
      newData: professionalData,
      changedFields: ['tier_upgrade'],
      userAgent: request.headers.get('user-agent'),
      ipAddress: getClientIpAddress(request),
    },
  });

  return NextResponse.json(upgradedEvaluation);
}
```

## Security & Compliance Considerations

### 1. Data Encryption
```typescript
// Encrypt sensitive professional data at rest
const encryptProfessionalData = (data: ProfessionalTierData): string => {
  const key = process.env.PROFESSIONAL_DATA_ENCRYPTION_KEY;
  return encrypt(JSON.stringify(data), key);
};

const decryptProfessionalData = (encryptedData: string): ProfessionalTierData => {
  const key = process.env.PROFESSIONAL_DATA_ENCRYPTION_KEY;
  const decryptedJson = decrypt(encryptedData, key);
  return JSON.parse(decryptedJson);
};
```

### 2. Audit Logging
```typescript
// Comprehensive audit trail for professional data changes
const logProfessionalDataChange = async (
  evaluationId: string,
  userId: string,
  changeType: string,
  previousData: any,
  newData: any,
  changedFields: string[],
  request: NextRequest
) => {
  await prisma.professionalDataAudit.create({
    data: {
      businessEvaluationId: evaluationId,
      userId,
      changeType,
      previousData,
      newData,
      changedFields,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ipAddress: getClientIpAddress(request),
    },
  });
};
```

## Performance Benchmarks & Monitoring

### 1. Response Time Targets
```typescript
const PERFORMANCE_TARGETS = {
  basic_evaluation_query: 500, // ms
  professional_evaluation_query: 2000, // ms
  tier_upgrade_operation: 3000, // ms
  professional_data_validation: 100, // ms
};
```

### 2. Monitoring Queries
```sql
-- Monitor Professional tier performance
SELECT
  subscription_tier,
  COUNT(*) as evaluation_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
  AVG(pg_column_size(professional_data)) as avg_data_size
FROM business_evaluations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY subscription_tier;

-- Professional data access patterns
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  subscription_tier,
  COUNT(*) as access_count
FROM business_evaluations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, subscription_tier
ORDER BY hour DESC;
```

## Risk Mitigation & Rollback Strategy

### 1. Feature Flags
```typescript
const FEATURE_FLAGS = {
  PROFESSIONAL_TIER_ENABLED: process.env.FEATURE_PROFESSIONAL_TIER === 'true',
  PROFESSIONAL_DATA_ENCRYPTION: process.env.FEATURE_PROFESSIONAL_ENCRYPTION === 'true',
  AUDIT_LOGGING_ENABLED: process.env.FEATURE_AUDIT_LOGGING === 'true',
};
```

### 2. Rollback Procedures
```sql
-- Emergency rollback: Disable professional tier access
UPDATE business_evaluations
SET subscription_tier = 'basic', analysis_depth = 'basic'
WHERE subscription_tier = 'professional';

-- Rollback migration: Remove professional columns (if needed)
ALTER TABLE business_evaluations
DROP COLUMN IF EXISTS professional_data,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS analysis_depth,
DROP COLUMN IF EXISTS data_version;
```

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Create database migration scripts
- [ ] Implement enhanced Prisma schema
- [ ] Create validation schemas and TypeScript interfaces
- [ ] Build tier validation middleware

### Phase 2: API Integration (Week 2)
- [ ] Modify existing evaluation endpoints
- [ ] Implement tier upgrade functionality
- [ ] Add audit logging system
- [ ] Create performance monitoring

### Phase 3: Testing & Optimization (Week 3)
- [ ] Comprehensive test suite (unit, integration, performance)
- [ ] Load testing with Professional tier data volumes
- [ ] Security testing and encryption validation
- [ ] Backward compatibility verification

### Phase 4: Deployment & Monitoring (Week 4)
- [ ] Staged deployment with feature flags
- [ ] Performance monitoring and alerting
- [ ] User acceptance testing
- [ ] Documentation and training materials

## Conclusion

This **Extended JSONB Approach** provides the optimal balance of:

✅ **Performance:** Single-table queries with strategic indexing
✅ **Flexibility:** JSONB structure accommodates evolving questionnaires
✅ **Backward Compatibility:** Builds on existing patterns without breaking changes
✅ **Scalability:** Efficient handling of 3x data complexity increase
✅ **Developer Experience:** Leverages existing repository patterns and validation
✅ **Security:** Comprehensive audit logging and encryption capabilities

The design maintains the simplicity and performance of the current system while providing a robust foundation for Professional and Enterprise tier expansion.