import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PATCH } from '@/app/api/admin/users/route'
import { GET as GET_USER, PATCH as PATCH_USER } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn()
    },
    userAdminAction: {
      create: vi.fn()
    }
  }
}))

const { getServerSession } = await import('next-auth')
const { prisma } = await import('@/lib/prisma')

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/users', () => {
    it('should return users list for admin user', async () => {
      // Mock admin session
      ;(getServerSession as any).mockResolvedValue({
        user: { id: 'admin-id', email: 'admin@test.com' }
      })

      // Mock admin user lookup
      ;(prisma.user.findUnique as any).mockResolvedValue({
        userRole: 'admin'
      })

      // Mock users query
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          businessName: 'Test Business',
          industry: 'Tech',
          subscriptionTier: 'FREE',
          userRole: 'user',
          createdAt: new Date(),
          lastLoginAt: new Date()
        }
      ];

      ;(prisma.user.findMany as any).mockResolvedValue(mockUsers)
      ;(prisma.user.count as any).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=50')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should deny access for non-admin user', async () => {
      // Mock regular user session
      ;(getServerSession as any).mockResolvedValue({
        user: { id: 'user-id', email: 'user@test.com' }
      })

      // Mock regular user lookup
      ;(prisma.user.findUnique as any).mockResolvedValue({
        userRole: 'user'
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should deny access for unauthenticated user', async () => {
      ;(getServerSession as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/admin/users/[id]', () => {
    it('should update user subscription tier for admin', async () => {
      // Mock admin session
      ;(getServerSession as any).mockResolvedValue({
        user: { id: 'admin-id', email: 'admin@test.com' }
      })

      // Mock admin user lookup
      ;(prisma.user.findUnique as any)
        .mockResolvedValueOnce({ userRole: 'admin' }) // Admin validation
        .mockResolvedValueOnce({ // Current user data
          id: 'user-1',
          email: 'user1@test.com',
          subscriptionTier: 'FREE',
          userRole: 'user'
        })

      // Mock user update
      const updatedUser = {
        id: 'user-1',
        email: 'user1@test.com',
        businessName: 'Test Business',
        industry: 'Tech',
        subscriptionTier: 'PREMIUM',
        userRole: 'user',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      ;(prisma.user.update as any).mockResolvedValue(updatedUser)
      ;(prisma.userAdminAction.create as any).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ subscriptionTier: 'PREMIUM' })
      })

      const response = await PATCH_USER(request, { params: { id: 'user-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.subscriptionTier).toBe('PREMIUM')
      expect(prisma.userAdminAction.create).toHaveBeenCalled()
    })

    it('should allow super_admin to update user roles', async () => {
      // Mock super admin session
      ;(getServerSession as any).mockResolvedValue({
        user: { id: 'super-admin-id', email: 'superadmin@test.com' }
      })

      // Mock super admin user lookup
      ;(prisma.user.findUnique as any)
        .mockResolvedValueOnce({ userRole: 'super_admin' }) // Admin validation
        .mockResolvedValueOnce({ // Current user data
          id: 'user-1',
          email: 'user1@test.com',
          subscriptionTier: 'FREE',
          userRole: 'user'
        })

      // Mock user update
      const updatedUser = {
        id: 'user-1',
        email: 'user1@test.com',
        businessName: 'Test Business',
        industry: 'Tech',
        subscriptionTier: 'FREE',
        userRole: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      ;(prisma.user.update as any).mockResolvedValue(updatedUser)
      ;(prisma.userAdminAction.create as any).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ userRole: 'admin' })
      })

      const response = await PATCH_USER(request, { params: { id: 'user-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.userRole).toBe('admin')
    })

    it('should deny role change for regular admin', async () => {
      // Mock admin session
      ;(getServerSession as any).mockResolvedValue({
        user: { id: 'admin-id', email: 'admin@test.com' }
      })

      // Mock admin user lookup
      ;(prisma.user.findUnique as any).mockResolvedValue({
        userRole: 'admin'
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ userRole: 'admin' })
      })

      const response = await PATCH_USER(request, { params: { id: 'user-1' } })

      expect(response.status).toBe(403)
    })
  })
})