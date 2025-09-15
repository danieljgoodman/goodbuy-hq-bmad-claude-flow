const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureTestUser() {
  try {
    // Use raw SQL to avoid schema issues
    console.log('🔍 Checking if test user exists...')
    
    const existing = await prisma.$queryRaw`
      SELECT id, email, "subscriptionTier" FROM "User" 
      WHERE email = 'testbroker@goodbuyhq.com'
    `
    
    if (existing.length > 0) {
      console.log('✅ Test user exists:', existing[0])
      
      // Update to Enterprise if not already
      if (existing[0].subscriptionTier !== 'ENTERPRISE') {
        await prisma.$executeRaw`
          UPDATE "User" 
          SET "subscriptionTier" = 'ENTERPRISE'
          WHERE email = 'testbroker@goodbuyhq.com'
        `
        console.log('✅ Updated test user to ENTERPRISE tier')
      }
    } else {
      console.log('❌ Test user does not exist')
      console.log('🔍 Checking database schema...')
      
      // Check what columns exist in User table
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'User'
        ORDER BY ordinal_position
      `
      
      console.log('📋 User table columns:', columns)
      
      // Try to create the user with minimal fields
      try {
        await prisma.$executeRaw`
          INSERT INTO "User" (id, email, "subscriptionTier")
          VALUES ('d882e870-879b-4b93-8763-ba60b492a2ed', 'testbroker@goodbuyhq.com', 'ENTERPRISE')
        `
        console.log('✅ Created test user with minimal fields')
      } catch (insertError) {
        console.log('❌ Insert failed:', insertError.message)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

ensureTestUser()