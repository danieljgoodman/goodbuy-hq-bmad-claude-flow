# Enhanced Report Generation API

The Enhanced Report Generation API provides comprehensive business analysis reports with AI-powered insights, tier-based access control, and multiple delivery options.

## Features

- **Tier-Based Access Control**: Professional and Enterprise tier validation
- **AI-Powered Analysis**: Integration with enhanced analysis engine from story 11.8
- **Multiple Report Types**: Financial, strategic, market position, and comprehensive analysis
- **Flexible Delivery**: API response, download, email, or cloud storage
- **Rate Limiting**: Tier-specific request limits with monitoring
- **Comprehensive Error Handling**: Detailed error responses and logging
- **Performance Monitoring**: Token usage, processing time, and quality metrics

## API Endpoints

### POST /api/reports/enhanced

Generate a new enhanced business report.

#### Request Body

```typescript
{
  userId: string;                    // UUID of the requesting user
  businessData: {
    businessName: string;            // Required: Name of the business
    industry: string;               // Required: Industry classification
    revenue?: number;               // Annual revenue
    employees?: number;             // Number of employees
    foundedYear?: number;           // Year founded
    financialMetrics?: {
      revenue?: number;
      profit?: number;
      expenses?: number;
      cashFlow?: number;
      debt?: number;
      assets?: number;
    };
    operationalMetrics?: {
      customerCount?: number;
      marketShare?: number;         // 0-1 decimal
      growthRate?: number;
      customerSatisfaction?: number; // 0-10 scale
    };
    strategicGoals?: string[];
    competitiveAdvantages?: string[];
    challenges?: string[];
  };
  reportConfig: {
    type: 'financial_analysis' | 'strategic_assessment' | 'market_position' | 'comprehensive' | 'custom';
    sections?: string[];            // Optional: Specific sections to include
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    includeScenarios?: boolean;     // Default: false
    includeRiskAssessment?: boolean; // Default: true
    includeBenchmarks?: boolean;    // Enterprise only
    customPrompts?: string[];       // Enterprise only
  };
  delivery?: {
    method: 'download' | 'email' | 'storage' | 'api_response'; // Default: 'api_response'
    format: 'pdf' | 'html' | 'json' | 'markdown'; // Default: 'json'
    email?: string;                 // Required if method is 'email'
    priority?: 'low' | 'medium' | 'high' | 'urgent'; // Default: 'medium'
  };
  options?: {
    useCache?: boolean;             // Default: true
    realTimeUpdates?: boolean;      // Default: false
    includeRawAnalysis?: boolean;   // Enterprise only, default: false
  };
}
```

#### Response

```typescript
{
  reportId: string;                 // UUID of the generated report
  status: 'processing' | 'completed' | 'failed';
  tier: string;                    // User's subscription tier
  analysis: {
    summary: {
      overallScore: number;        // 0-100 business health score
      keyFindings: string[];       // Top insights
      recommendations: string[];   // Action items
      confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
    };
    detailed?: any;                // Full analysis data (if requested)
    insights: {
      keyFindings: string[];
      recommendations: string[];
      riskFactors: string[];
      opportunities: string[];
    };
    scenarios?: any;               // Scenario modeling (if available)
    risks?: string[];              // Risk factors
  };
  delivery: {
    method: string;
    format: string;
    downloadUrl?: string;          // If method is 'download'
    emailSent?: boolean;           // If method is 'email'
    storageLocation?: string;      // If method is 'storage'
  };
  metadata: {
    processingTime: number;        // Milliseconds
    tokensUsed: number;           // AI tokens consumed
    cacheHit: boolean;            // Whether result was cached
    qualityScore: number;         // 0-100 analysis quality
    tierLimitations?: string[];   // Current tier restrictions
  };
}
```

### GET /api/reports/enhanced?reportId={id}&userId={id}

Get the status of a report generation request.

#### Response

```typescript
{
  reportId: string;
  status: 'processing' | 'completed' | 'failed';
  tier: string;
  metadata: {
    processingTime: number;
    tokensUsed: number;
    cacheHit: boolean;
  };
}
```

## Usage Examples

### Basic Report Generation (Professional Tier)

```typescript
const response = await fetch('/api/reports/enhanced', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-123',
    businessData: {
      businessName: 'TechStart Inc.',
      industry: 'Technology',
      revenue: 1500000,
      employees: 25,
      foundedYear: 2021,
      financialMetrics: {
        revenue: 1500000,
        profit: 300000,
        expenses: 1200000
      }
    },
    reportConfig: {
      type: 'comprehensive',
      analysisDepth: 'detailed',
      includeScenarios: true,
      includeRiskAssessment: true
    }
  })
});

const report = await response.json();
console.log('Report generated:', report.reportId);
console.log('Overall score:', report.analysis.summary.overallScore);
```

### Enterprise Features

```typescript
const enterpriseReport = await fetch('/api/reports/enhanced', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'enterprise-user-456',
    businessData: {
      // ... business data
    },
    reportConfig: {
      type: 'strategic_assessment',
      analysisDepth: 'comprehensive',
      includeBenchmarks: true,        // Enterprise only
      customPrompts: [                // Enterprise only
        'Analyze acquisition potential',
        'Evaluate market expansion opportunities'
      ]
    },
    options: {
      includeRawAnalysis: true        // Enterprise only
    }
  })
});
```

### Check Report Status

```typescript
const status = await fetch(
  `/api/reports/enhanced?reportId=${reportId}&userId=${userId}`
);
const statusData = await status.json();

if (statusData.status === 'completed') {
  console.log('Report ready!');
} else if (statusData.status === 'processing') {
  console.log('Still processing...');
}
```

## Error Responses

### 400 Bad Request - Invalid Data

```json
{
  "error": "Invalid request data",
  "details": [
    "userId: Invalid UUID format",
    "businessData.businessName: Business name is required"
  ]
}
```

### 403 Forbidden - Insufficient Tier

```json
{
  "error": "Enhanced reports require Professional or Enterprise subscription",
  "currentTier": "free",
  "requiredTier": "professional",
  "upgradeUrl": "/pricing?upgrade=professional"
}
```

### 403 Forbidden - Enterprise Feature

```json
{
  "error": "Feature not available in current tier",
  "requiredTier": "enterprise",
  "unavailableFeatures": ["benchmarks", "custom_prompts"],
  "upgradeUrl": "/pricing?upgrade=enterprise"
}
```

### 429 Rate Limited

```json
{
  "error": "Rate limit exceeded",
  "resetTime": 1640995200000,
  "limit": 30,
  "remaining": 0
}
```

### 503 Service Unavailable

```json
{
  "error": "AI analysis service temporarily unavailable",
  "message": "Please try again in a few minutes",
  "retryAfter": 300
}
```

## Rate Limits

- **Free Tier**: 5 requests per 15 minutes
- **Professional Tier**: 30 requests per 15 minutes
- **Enterprise Tier**: 100 requests per 15 minutes

## Tier Feature Matrix

| Feature | Free | Professional | Enterprise |
|---------|------|-------------|------------|
| Basic Reports | ❌ | ✅ | ✅ |
| Enhanced Reports | ❌ | ✅ | ✅ |
| Scenario Modeling | ❌ | ✅ | ✅ |
| Risk Assessment | ❌ | ✅ | ✅ |
| Benchmarks | ❌ | ❌ | ✅ |
| Custom Prompts | ❌ | ❌ | ✅ |
| Raw Analysis Data | ❌ | ❌ | ✅ |
| Real-time Updates | ❌ | Limited | ✅ |

## Performance Monitoring

The API includes comprehensive performance monitoring:

- **Processing Time**: Total time to generate the report
- **Token Usage**: AI tokens consumed for analysis
- **Cache Hit Rate**: Percentage of requests served from cache
- **Quality Score**: Analysis quality assessment (0-100)
- **Error Tracking**: Detailed error logging and analytics

## Integration Notes

1. **Authentication**: Requires valid user session with Professional+ tier
2. **Caching**: Reports are cached for 1 hour to improve performance
3. **Asynchronous Processing**: Large reports may be processed asynchronously
4. **Webhooks**: Enterprise users can configure webhooks for completion notifications
5. **Data Privacy**: All business data is encrypted and not stored permanently

## Support

For technical support or questions about the Enhanced Report Generation API:

- **Documentation**: Check the inline code documentation
- **Error Logs**: Include the `requestId` from error responses
- **Feature Requests**: Contact support for enterprise customization needs