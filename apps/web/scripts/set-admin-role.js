#!/usr/bin/env node

/**
 * Script to set admin role for a Clerk user
 * Usage: node set-admin-role.js <user-email>
 */

const { Clerk } = require('@clerk/backend')

// Get Clerk secret key from environment
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_P5SLFUf9FmR2Yvxe3B8LwczuOPRkpCUPcHg4DgOXEP'

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY not found in environment')
  process.exit(1)
}

const clerk = Clerk({ secretKey: CLERK_SECRET_KEY })

async function setAdminRole(email) {
  try {
    // Find user by email
    console.log(`🔍 Searching for user with email: ${email}`)
    const users = await clerk.users.getUserList({
      emailAddress: [email]
    })

    if (users.length === 0) {
      console.error(`❌ No user found with email: ${email}`)
      return
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.id})`)

    // Update user metadata to set admin role
    const updatedUser = await clerk.users.updateUserMetadata(user.id, {
      privateMetadata: {
        ...user.privateMetadata,
        role: 'admin',
        subscriptionTier: 'ENTERPRISE'
      },
      publicMetadata: {
        ...user.publicMetadata,
        isAdmin: true
      }
    })

    console.log(`✅ Successfully set admin role for user ${email}`)
    console.log('📝 Updated metadata:', {
      role: updatedUser.privateMetadata?.role,
      subscriptionTier: updatedUser.privateMetadata?.subscriptionTier,
      isAdmin: updatedUser.publicMetadata?.isAdmin
    })

  } catch (error) {
    console.error('❌ Error setting admin role:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.log('Usage: node set-admin-role.js <user-email>')
  console.log('Example: node set-admin-role.js admin@goodbuyhq.com')
  process.exit(1)
}

setAdminRole(email)