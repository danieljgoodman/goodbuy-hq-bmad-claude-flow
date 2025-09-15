import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AccountService, ProfileUpdateData, PasswordChangeRequest } from '../../lib/services/AccountService'
import { UserProfileRepository } from '../../lib/repositories/UserProfileRepository'
import { UserPreferencesRepository } from '../../lib/repositories/UserPreferencesRepository'
import { SecuritySettingsRepository } from '../../lib/repositories/SecuritySettingsRepository'
import bcrypt from 'bcryptjs'

// Mock the repositories
vi.mock('../../lib/repositories/UserProfileRepository')
vi.mock('../../lib/repositories/UserPreferencesRepository')
vi.mock('../../lib/repositories/SecuritySettingsRepository')

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true)
  }
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    delete: vi.fn()
  },
  dataExportRequest: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('AccountService', () => {
  let service: AccountService
  let mockProfileRepo: vi.Mocked<UserProfileRepository>
  let mockPreferencesRepo: vi.Mocked<UserPreferencesRepository>
  let mockSecurityRepo: vi.Mocked<SecuritySettingsRepository>

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    businessName: 'Test Business',
    industry: 'Technology',
    role: 'OWNER',
    subscriptionTier: 'PREMIUM',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-09-09')
  }

  const mockProfile = {
    id: 'profile-123',
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    businessSize: '11-50',
    timezone: 'UTC',
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockPreferences = {
    id: 'pref-123',
    userId: 'user-123',
    notifications: {
      email_updates: true,
      platform_alerts: true,
      market_intelligence: false,
      improvement_reminders: true,
      billing_updates: true
    },
    privacy: {
      data_sharing_analytics: false,
      data_sharing_marketing: false,
      public_profile: false
    },
    dashboard: {
      default_view: 'overview',
      chart_preferences: {}
    },
    updatedAt: new Date()
  }

  const mockSecuritySettings = {
    id: 'security-123',
    userId: 'user-123',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    loginNotifications: true,
    trustedDevices: [],
    sessionTimeout: 30,
    lastPasswordChange: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    service = new AccountService()
    
    mockProfileRepo = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn()
    } as any

    mockPreferencesRepo = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateNotifications: vi.fn(),
      updatePrivacy: vi.fn(),
      updateDashboard: vi.fn()
    } as any

    mockSecurityRepo = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      updatePasswordChangeTime: vi.fn()
    } as any

    // Replace repository instances
    service['profileRepo'] = mockProfileRepo
    service['preferencesRepo'] = mockPreferencesRepo
    service['securityRepo'] = mockSecurityRepo

    // Setup default mocks
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAccountData', () => {
    it('should return complete account data for existing user', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(mockProfile)
      mockPreferencesRepo.findByUserId.mockResolvedValue(mockPreferences)
      mockSecurityRepo.findByUserId.mockResolvedValue(mockSecuritySettings)

      const result = await service.getAccountData('user-123')

      expect(result).toEqual({
        profile: mockProfile,
        preferences: mockPreferences,
        securitySettings: mockSecuritySettings,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          businessName: 'Test Business',
          industry: 'Technology',
          role: 'owner',
          subscriptionTier: 'premium',
          createdAt: mockUser.createdAt,
          lastLoginAt: mockUser.lastLoginAt
        }
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      })
    })

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(service.getAccountData('non-existent')).rejects.toThrow('User not found')
    })

    it('should handle missing profile/preferences gracefully', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(null)
      mockPreferencesRepo.findByUserId.mockResolvedValue(null)
      mockSecurityRepo.findByUserId.mockResolvedValue(null)

      const result = await service.getAccountData('user-123')

      expect(result.profile).toBeNull()
      expect(result.preferences).toBeNull()
      expect(result.securitySettings).toBeNull()
      expect(result.user).toBeDefined()
    })
  })

  describe('updateProfile', () => {
    it('should create new profile if none exists', async () => {
      const updates: ProfileUpdateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321'
      }

      mockProfileRepo.findByUserId.mockResolvedValue(null)
      mockProfileRepo.create.mockResolvedValue({ ...mockProfile, ...updates })

      const result = await service.updateProfile('user-123', updates)

      expect(mockProfileRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321',
        avatar: undefined,
        businessSize: undefined,
        timezone: 'UTC',
        language: 'en'
      })
      expect(result.firstName).toBe('Jane')
    })

    it('should update existing profile', async () => {
      const updates: ProfileUpdateData = {
        firstName: 'Jane',
        businessSize: '51-200'
      }

      mockProfileRepo.findByUserId.mockResolvedValue(mockProfile)
      mockProfileRepo.update.mockResolvedValue({ ...mockProfile, ...updates })

      const result = await service.updateProfile('user-123', updates)

      expect(mockProfileRepo.update).toHaveBeenCalledWith('user-123', {
        firstName: 'Jane',
        businessSize: '51-200'
      })
      expect(result.firstName).toBe('Jane')
      expect(result.businessSize).toBe('51-200')
    })

    it('should sanitize and validate profile updates', async () => {
      const maliciousUpdates: ProfileUpdateData = {
        firstName: '  John  <script>alert("xss")</script>  ',
        phone: 'abc-123-456-789-def',
        avatar: 'not-a-url',
        businessSize: 'invalid-size' as any
      }

      mockProfileRepo.findByUserId.mockResolvedValue(mockProfile)

      await expect(service.updateProfile('user-123', maliciousUpdates))
        .rejects.toThrow('Invalid avatar URL')
    })

    it('should handle valid phone number formatting', async () => {
      const updates: ProfileUpdateData = {
        phone: '+1 (555) 123-4567'
      }

      mockProfileRepo.findByUserId.mockResolvedValue(mockProfile)
      mockProfileRepo.update.mockResolvedValue({ ...mockProfile, phone: '+15551234567' })

      await service.updateProfile('user-123', updates)

      expect(mockProfileRepo.update).toHaveBeenCalledWith('user-123', {
        phone: '+15551234567'
      })
    })
  })

  describe('updateNotificationPreferences', () => {
    it('should create preferences if they do not exist', async () => {
      const notifications = {
        email_updates: false,
        platform_alerts: true,
        market_intelligence: true,
        improvement_reminders: false,
        billing_updates: true
      }

      mockPreferencesRepo.findByUserId.mockResolvedValue(null)
      UserPreferencesRepository.getDefaultPreferences = vi.fn().mockReturnValue({
        userId: 'user-123',
        notifications: {
          email_updates: true,
          platform_alerts: true,
          market_intelligence: false,
          improvement_reminders: true,
          billing_updates: true
        },
        privacy: mockPreferences.privacy,
        dashboard: mockPreferences.dashboard
      })
      mockPreferencesRepo.create.mockResolvedValue({ ...mockPreferences, notifications })

      const result = await service.updateNotificationPreferences('user-123', notifications)

      expect(mockPreferencesRepo.create).toHaveBeenCalled()
      expect(result.notifications).toEqual(notifications)
    })

    it('should update existing preferences', async () => {
      const notifications = {
        email_updates: false,
        platform_alerts: false,
        market_intelligence: true,
        improvement_reminders: false,
        billing_updates: false
      }

      mockPreferencesRepo.findByUserId.mockResolvedValue(mockPreferences)
      mockPreferencesRepo.updateNotifications.mockResolvedValue({
        ...mockPreferences,
        notifications
      })

      const result = await service.updateNotificationPreferences('user-123', notifications)

      expect(mockPreferencesRepo.updateNotifications).toHaveBeenCalledWith('user-123', notifications)
      expect(result.notifications).toEqual(notifications)
    })
  })

  describe('changePassword', () => {
    it('should change password with valid input', async () => {
      const request: PasswordChangeRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'NewPassword456@'
      }

      mockSecurityRepo.updatePasswordChangeTime.mockResolvedValue(undefined)

      await service.changePassword('user-123', request)

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456@', 12)
      expect(mockSecurityRepo.updatePasswordChangeTime).toHaveBeenCalledWith('user-123')
    })

    it('should reject weak passwords', async () => {
      const request: PasswordChangeRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'weak'
      }

      await expect(service.changePassword('user-123', request))
        .rejects.toThrow('Invalid password')
    })

    it('should enforce rate limiting', async () => {
      const request: PasswordChangeRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'NewPassword456@'
      }

      // First 3 attempts should work
      await service.changePassword('user-123', request)
      await service.changePassword('user-123', request)
      await service.changePassword('user-123', request)

      // 4th attempt should be rate limited
      await expect(service.changePassword('user-123', request))
        .rejects.toThrow('Too many password change attempts')
    })

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request: PasswordChangeRequest = {
        currentPassword: 'oldPassword123!',
        newPassword: 'NewPassword456@'
      }

      await expect(service.changePassword('user-123', request))
        .rejects.toThrow('User not found')
    })
  })

  describe('requestDataExport', () => {
    it('should create data export request', async () => {
      const mockRequest = {
        id: 'export-123',
        userId: 'user-123',
        requestType: 'FULL',
        status: 'PENDING',
        downloadUrl: null,
        expiresAt: null,
        createdAt: new Date(),
        completedAt: null
      }

      mockPrisma.dataExportRequest.create.mockResolvedValue(mockRequest)

      const result = await service.requestDataExport('user-123', 'full')

      expect(mockPrisma.dataExportRequest.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          requestType: 'FULL',
          status: 'PENDING'
        }
      })

      expect(result.requestType).toBe('full')
      expect(result.status).toBe('pending')
    })
  })

  describe('deleteAccount', () => {
    it('should delete account with correct confirmation', async () => {
      await service.deleteAccount('user-123', 'DELETE_MY_ACCOUNT')

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      })
    })

    it('should reject deletion with incorrect confirmation', async () => {
      await expect(service.deleteAccount('user-123', 'wrong confirmation'))
        .rejects.toThrow('Invalid confirmation')

      expect(mockPrisma.user.delete).not.toHaveBeenCalled()
    })
  })

  describe('initializeUserSettings', () => {
    it('should create default settings for new user', async () => {
      mockProfileRepo.create.mockResolvedValue(mockProfile)
      mockPreferencesRepo.create.mockResolvedValue(mockPreferences)
      mockSecurityRepo.create.mockResolvedValue(mockSecuritySettings)

      UserPreferencesRepository.getDefaultPreferences = vi.fn().mockReturnValue(mockPreferences)
      SecuritySettingsRepository.getDefaultSettings = vi.fn().mockReturnValue(mockSecuritySettings)

      const result = await service.initializeUserSettings('user-123')

      expect(result.profile).toEqual(mockProfile)
      expect(result.preferences).toEqual(mockPreferences)
      expect(result.securitySettings).toEqual(mockSecuritySettings)

      expect(mockProfileRepo.create).toHaveBeenCalled()
      expect(mockPreferencesRepo.create).toHaveBeenCalled()
      expect(mockSecurityRepo.create).toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('should validate userId format', async () => {
      await expect(service.getAccountData('')).rejects.toThrow()
      await expect(service.getAccountData(null as any)).rejects.toThrow()
      await expect(service.getAccountData(undefined as any)).rejects.toThrow()
    })

    it('should sanitize string inputs', async () => {
      const maliciousProfile: ProfileUpdateData = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'O\'Malley',
        phone: '555-123-4567'
      }

      // Should sanitize but not throw for XSS attempts in name fields
      mockProfileRepo.findByUserId.mockResolvedValue(mockProfile)
      mockProfileRepo.update.mockResolvedValue({ ...mockProfile, ...maliciousProfile })

      const result = await service.updateProfile('user-123', maliciousProfile)

      // Verify sanitization occurred
      expect(mockProfileRepo.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        firstName: expect.not.stringContaining('<script>'),
        phone: '5551234567'
      }))
    })
  })
})