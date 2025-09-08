import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { valuationEngine } from '@/lib/services/valuation-engine';

// Input validation schema
const businessDataSchema = z.object({
  annualRevenue: z.number().min(0, 'Annual revenue must be non-negative'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be non-negative'),
  expenses: z.number().min(0, 'Expenses must be non-negative'),
  cashFlow: z.number(),
  assets: z.object({
    tangible: z.number().min(0),
    intangible: z.number().min(0),
    inventory: z.number().min(0),
    equipment: z.number().min(0),
    realEstate: z.number().min(0),
  }),
  liabilities: z.object({
    shortTerm: z.number().min(0),
    longTerm: z.number().min(0),
    contingent: z.number().min(0),
  }),
  customerCount: z.number().int().min(0, 'Customer count must be non-negative'),
  marketPosition: z.enum(['leader', 'strong', 'average', 'weak', 'struggling']),
  industry: z.string().min(1, 'Industry is required'),
  businessAge: z.number().min(0).max(100, 'Business age must be between 0 and 100'),
  growthRate: z.number().min(-1).max(10, 'Growth rate must be between -100% and 1000%'),
});

const valuationRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  businessData: businessDataSchema,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate the request data
    const validationResult = valuationRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
          processingTime: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // Perform the valuation
    const result = await valuationEngine.performValuation(validationResult.data);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Return successful result
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Valuation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during valuation processing',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return API information and performance metrics
  const metrics = valuationEngine.getPerformanceMetrics();
  
  return NextResponse.json({
    service: 'Multi-Methodology AI Valuation Engine',
    version: '1.0.0',
    capabilities: [
      'Asset-based valuation with industry adjustments',
      'Income-based valuation using DCF analysis',
      'Market-based valuation with comparable analysis',
      'Weighted final valuation with confidence scoring',
      'Real-time processing under 3 seconds',
    ],
    metrics,
    endpoints: {
      'POST /api/valuations': 'Create new business valuation',
      'GET /api/valuations/[id]': 'Retrieve specific valuation',
      'GET /api/valuations/[id]/export': 'Export valuation as PDF',
    },
  });
}