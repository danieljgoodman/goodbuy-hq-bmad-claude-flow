// Admin Account Setup Script
// Run with: node scripts/setup-admin.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAdminAccount() {
  try {
    console.log('🚀 Setting up admin account...')
    
    const adminEmail = 'admin@goodbuyhq.com'
    
    // Find the admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { subscriptions: true }
    })
    
    if (!adminUser) {
      console.log(`❌ Admin user ${adminEmail} not found. Please register first.`)
      return
    }
    
    console.log(`✅ Found admin user: ${adminUser.email}`)
    
    // Update user to premium tier
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        subscriptionTier: 'PREMIUM',
        lastLoginAt: new Date()
      }
    })
    
    console.log('✅ Updated user subscription tier to PREMIUM')
    
    // Create or update premium subscription
    const existingSubscription = adminUser.subscriptions[0]
    
    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'ACTIVE',
          tier: 'PREMIUM',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
          cancelledAt: null
        }
      })
      console.log('✅ Updated existing subscription to PREMIUM ACTIVE')
    } else {
      // Create new premium subscription
      await prisma.subscription.create({
        data: {
          userId: adminUser.id,
          stripeSubscriptionId: `admin_sub_${Date.now()}`, // Fake ID for admin
          stripePriceId: 'price_admin_premium',
          status: 'ACTIVE',
          tier: 'PREMIUM',
          billingCycle: 'YEARLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          cancelAtPeriodEnd: false
        }
      })
      console.log('✅ Created new PREMIUM subscription')
    }
    
    console.log('\n🎉 Admin account setup complete!')
    console.log('\n📊 Account Summary:')
    console.log(`Email: ${adminUser.email}`)
    console.log(`Subscription Tier: PREMIUM`)
    console.log(`Status: ACTIVE`)
    console.log(`Access: ALL PREMIUM FEATURES + ADMIN DASHBOARD`)
    
    console.log('\n🔓 Premium Features Available:')
    console.log('- /guides - AI Implementation Guides')
    console.log('- /analytics - Advanced Analytics & Forecasting')
    console.log('- /benchmarking - Industry Benchmarking')  
    console.log('- /reports - Professional PDF Reports')
    console.log('- /support - Priority Support (2hr SLA)')
    console.log('- /admin - Admin Dashboard & Platform Management')
    
  } catch (error) {
    console.error('❌ Error setting up admin account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdminAccount()