const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureTestUser() {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'testbroker@goodbuyhq.com' }
    })

    if (existingUser) {
      // Update existing user to Enterprise tier
      const testUser = await prisma.user.update({
        where: { email: 'testbroker@goodbuyhq.com' },
        data: {
          subscriptionTier: 'ENTERPRISE'
        }
      })
      console.log('✅ Test user updated:', testUser.email, 'with tier:', testUser.subscriptionTier)
    } else {
      // Try to create with minimal required fields only
      try {
        const testUser = await prisma.user.create({
          data: {
            id: 'd882e870-879b-4b93-8763-ba60b492a2ed',
            email: 'testbroker@goodbuyhq.com',
            subscriptionTier: 'ENTERPRISE'
          }
        })
        console.log('✅ Test user created:', testUser.email, 'with tier:', testUser.subscriptionTier)
      } catch (createError) {
        console.log('❌ Create failed, trying with all fields:', createError.message)
        // Fallback: try with all expected fields
        const testUser = await prisma.user.create({
          data: {
            id: 'd882e870-879b-4b93-8763-ba60b492a2ed',
            email: 'testbroker@goodbuyhq.com',
            businessName: 'Test Business Corp',
            industry: 'Technology',
            subscriptionTier: 'ENTERPRISE'
          }
        })
        console.log('✅ Test user created with full fields:', testUser.email, 'with tier:', testUser.subscriptionTier)
      }
    }

    // Also ensure admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@goodbuyhq.com' }
    })

    if (existingAdmin) {
      const adminUser = await prisma.user.update({
        where: { email: 'admin@goodbuyhq.com' },
        data: {
          subscriptionTier: 'ENTERPRISE',
          userRole: 'admin'
        }
      })
      console.log('✅ Admin user updated:', adminUser.email, 'with tier:', adminUser.subscriptionTier)
    } else {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@goodbuyhq.com',
          businessName: 'GoodBuy HQ',
          industry: 'Technology',
          subscriptionTier: 'ENTERPRISE',
          userRole: 'admin'
        }
      })
      console.log('✅ Admin user created:', adminUser.email, 'with tier:', adminUser.subscriptionTier)
    }

  } catch (error) {
    console.error('❌ Error ensuring test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureTestUser()