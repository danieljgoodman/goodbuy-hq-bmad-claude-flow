import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/services/ABTestingService'
import { z } from 'zod'

const ABTestVariantSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  traffic_percentage: z.number().min(0).max(100),
  config: z.record(z.any()).default({})
})

const CreateExperimentSchema = z.object({
  action: z.literal('create_experiment'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  variants: z.array(ABTestVariantSchema).min(2).max(10),
  allocation_percentage: z.number().min(0).max(100).default(100),
  target_metric: z.string().min(1).max(50),
  hypothesis: z.string().max(1000).optional(),
  min_sample_size: z.number().min(30).max(10000).default(100),
  max_duration_days: z.number().min(1).max(90).default(30),
  success_criteria: z.object({
    primary_metric: z.string().min(1).max(50),
    improvement_threshold: z.number().min(0).max(100).default(5),
    confidence_level: z.number().min(80).max(99).default(95)
  }).optional()
})

const StartStopExperimentSchema = z.object({
  action: z.enum(['start_experiment', 'stop_experiment']),
  experiment_id: z.string().min(1).max(100)
})

const AssignUserSchema = z.object({
  action: z.literal('assign_user'),
  experiment_id: z.string().min(1).max(100),
  user_id: z.string().min(1).max(100),
  user_properties: z.record(z.any()).default({})
})

const TrackConversionSchema = z.object({
  action: z.literal('track_conversion'),
  experiment_id: z.string().min(1).max(100),
  user_id: z.string().min(1).max(100),
  metric: z.string().min(1).max(50),
  value: z.number(),
  properties: z.record(z.any()).default({})
})

const ABTestActionSchema = z.discriminatedUnion('action', [
  CreateExperimentSchema,
  StartStopExperimentSchema,
  AssignUserSchema,
  TrackConversionSchema
])

const ABTestQuerySchema = z.object({
  action: z.enum(['running_experiments', 'user_experiments', 'experiment_variant', 'analyze_experiment', 'segmented_analysis', 'auto_stop_check']).optional(),
  experiment_id: z.string().max(100).optional(),
  user_id: z.string().max(100).optional(),
  segment_by: z.string().max(50).optional()
})

const abTestingService = new ABTestingService()

// Rate limiting for experiment creation
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string, action: string): boolean {
  const now = Date.now()
  const windowMs = 3600000 // 1 hour
  const maxRequests = action === 'create_experiment' ? 5 : 50 // Limit experiment creation

  const userLimit = rateLimitMap.get(`${userId}_${action}`) || { count: 0, lastReset: now }
  
  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 0
    userLimit.lastReset = now
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  rateLimitMap.set(`${userId}_${action}`, userLimit)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    // Input validation
    const validationResult = ABTestActionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const validatedBody = validationResult.data

    // Rate limiting check
    if (!checkRateLimit(userId, validatedBody.action)) {
      return NextResponse.json(
        { error: `Rate limit exceeded for ${validatedBody.action}` },
        { status: 429 }
      )
    }

    switch (validatedBody.action) {
      case 'create_experiment':
        // Validate variants traffic percentages sum to 100
        const totalTraffic = validatedBody.variants.reduce((sum, v) => sum + v.traffic_percentage, 0)
        if (Math.abs(totalTraffic - 100) > 0.1) {
          return NextResponse.json(
            { error: 'Variant traffic percentages must sum to 100' },
            { status: 400 }
          )
        }

        const experiment = await abTestingService.createExperiment({
          name: validatedBody.name,
          description: validatedBody.description || '',
          variants: validatedBody.variants,
          allocation_percentage: validatedBody.allocation_percentage,
          target_metric: validatedBody.target_metric,
          hypothesis: validatedBody.hypothesis || '',
          min_sample_size: validatedBody.min_sample_size,
          max_duration_days: validatedBody.max_duration_days,
          success_criteria: validatedBody.success_criteria || {
            primary_metric: validatedBody.target_metric,
            improvement_threshold: 5,
            confidence_level: 95
          }
        })

        return NextResponse.json({ experiment })

      case 'start_experiment':
        await abTestingService.startExperiment(validatedBody.experiment_id)
        return NextResponse.json({ success: true })

      case 'stop_experiment':
        await abTestingService.stopExperiment(validatedBody.experiment_id)
        return NextResponse.json({ success: true })

      case 'assign_user':
        const variant = await abTestingService.assignUserToExperiment(
          validatedBody.experiment_id, 
          validatedBody.user_id, 
          validatedBody.user_properties
        )
        return NextResponse.json({ variant })

      case 'track_conversion':
        await abTestingService.trackConversion(
          validatedBody.experiment_id, 
          validatedBody.user_id, 
          validatedBody.metric, 
          validatedBody.value, 
          validatedBody.properties
        )
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Failed to process A/B testing action:', error)
    return NextResponse.json(
      { error: 'Failed to process A/B testing action' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Input validation
    const validationResult = ABTestQuerySchema.safeParse({
      action: searchParams.get('action'),
      experiment_id: searchParams.get('experiment_id'),
      user_id: searchParams.get('user_id'),
      segment_by: searchParams.get('segment_by')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { action, experiment_id, user_id, segment_by } = validationResult.data

    switch (action) {
      case 'running_experiments':
        const runningExperiments = await abTestingService.getRunningExperiments()
        return NextResponse.json({ experiments: runningExperiments })

      case 'user_experiments':
        if (!user_id) {
          return NextResponse.json(
            { error: 'User ID required for user experiments' },
            { status: 400 }
          )
        }
        const userExperiments = await abTestingService.getUserExperiments(user_id)
        return NextResponse.json({ experiments: userExperiments })

      case 'experiment_variant':
        if (!experiment_id || !user_id) {
          return NextResponse.json(
            { error: 'Experiment ID and User ID required for variant lookup' },
            { status: 400 }
          )
        }
        const variant = await abTestingService.getExperimentVariant(experiment_id, user_id)
        return NextResponse.json({ variant })

      case 'analyze_experiment':
        if (!experiment_id) {
          return NextResponse.json(
            { error: 'Experiment ID required for analysis' },
            { status: 400 }
          )
        }
        const analysis = await abTestingService.analyzeExperiment(experiment_id)
        return NextResponse.json({ analysis })

      case 'segmented_analysis':
        if (!experiment_id || !segment_by) {
          return NextResponse.json(
            { error: 'Experiment ID and segment_by required for segmented analysis' },
            { status: 400 }
          )
        }
        const segmentedAnalysis = await abTestingService.generateSegmentedAnalysis(
          experiment_id, 
          segment_by
        )
        return NextResponse.json({ segmented_analysis: segmentedAnalysis })

      case 'auto_stop_check':
        if (!experiment_id) {
          return NextResponse.json(
            { error: 'Experiment ID required for auto-stop check' },
            { status: 400 }
          )
        }
        const shouldStop = await abTestingService.shouldAutoStop(experiment_id)
        return NextResponse.json({ should_stop: shouldStop })

      default:
        const allRunning = await abTestingService.getRunningExperiments()
        return NextResponse.json({ experiments: allRunning }, {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes cache
          }
        })
    }

  } catch (error) {
    console.error('Failed to fetch A/B testing data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B testing data' },
      { status: 500 }
    )
  }
}