import { UserProfileRepository } from '../repositories/UserProfileRepository'
import { UserPreferencesRepository } from '../repositories/UserPreferencesRepository'
import { SecuritySettingsRepository } from '../repositories/SecuritySettingsRepository'
import { UserProfile, UserPreferences, SecuritySettings, DataExportRequest } from '../../types'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma'
import rateLimit from 'express-rate-limit'

export interface AccountData {
  profile: UserProfile | null
  preferences: UserPreferences | null
  securitySettings: SecuritySettings | null
  user: {
    id: string
    email: string
    businessName: string
    industry: string
    role: string
    subscriptionTier: string
    createdAt: Date
    lastLoginAt: Date | null
  }
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  businessSize?: string
  timezone?: string
  language?: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

const PasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character')
})

// Rate limiting for sensitive operations
const passwordChangeLimit = new Map<string, { attempts: number; lastAttempt: number }>()

export class AccountService {
  private profileRepo = new UserProfileRepository()
  private preferencesRepo = new UserPreferencesRepository()
  private securityRepo = new SecuritySettingsRepository()

  async getAccountData(userId: string): Promise<AccountData> {
    // Get user basic info from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Get extended profile and settings
    const [profile, preferences, securitySettings] = await Promise.all([
      this.profileRepo.findByUserId(userId),
      this.preferencesRepo.findByUserId(userId),
      this.securityRepo.findByUserId(userId)
    ])

    return {
      profile,
      preferences,
      securitySettings,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        industry: user.industry,
        role: user.role.toLowerCase(),
        subscriptionTier: user.subscriptionTier.toLowerCase(),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<UserProfile> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided')
    }

    // Sanitize updates
    const sanitizedUpdates = this.sanitizeProfileUpdates(updates)
    
    // Check if profile exists, create if not
    let profile = await this.profileRepo.findByUserId(userId)
    
    if (!profile) {
      // Create new profile with defaults
      profile = await this.profileRepo.create({
        userId,
        firstName: updates.firstName,
        lastName: updates.lastName,
        phone: updates.phone,
        avatar: updates.avatar,
        businessSize: updates.businessSize,
        timezone: updates.timezone || 'UTC',
        language: updates.language || 'en'
      })
    } else {
      // Update existing profile
      profile = await this.profileRepo.update(userId, sanitizedUpdates)
    }

    return profile
  }

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    // Check if preferences exist, create if not
    let preferences = await this.preferencesRepo.findByUserId(userId)
    
    if (!preferences) {
      // Create new preferences with defaults
      const defaultPrefs = UserPreferencesRepository.getDefaultPreferences(userId)
      preferences = await this.preferencesRepo.create({
        ...defaultPrefs,
        ...updates
      })
    } else {
      // Update existing preferences
      preferences = await this.preferencesRepo.update(userId, updates)
    }

    return preferences
  }

  async updateNotificationPreferences(
    userId: string, 
    notifications: UserPreferences['notifications']
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepo.findByUserId(userId)
    
    if (!preferences) {
      const defaultPrefs = UserPreferencesRepository.getDefaultPreferences(userId)
      preferences = await this.preferencesRepo.create({
        ...defaultPrefs,
        notifications
      })
    } else {
      preferences = await this.preferencesRepo.updateNotifications(userId, notifications)
    }

    return preferences
  }

  async updatePrivacyPreferences(
    userId: string, 
    privacy: UserPreferences['privacy']
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepo.findByUserId(userId)
    
    if (!preferences) {
      const defaultPrefs = UserPreferencesRepository.getDefaultPreferences(userId)
      preferences = await this.preferencesRepo.create({
        ...defaultPrefs,
        privacy
      })
    } else {
      preferences = await this.preferencesRepo.updatePrivacy(userId, privacy)
    }

    return preferences
  }

  async changePassword(userId: string, request: PasswordChangeRequest): Promise<void> {
    // Rate limiting check
    const now = Date.now()
    const userLimit = passwordChangeLimit.get(userId)
    
    if (userLimit && userLimit.attempts >= 3 && now - userLimit.lastAttempt < 15 * 60 * 1000) {
      throw new Error('Too many password change attempts. Please try again in 15 minutes.')
    }

    // Input validation
    const validationResult = PasswordSchema.safeParse(request)
    if (!validationResult.success) {
      throw new Error(`Invalid password: ${validationResult.error.issues[0].message}`)
    }

    // Get current user password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Update rate limit
    passwordChangeLimit.set(userId, {
      attempts: (userLimit?.attempts || 0) + 1,
      lastAttempt: now
    })

    // In a real implementation, you would verify the current password
    // For now, we'll just hash and update the new password
    const hashedPassword = await bcrypt.hash(request.newPassword, 12)

    // Note: The User model doesn't have a password field in the current schema
    // In a real implementation, you would update the password field
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { password: hashedPassword }
    // })

    // Update security settings with password change timestamp
    await this.securityRepo.updatePasswordChangeTime(userId)
  }

  async initializeUserSettings(userId: string): Promise<{
    profile: UserProfile
    preferences: UserPreferences
    securitySettings: SecuritySettings
  }> {
    // Create default profile, preferences, and security settings for new users
    const [profile, preferences, securitySettings] = await Promise.all([
      this.profileRepo.create({
        userId,
        timezone: 'UTC',
        language: 'en'
      }),
      this.preferencesRepo.create(UserPreferencesRepository.getDefaultPreferences(userId)),
      this.securityRepo.create(SecuritySettingsRepository.getDefaultSettings(userId))
    ])

    return { profile, preferences, securitySettings }
  }

  async requestDataExport(userId: string, requestType: DataExportRequest['requestType']): Promise<DataExportRequest> {
    const request = await prisma.dataExportRequest.create({
      data: {
        userId,
        requestType: requestType.toUpperCase() as any,
        status: 'PENDING'
      }
    })

    // In a real implementation, you would trigger a background job to process the export
    // For now, we'll just return the request
    return {
      id: request.id,
      userId: request.userId,
      requestType: request.requestType.toLowerCase() as DataExportRequest['requestType'],
      status: request.status.toLowerCase() as DataExportRequest['status'],
      downloadUrl: request.downloadUrl,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
      completedAt: request.completedAt
    }
  }

  async getDataExportRequests(userId: string): Promise<DataExportRequest[]> {
    const requests = await prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return requests.map(request => ({
      id: request.id,
      userId: request.userId,
      requestType: request.requestType.toLowerCase() as DataExportRequest['requestType'],
      status: request.status.toLowerCase() as DataExportRequest['status'],
      downloadUrl: request.downloadUrl,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
      completedAt: request.completedAt
    }))
  }

  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      throw new Error('Invalid confirmation')
    }

    // In a real implementation, you would:
    // 1. Create a background job for data cleanup
    // 2. Cancel subscriptions
    // 3. Export final data if requested
    // 4. Soft delete or hard delete user data based on requirements

    // For now, we'll just delete the user record (cascading deletes will handle related data)
    await prisma.user.delete({
      where: { id: userId }
    })
  }

  async getUserDashboardPreferences(userId: string): Promise<UserPreferences['dashboard']> {
    const preferences = await this.preferencesRepo.findByUserId(userId)
    
    if (!preferences) {
      const defaultPrefs = UserPreferencesRepository.getDefaultPreferences(userId)
      return defaultPrefs.dashboard
    }

    return preferences.dashboard
  }

  async updateDashboardPreferences(
    userId: string, 
    dashboard: UserPreferences['dashboard']
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepo.findByUserId(userId)
    
    if (!preferences) {
      const defaultPrefs = UserPreferencesRepository.getDefaultPreferences(userId)
      preferences = await this.preferencesRepo.create({
        ...defaultPrefs,
        dashboard
      })
    } else {
      preferences = await this.preferencesRepo.updateDashboard(userId, dashboard)
    }

    return preferences
  }

  private sanitizeProfileUpdates(updates: ProfileUpdateData): ProfileUpdateData {
    const sanitized: ProfileUpdateData = {}
    
    if (updates.firstName) {
      sanitized.firstName = updates.firstName.trim().slice(0, 50)
    }
    if (updates.lastName) {
      sanitized.lastName = updates.lastName.trim().slice(0, 50)
    }
    if (updates.phone) {
      // Remove non-digit characters except + at the start
      sanitized.phone = updates.phone.replace(/[^\d+]/g, '').slice(0, 20)
    }
    if (updates.avatar) {
      // Basic URL validation
      try {
        new URL(updates.avatar)
        sanitized.avatar = updates.avatar
      } catch {
        throw new Error('Invalid avatar URL')
      }
    }
    if (updates.businessSize) {
      const validSizes = ['1-10', '11-50', '51-200', '201-1000', '1000+']
      if (validSizes.includes(updates.businessSize)) {
        sanitized.businessSize = updates.businessSize
      }
    }
    if (updates.timezone) {
      sanitized.timezone = updates.timezone.trim().slice(0, 50)
    }
    if (updates.language) {
      sanitized.language = updates.language.trim().slice(0, 10)
    }

    return sanitized
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.length < 1) {
      throw new Error('Invalid userId provided')
    }
  }
}