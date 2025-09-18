import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook event
  const { id } = evt.data
  const eventType = evt.type

  console.log(`Clerk Webhook: ${eventType} - ${id}`)

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break
      case 'user.updated':
        await handleUserUpdated(evt.data)
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break
      case 'session.created':
        console.log('New session created:', id)
        break
      case 'session.ended':
        console.log('Session ended:', id)
        break
      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = userData

  // Get primary email
  const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id)?.email_address

  if (!primaryEmail) {
    console.error('No primary email found for user:', id)
    return
  }

  try {
    // Create user in database with proper defaults
    await prisma.user.create({
      data: {
        clerkId: id,
        email: primaryEmail,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        imageUrl: image_url || null,
        subscriptionTier: public_metadata?.subscriptionTier || 'free',
        subscriptionStatus: public_metadata?.subscriptionStatus || 'active',
        stripeCustomerId: public_metadata?.stripeCustomerId || null,
        // Business fields will be filled during onboarding
        businessName: null,
        industry: null,
      },
    })

    console.log('User created in database:', id)
  } catch (error) {
    if ((error as any).code === 'P2002') {
      console.log('User already exists in database:', id)
    } else {
      console.error('Error creating user in database:', error)
      throw error
    }
  }
}

async function handleUserUpdated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = userData

  // Get primary email
  const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id)?.email_address

  try {
    // Update user in database
    const updateData: any = {
      email: primaryEmail,
      name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      imageUrl: image_url || null,
    }

    // Check if subscription metadata is present
    if (public_metadata?.subscriptionTier) {
      updateData.subscriptionTier = public_metadata.subscriptionTier
    }
    if (public_metadata?.subscriptionStatus) {
      updateData.subscriptionStatus = public_metadata.subscriptionStatus
    }

    await prisma.user.update({
      where: { clerkId: id },
      data: updateData,
    })

    console.log('User updated in database:', id)
  } catch (error) {
    console.error('Error updating user in database:', error)
    throw error
  }
}

async function handleUserDeleted(userData: any) {
  const { id } = userData

  try {
    // Soft delete or handle user deletion
    await prisma.user.update({
      where: { clerkId: id },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log('User soft-deleted in database:', id)
  } catch (error) {
    console.error('Error deleting user from database:', error)
    throw error
  }
}