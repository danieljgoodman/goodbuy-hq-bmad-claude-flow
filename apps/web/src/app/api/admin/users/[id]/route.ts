import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { prisma } from '@/lib/prisma'

// Admin middleware for role validation
async function validateAdminAccess() {
  const user = await getServerAuth()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, userRole: user.role }
}

// Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Admin user update API called for user:', params.id)

    // Authentication check
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    const body = await request.json()
    const { subscriptionTier, userRole } = body

    console.log('📝 Updating user profile:', { userId: params.id, subscriptionTier, userRole })

    // Update user profile using raw SQL with proper UUID casting
    const updateQuery = `
      UPDATE public.user_profiles 
      SET 
        subscription_tier = $1,
        user_role = $2,
        updated_at = NOW()
      WHERE user_id = $3::uuid
      RETURNING *
    `

    const result = await prisma.$queryRawUnsafe(
      updateQuery, 
      subscriptionTier, 
      userRole, 
      params.id
    )

    const updatedProfile = (result as any[])[0]

    if (!updatedProfile) {
      // If no profile exists, create one
      const createQuery = `
        INSERT INTO public.user_profiles (user_id, subscription_tier, user_role)
        VALUES ($1::uuid, $2, $3)
        RETURNING *
      `
      
      const createResult = await prisma.$queryRawUnsafe(
        createQuery,
        params.id,
        subscriptionTier,
        userRole
      )
      
      const createdProfile = (createResult as any[])[0]
      console.log('✅ Created new user profile:', createdProfile)
      
      return NextResponse.json({
        user: {
          id: params.id,
          subscriptionTier: createdProfile.subscription_tier,
          userRole: createdProfile.user_role
        }
      })
    }

    console.log('✅ Updated user profile successfully')

    return NextResponse.json({
      user: {
        id: params.id,
        subscriptionTier: updatedProfile.subscription_tier,
        userRole: updatedProfile.user_role
      }
    })

  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
