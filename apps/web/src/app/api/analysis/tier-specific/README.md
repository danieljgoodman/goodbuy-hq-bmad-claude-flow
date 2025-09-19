# Tier-Specific Analysis API

**Story 11.8: Enhanced AI Prompt Engineering for Tier-Specific Analysis**

A comprehensive AI-powered business analysis API that provides tier-specific insights based on user subscription level.

## Features

- **Tier-Specific Analysis**: Tailored analysis depth based on subscription tier (Free, Professional, Enterprise)
- **Advanced AI Integration**: Uses Claude 3.5 Sonnet for sophisticated business insights
- **Rate Limiting**: Tier-based rate limiting to manage API usage
- **Async Processing**: Support for long-running analysis with webhook notifications
- **Comprehensive Validation**: Robust input validation and error handling
- **Security**: Authentication, CORS protection, and audit logging

## API Endpoints

### POST `/api/analysis/tier-specific`

Initiates a new tier-specific business analysis.

#### Request Body

```typescript
{
  analysisType: 'comprehensive' | 'strategic' | 'financial' | 'operational' | 'market' | 'risk' | 'valuation' | 'exit-planning',
  businessData: {
    basic: {
      industry: string,
      revenue: number,
      employees: number,
      yearEstablished: number,
      location: string
    },
    enterprise?: EnterpriseTierData // Only for Enterprise tier users
  },
  parameters: {
    timeHorizon: number, // 1-10 years
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    primaryObjective: 'growth' | 'profitability' | 'exit' | 'optimization',
    includeProjections: boolean,
    includeBenchmarks: boolean,
    includeRecommendations: boolean
  },
  options: {
    async: boolean,
    webhookUrl?: string, // Required for async processing
    priority: 'low' | 'normal' | 'high',
    format: 'json' | 'pdf' | 'excel',
    language: 'en' | 'es' | 'fr' | 'de'
  }
}
```

#### Response (Synchronous)

```typescript
{
  analysisId: string,
  status: 'completed',
  tier: 'free' | 'professional' | 'enterprise',
  results: {
    summary: string,
    keyInsights: string[],
    recommendations: Array<{
      title: string,
      description: string,
      priority: 'low' | 'medium' | 'high',
      timeframe: string,
      investmentRequired?: number,
      expectedROI?: number
    }>,
    financialProjections?: {
      revenue: number[],
      profitability: number[],
      cashFlow: number[],
      valuation?: number
    },
    riskAssessment?: {
      overallRiskScore: number,
      riskFactors: string[],
      mitigationStrategies: string[]
    },
    benchmarks?: {
      industryAverages: Record<string, number>,
      competitivePosition: string,
      performanceGaps: string[]
    },
    confidence: number, // 0-100
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor',
    limitations: string[]
  },
  metadata: {
    processingTime: number,
    tokenUsage: number,
    modelVersion: string,
    timestamp: string,
    expiresAt: string
  }
}
```

#### Response (Asynchronous)

```typescript
{
  analysisId: string,
  status: 'processing',
  tier: 'free' | 'professional' | 'enterprise',
  estimatedCompletion: string,
  message: string,
  metadata: {
    processingTime: number,
    timestamp: string
  }
}
```

### GET `/api/analysis/tier-specific?analysisId={id}`

Retrieves results from a completed analysis.

#### Response

Same as synchronous POST response above.

### OPTIONS `/api/analysis/tier-specific`

Handles CORS preflight requests.

## Usage Examples

### Basic Analysis (Free Tier)

```typescript
const response = await fetch('/api/analysis/tier-specific', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    analysisType: 'comprehensive',
    businessData: {
      basic: {
        industry: 'Technology',
        revenue: 1000000,
        employees: 25,
        yearEstablished: 2020,
        location: 'San Francisco, CA'
      }
    },
    parameters: {
      timeHorizon: 3,
      riskTolerance: 'moderate',
      primaryObjective: 'growth',
      includeProjections: true,
      includeBenchmarks: false, // Limited for free tier
      includeRecommendations: true
    },
    options: {
      async: false,
      priority: 'normal',
      format: 'json',
      language: 'en'
    }
  })
});

const analysis = await response.json();
console.log(analysis.results.summary);
```

### Professional Analysis with Benchmarking

```typescript
const response = await fetch('/api/analysis/tier-specific', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    analysisType: 'strategic',
    businessData: {
      basic: {
        industry: 'Manufacturing',
        revenue: 5000000,
        employees: 50,
        yearEstablished: 2015,
        location: 'Chicago, IL'
      }
    },
    parameters: {
      timeHorizon: 5,
      riskTolerance: 'moderate',
      primaryObjective: 'profitability',
      includeProjections: true,
      includeBenchmarks: true, // Available for professional tier
      includeRecommendations: true
    },
    options: {
      async: false,
      priority: 'high',
      format: 'json',
      language: 'en'
    }
  })
});

const analysis = await response.json();
console.log(analysis.results.benchmarks);
console.log(analysis.results.riskAssessment);
```

### Enterprise Analysis with Full Features

```typescript
const response = await fetch('/api/analysis/tier-specific', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({
    analysisType: 'comprehensive',
    businessData: {
      basic: {
        industry: 'Healthcare Technology',
        revenue: 25000000,
        employees: 150,
        yearEstablished: 2010,
        location: 'Boston, MA'
      },
      enterprise: {
        strategicValueDrivers: {
          patents: 15,
          trademarks: 8,
          hasTradeSecrets: true,
          hasCopyrights: true,
          ipPortfolioValue: 10000000,
          partnershipRevenuePercentage: 30,
          partnershipAgreementsValue: 15000000,
          brandDevelopmentInvestment: 2000000,
          marketPosition: 'leader',
          customerDatabaseValue: 5000000,
          customerAcquisitionCost: 1500,
          competitiveAdvantages: [
            {
              type: 'technology',
              rank: 1,
              sustainability: 'high'
            }
          ]
        },
        // ... additional enterprise data
      }
    },
    parameters: {
      timeHorizon: 7,
      riskTolerance: 'aggressive',
      primaryObjective: 'exit',
      includeProjections: true,
      includeBenchmarks: true,
      includeRecommendations: true
    },
    options: {
      async: true, // Long-running analysis
      webhookUrl: 'https://your-app.com/webhooks/analysis-complete',
      priority: 'high',
      format: 'json',
      language: 'en'
    }
  })
});

const analysisStatus = await response.json();
console.log(`Analysis ${analysisStatus.analysisId} started, estimated completion: ${analysisStatus.estimatedCompletion}`);
```

### Asynchronous Processing with Webhooks

```typescript
// 1. Start async analysis
const startResponse = await fetch('/api/analysis/tier-specific', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // ... analysis configuration
    options: {
      async: true,
      webhookUrl: 'https://your-app.com/webhooks/analysis-complete'
    }
  })
});

const { analysisId } = await startResponse.json();

// 2. Set up webhook handler
app.post('/webhooks/analysis-complete', (req, res) => {
  const { analysisId, status, results } = req.body;

  if (status === 'completed') {
    console.log('Analysis completed:', results.summary);
    // Process results...
  } else if (status === 'failed') {
    console.error('Analysis failed for', analysisId);
  }

  res.status(200).send('OK');
});

// 3. Or poll for results
const checkResults = async () => {
  const response = await fetch(`/api/analysis/tier-specific?analysisId=${analysisId}`);
  const data = await response.json();

  if (data.status === 'completed') {
    console.log('Results:', data.results);
    return data.results;
  }

  // Wait and check again
  setTimeout(checkResults, 5000);
};
```

## Rate Limits

| Tier | Requests per Hour | Token Limit |
|------|-------------------|-------------|
| Free | 5 | 2,000 |
| Professional | 50 | 4,000 |
| Enterprise | 500 | 8,000 |

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `202` - Accepted (async processing)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient tier)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

Error responses include detailed information:

```typescript
{
  error: string,
  code?: string,
  details?: ValidationError[],
  timestamp: string,
  requestId: string
}
```

## Tier Differences

### Free Tier
- Basic business analysis
- Simple recommendations
- Limited projections (3 years max)
- No benchmarking
- No risk assessment
- 5 requests/hour

### Professional Tier
- Detailed business analysis
- Industry benchmarking
- Risk assessment
- Advanced projections (5 years)
- Competitive positioning
- 50 requests/hour

### Enterprise Tier
- Comprehensive strategic analysis
- Advanced financial modeling
- Scenario analysis
- Exit strategy planning
- Value optimization
- Monte Carlo simulations
- 500 requests/hour
- Priority processing

## Authentication

All requests require valid authentication via Clerk. Include the auth token in the Authorization header:

```
Authorization: Bearer your-clerk-session-token
```

## Security Features

- **Authentication**: Clerk-based user authentication
- **Authorization**: Tier-based access control
- **Rate Limiting**: Redis-based rate limiting
- **Input Validation**: Comprehensive Zod schema validation
- **CORS Protection**: Configurable CORS headers
- **Audit Logging**: All requests logged for security
- **Error Handling**: Secure error responses (no sensitive data leaked)

## Data Privacy

- Analysis results are cached for 7 days
- No sensitive business data is stored permanently
- All requests are logged for audit purposes
- Enterprise tier data is encrypted at rest
- Results can be deleted on request

## Support

For API support or questions about tier features:

- Free Tier: Community support via documentation
- Professional Tier: Priority email support
- Enterprise Tier: Dedicated account manager

## Changelog

### v1.0.0 (Current)
- Initial release with tier-specific analysis
- Support for 8 analysis types
- Async processing with webhooks
- Comprehensive validation and error handling
- Rate limiting and security features