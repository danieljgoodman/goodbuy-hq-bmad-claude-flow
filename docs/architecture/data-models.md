# Data Models

## User

**Purpose:** Core user entity representing business owners using the platform with authentication and subscription management

**Key Attributes:**
- id: string - Unique identifier (UUID)
- email: string - Primary authentication credential
- businessName: string - Name of user's business
- industry: string - Business industry sector
- role: string - User's role in the business
- subscriptionTier: enum - Free, Premium, Enterprise
- createdAt: Date - Account creation timestamp
- lastLoginAt: Date - User activity tracking

### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  businessName: string;
  industry: string;
  role: 'owner' | 'manager' | 'advisor';
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

### Relationships
- One-to-many with BusinessEvaluations
- One-to-many with ImprovementProgress
- One-to-one with Subscription

## BusinessEvaluation

**Purpose:** Stores comprehensive AI-generated business valuations with multi-methodology analysis and confidence scoring

### TypeScript Interface
```typescript
interface BusinessEvaluation {
  id: string;
  userId: string;
  businessData: {
    annualRevenue: number;
    monthlyRecurring: number;
    expenses: number;
    cashFlow: number;
    assets: number;
    liabilities: number;
    customerCount: number;
    marketPosition: string;
  };
  valuations: {
    assetBased: number;
    incomeBased: number;
    marketBased: number;
    weighted: number;
    methodology: string;
  };
  healthScore: number;
  confidenceScore: number;
  topOpportunities: ImprovementOpportunity[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

## ImprovementOpportunity

**Purpose:** AI-identified opportunities for business value enhancement with quantified impact estimates and implementation guidance

### TypeScript Interface
```typescript
interface ImprovementOpportunity {
  id: string;
  category: 'operational' | 'financial' | 'strategic' | 'market';
  title: string;
  description: string;
  impactEstimate: {
    dollarAmount: number;
    percentageIncrease: number;
    confidence: number;
  };
  difficulty: 'low' | 'medium' | 'high';
  timeframe: string;
  priority: number;
  implementationGuide?: string; // Premium content
  requiredResources: string[];
}
```

## DocumentAnalysis

**Purpose:** AI-processed financial documents with extracted metrics and data quality assessment for enhanced valuation accuracy

### TypeScript Interface
```typescript
interface DocumentAnalysis {
  id: string;
  evaluationId: string;
  fileName: string;
  fileType: 'financial_statement' | 'tax_return' | 'bank_statement' | 'other';
  extractedData: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
    assets: number;
    liabilities: number;
  };
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    confidence: number;
  };
  redFlags: string[];
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}
```

## ImprovementProgress

**Purpose:** Tracks user progress on implementing AI-recommended improvements with value impact measurement for premium subscribers

### TypeScript Interface
```typescript
interface ImprovementProgress {
  id: string;
  userId: string;
  opportunityId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'validated';
  completedSteps: string[];
  evidence: {
    type: 'document' | 'screenshot' | 'metric';
    url: string;
    description: string;
  }[];
  valueImpact: number;
  startedAt: Date;
  completedAt?: Date;
  validatedAt?: Date;
}
```

## Subscription

**Purpose:** Premium subscription management with Stripe integration for payment processing and feature access control

### TypeScript Interface
```typescript
interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  plan: 'free' | 'premium_monthly' | 'premium_annual';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
