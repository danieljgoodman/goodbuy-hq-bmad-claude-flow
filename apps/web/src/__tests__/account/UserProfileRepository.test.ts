import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UserProfileRepository } from '../../lib/repositories/UserProfileRepository'
import { UserProfile } from '../../types'

// Mock Prisma
const mockPrisma = {
  userProfile: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn()
  }
}

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('UserProfileRepository', () => {
  let repository: UserProfileRepository

  const mockProfileData = {
    id: 'profile-123',
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    businessSize: '11-50',
    timezone: 'UTC',
    language: 'en',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-09')
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new UserProfileRepository()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findByUserId', () => {
    it('should return user profile when found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfileData)

      const result = await repository.findByUserId('user-123')

      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
      expect(result).toEqual(mockProfileData)
    })

    it('should return null when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)

      const result = await repository.findByUserId('user-456')

      expect(result).toBeNull()
    })

    it('should validate userId parameter', async () => {
      await expect(repository.findByUserId('')).rejects.toThrow('userId is required')
      await expect(repository.findByUserId(null as any)).rejects.toThrow('userId is required')
      await expect(repository.findByUserId(undefined as any)).rejects.toThrow('userId is required')
    })
  })

  describe('create', () => {
    it('should create new user profile', async () => {
      const createData = {
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321',
        avatar: 'https://example.com/jane.jpg',
        businessSize: '51-200',
        timezone: 'America/New_York',
        language: 'en'
      }

      mockPrisma.userProfile.create.mockResolvedValue({
        id: 'profile-456',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await repository.create(createData)

      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: createData
      })
      expect(result.id).toBe('profile-456')
      expect(result.firstName).toBe('Jane')
    })

    it('should validate required userId', async () => {
      const invalidData = {
        userId: '',
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'UTC',
        language: 'en'
      }

      await expect(repository.create(invalidData)).rejects.toThrow('userId is required')
    })

    it('should handle optional fields', async () => {
      const minimalData = {
        userId: 'user-123',
        timezone: 'UTC',
        language: 'en'
      }

      mockPrisma.userProfile.create.mockResolvedValue({
        id: 'profile-789',
        ...minimalData,
        firstName: null,
        lastName: null,
        phone: null,
        avatar: null,
        businessSize: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await repository.create(minimalData)

      expect(result.userId).toBe('user-123')
      expect(result.firstName).toBeNull()
    })
  })

  describe('update', () => {
    it('should update existing profile', async () => {
      const updates = {
        firstName: 'Updated John',
        businessSize: '201-1000',
        timezone: 'Europe/London'
      }

      mockPrisma.userProfile.update.mockResolvedValue({
        ...mockProfileData,
        ...updates,
        updatedAt: new Date()
      })

      const result = await repository.update('user-123', updates)

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: updates
      })
      expect(result.firstName).toBe('Updated John')
      expect(result.businessSize).toBe('201-1000')
    })

    it('should validate userId parameter', async () => {
      await expect(repository.update('', { firstName: 'Test' }))
        .rejects.toThrow('userId is required')
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { phone: '+1555123456' }

      mockPrisma.userProfile.update.mockResolvedValue({
        ...mockProfileData,
        ...partialUpdate
      })

      const result = await repository.update('user-123', partialUpdate)

      expect(result.phone).toBe('+1555123456')
      expect(result.firstName).toBe(mockProfileData.firstName) // Unchanged
    })
  })

  describe('upsert', () => {
    it('should create profile if it does not exist', async () => {
      const upsertData = {
        userId: 'user-new',
        firstName: 'New',
        lastName: 'User',
        timezone: 'UTC',
        language: 'en'
      }

      mockPrisma.userProfile.upsert.mockResolvedValue({
        id: 'profile-new',
        ...upsertData,
        phone: null,
        avatar: null,
        businessSize: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await repository.upsert(upsertData)

      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-new' },
        update: {
          firstName: 'New',
          lastName: 'User',
          phone: undefined,
          avatar: undefined,
          businessSize: undefined,
          timezone: 'UTC',
          language: 'en'
        },
        create: upsertData
      })
      expect(result.firstName).toBe('New')
    })

    it('should update profile if it exists', async () => {
      const upsertData = {
        userId: 'user-123',
        firstName: 'Updated',
        lastName: 'Name',
        timezone: 'UTC',
        language: 'en'
      }

      mockPrisma.userProfile.upsert.mockResolvedValue({
        ...mockProfileData,
        firstName: 'Updated',
        lastName: 'Name'
      })

      const result = await repository.upsert(upsertData)

      expect(result.firstName).toBe('Updated')
      expect(result.userId).toBe('user-123')
    })
  })

  describe('delete', () => {
    it('should delete user profile', async () => {
      mockPrisma.userProfile.delete.mockResolvedValue(mockProfileData)

      await repository.delete('user-123')

      expect(mockPrisma.userProfile.delete).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })

    it('should handle deletion errors', async () => {
      const deleteError = new Error('Record not found')
      mockPrisma.userProfile.delete.mockRejectedValue(deleteError)

      await expect(repository.delete('user-non-existent'))
        .rejects.toThrow('Record not found')
    })
  })

  describe('findAll', () => {
    it('should return all profiles ordered by creation date', async () => {
      const multipleProfiles = [
        { ...mockProfileData, id: 'profile-1', userId: 'user-1' },
        { ...mockProfileData, id: 'profile-2', userId: 'user-2' },
        { ...mockProfileData, id: 'profile-3', userId: 'user-3' }
      ]

      mockPrisma.userProfile.findMany.mockResolvedValue(multipleProfiles)

      const result = await repository.findAll()

      expect(mockPrisma.userProfile.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('profile-1')
    })

    it('should return empty array when no profiles exist', async () => {
      mockPrisma.userProfile.findMany.mockResolvedValue([])

      const result = await repository.findAll()

      expect(result).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.userProfile.findUnique.mockRejectedValue(dbError)

      await expect(repository.findByUserId('user-123'))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation')
      mockPrisma.userProfile.create.mockRejectedValue(constraintError)

      const createData = {
        userId: 'user-123',
        timezone: 'UTC',
        language: 'en'
      }

      await expect(repository.create(createData))
        .rejects.toThrow('Unique constraint violation')
    })
  })

  describe('data transformation', () => {
    it('should correctly transform database record to profile object', async () => {
      const dbRecord = {
        id: 'profile-123',
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatar: 'https://example.com/avatar.jpg',
        businessSize: '11-50',
        timezone: 'UTC',
        language: 'en',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-09-09T12:00:00Z')
      }

      mockPrisma.userProfile.findUnique.mockResolvedValue(dbRecord)

      const result = await repository.findByUserId('user-123')

      expect(result).toEqual({
        id: 'profile-123',
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatar: 'https://example.com/avatar.jpg',
        businessSize: '11-50',
        timezone: 'UTC',
        language: 'en',
        createdAt: dbRecord.createdAt,
        updatedAt: dbRecord.updatedAt
      })
    })

    it('should handle null values correctly', async () => {
      const dbRecordWithNulls = {
        id: 'profile-123',
        userId: 'user-123',
        firstName: null,
        lastName: null,
        phone: null,
        avatar: null,
        businessSize: null,
        timezone: 'UTC',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.userProfile.findUnique.mockResolvedValue(dbRecordWithNulls)

      const result = await repository.findByUserId('user-123')

      expect(result?.firstName).toBeNull()
      expect(result?.lastName).toBeNull()
      expect(result?.phone).toBeNull()
      expect(result?.timezone).toBe('UTC')
    })
  })
})