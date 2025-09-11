#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('🚀 Creating comprehensive test user with all features...')
    
    // Create test user with admin privileges
    const testUser = await prisma.user.upsert({
      where: { email: 'admin@goodbuy.com' },
      update: {
        subscriptionTier: 'ENTERPRISE',
        userRole: 'super_admin',
        businessName: 'Test Business Corp',
        industry: 'Technology',
        lastLoginAt: new Date(),
      },
      create: {
        email: 'admin@goodbuy.com',
        businessName: 'Test Business Corp',
        industry: 'Technology',
        userRole: 'super_admin',
        subscriptionTier: 'ENTERPRISE',
        stripeCustomerId: 'cus_test_enterprise',
        lastLoginAt: new Date(),
      }
    })

    console.log('✅ Created test user:', testUser.id)

    // Create user profile
    await prisma.userProfile.upsert({
      where: { userId: testUser.id },
      update: {
        firstName: 'Test',
        lastName: 'User',
        businessSize: 'Enterprise',
        phone: '+1-555-0123',
        timezone: 'America/New_York',
      },
      create: {
        userId: testUser.id,
        firstName: 'Test',
        lastName: 'User',
        businessSize: 'Enterprise',
        phone: '+1-555-0123',
        timezone: 'America/New_York',
      }
    })

    // Create user preferences with all features enabled
    await prisma.userPreferences.upsert({
      where: { userId: testUser.id },
      update: {
        notifications: {
          email_updates: true,
          platform_alerts: true,
          market_intelligence: true,
          improvement_reminders: true,
          billing_updates: true
        },
        privacy: {
          data_sharing_analytics: true,
          data_sharing_marketing: true,
          public_profile: true
        },
        dashboard: {
          default_view: 'dashboard',
          chart_preferences: { theme: 'professional' }
        }
      },
      create: {
        userId: testUser.id,
        notifications: {
          email_updates: true,
          platform_alerts: true,
          market_intelligence: true,
          improvement_reminders: true,
          billing_updates: true
        },
        privacy: {
          data_sharing_analytics: true,
          data_sharing_marketing: true,
          public_profile: true
        },
        dashboard: {
          default_view: 'dashboard',
          chart_preferences: { theme: 'professional' }
        }
      }
    })

    // Create active subscription
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: 'sub_test_enterprise' },
      update: {
        status: 'ACTIVE',
        tier: 'ENTERPRISE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      create: {
        userId: testUser.id,
        stripeSubscriptionId: 'sub_test_enterprise',
        stripePriceId: 'price_test_enterprise',
        status: 'ACTIVE',
        tier: 'ENTERPRISE',
        billingCycle: 'ANNUAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    })

    // Create sample business evaluation
    const evaluation = await prisma.businessEvaluation.create({
      data: {
        userId: testUser.id,
        businessData: {
          revenue: 5000000,
          employees: 50,
          growth: 25,
          industry: 'Technology',
          businessModel: 'SaaS'
        },
        valuations: {
          current: 15000000,
          potential: 25000000,
          methodology: 'DCF + Comparable'
        },
        healthScore: 85.5,
        confidenceScore: 92.0,
        opportunities: [
          { category: 'Revenue Growth', impact: 'High', timeframe: '6 months' },
          { category: 'Operational Efficiency', impact: 'Medium', timeframe: '3 months' }
        ],
        status: 'COMPLETED'
      }
    })

    // Create implementation guide
    await prisma.implementationGuide.create({
      data: {
        userId: testUser.id,
        evaluationId: evaluation.id,
        improvementCategory: 'Revenue Growth',
        title: 'Expand Market Reach',
        description: 'Strategic plan to expand into new markets and increase revenue',
        industry: 'Technology',
        businessContext: {
          currentRevenue: 5000000,
          targetRevenue: 7500000,
          marketSize: 50000000
        },
        estimatedDuration: 240, // 240 hours
        difficultyLevel: 'ADVANCED',
        resourceRequirements: {
          budget: 250000,
          team: 5,
          external: true
        },
        templates: [
          { name: 'Market Analysis Template', type: 'spreadsheet' },
          { name: 'Go-to-Market Strategy', type: 'document' }
        ],
        steps: {
          create: [
            {
              stepNumber: 1,
              title: 'Market Research',
              description: 'Conduct comprehensive market analysis',
              estimatedTime: 480, // 8 hours
              difficulty: 'Intermediate',
              resources: ['Market research tools', 'Industry reports'],
              tips: ['Focus on target demographics', 'Analyze competitor strategies'],
              commonPitfalls: ['Insufficient sample size', 'Bias in data collection'],
              successMetrics: ['Market size validated', 'Customer personas defined']
            },
            {
              stepNumber: 2,
              title: 'Strategy Development',
              description: 'Develop comprehensive go-to-market strategy',
              estimatedTime: 360, // 6 hours
              difficulty: 'Advanced',
              resources: ['Strategy templates', 'Financial models'],
              tips: ['Align with business goals', 'Consider resource constraints'],
              commonPitfalls: ['Overly aggressive timelines', 'Underestimating costs'],
              successMetrics: ['Strategy document completed', 'Budget approved']
            }
          ]
        }
      }
    })

    // Create sample analytics data
    const analyticsData = [
      { metric: 'revenue', value: 5000000, category: 'PERFORMANCE', tags: ['monthly', 'recurring'] },
      { metric: 'health_score', value: 85.5, category: 'HEALTH_SCORE', tags: ['overall', 'current'] },
      { metric: 'valuation', value: 15000000, category: 'VALUATION', tags: ['current', 'enterprise'] },
      { metric: 'growth_rate', value: 25.0, category: 'PERFORMANCE', tags: ['annual', 'revenue'] }
    ]

    for (const data of analyticsData) {
      await prisma.analyticsData.create({
        data: {
          userId: testUser.id,
          metric: data.metric,
          value: data.value,
          timestamp: new Date(),
          category: data.category,
          tags: data.tags,
          metadata: { source: 'test_data', generated: true }
        }
      })
    }

    // Create market intelligence
    await prisma.marketIntelligence.create({
      data: {
        userId: testUser.id,
        industry: 'Technology',
        sector: 'SaaS',
        trendAnalysis: {
          growth: 'Strong',
          outlook: 'Positive',
          keyTrends: ['AI Integration', 'Remote Work Solutions', 'Data Security']
        },
        competitivePositioning: {
          rank: 'Top 25%',
          strengths: ['Innovation', 'Customer Service'],
          opportunities: ['Market Expansion', 'Product Diversification']
        },
        opportunities: [
          { type: 'Market', description: 'New geographic markets', priority: 'High' },
          { type: 'Product', description: 'AI-powered features', priority: 'Medium' }
        ],
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    // Create sample support ticket
    await prisma.supportTicket.create({
      data: {
        userId: testUser.id,
        subject: 'Feature Request - Advanced Analytics',
        description: 'Would love to see more detailed analytics on customer behavior patterns.',
        category: 'Feature Request',
        priority: 'MEDIUM',
        status: 'OPEN',
        subscriptionTier: 'ENTERPRISE'
      }
    })

    console.log('🎉 Admin test user setup completed!')
    console.log('📧 Email: admin@goodbuy.com')
    console.log('🔑 Password: any password (auth is simplified in dev)')
    console.log('🏢 Business: Test Business Corp')
    console.log('🎯 Role: SUPER_ADMIN')
    console.log('💎 Subscription: ENTERPRISE')
    console.log('📊 Features: All features enabled')
    console.log('🔧 Admin Panel: Access granted')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()