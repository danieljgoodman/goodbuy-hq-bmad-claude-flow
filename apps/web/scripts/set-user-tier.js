#!/usr/bin/env node

/**
 * Script to set user subscription tier for testing
 * Usage: node scripts/set-user-tier.js <userId> <tier>
 * Example: node scripts/set-user-tier.js user_123abc professional
 */

const { Clerk } = require('@clerk/backend')

// Initialize Clerk with your secret key
const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY
})

async function setUserTier(userId, tier = 'professional') {
  try {
    if (!userId) {
      console.error('❌ User ID is required')
      console.log('Usage: node scripts/set-user-tier.js <userId> <tier>')
      console.log('Tiers: free, professional, enterprise')
      process.exit(1)
    }

    const validTiers = ['free', 'professional', 'enterprise']
    if (!validTiers.includes(tier)) {
      console.error(`❌ Invalid tier: ${tier}`)
      console.log('Valid tiers: free, professional, enterprise')
      process.exit(1)
    }

    console.log(`🔄 Setting user ${userId} to ${tier} tier...`)

    // Update user metadata in Clerk
    const user = await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        testMode: true,
        testSetAt: new Date().toISOString()
      }
    })

    console.log(`✅ Success! User ${userId} is now on ${tier} tier`)
    console.log('Public metadata:', user.publicMetadata)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Get arguments from command line
const [,, userId, tier = 'professional'] = process.argv

// Run the script
setUserTier(userId, tier)