import { prisma } from '../prisma'
import { SecuritySettings, TrustedDevice } from '../../types'

export class SecuritySettingsRepository {
  async findByUserId(userId: string): Promise<SecuritySettings | null> {
    const record = await prisma.securitySettings.findUnique({
      where: { userId }
    })

    if (!record) return null

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async create(settings: Omit<SecuritySettings, 'id' | 'updatedAt'>): Promise<SecuritySettings> {
    const record = await prisma.securitySettings.create({
      data: {
        userId: settings.userId,
        twoFactorEnabled: settings.twoFactorEnabled,
        twoFactorSecret: settings.twoFactorSecret,
        backupCodes: settings.backupCodes,
        loginNotifications: settings.loginNotifications,
        trustedDevices: settings.trustedDevices,
        sessionTimeout: settings.sessionTimeout,
        lastPasswordChange: settings.lastPasswordChange
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async update(userId: string, updates: Partial<Omit<SecuritySettings, 'id' | 'userId' | 'updatedAt'>>): Promise<SecuritySettings> {
    const record = await prisma.securitySettings.update({
      where: { userId },
      data: updates
    })

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async upsert(settings: Omit<SecuritySettings, 'id' | 'updatedAt'>): Promise<SecuritySettings> {
    const record = await prisma.securitySettings.upsert({
      where: { userId: settings.userId },
      update: {
        twoFactorEnabled: settings.twoFactorEnabled,
        twoFactorSecret: settings.twoFactorSecret,
        backupCodes: settings.backupCodes,
        loginNotifications: settings.loginNotifications,
        trustedDevices: settings.trustedDevices,
        sessionTimeout: settings.sessionTimeout,
        lastPasswordChange: settings.lastPasswordChange
      },
      create: {
        userId: settings.userId,
        twoFactorEnabled: settings.twoFactorEnabled,
        twoFactorSecret: settings.twoFactorSecret,
        backupCodes: settings.backupCodes,
        loginNotifications: settings.loginNotifications,
        trustedDevices: settings.trustedDevices,
        sessionTimeout: settings.sessionTimeout,
        lastPasswordChange: settings.lastPasswordChange
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async enableTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<SecuritySettings> {
    const record = await prisma.securitySettings.update({
      where: { userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async disableTwoFactor(userId: string): Promise<SecuritySettings> {
    const record = await prisma.securitySettings.update({
      where: { userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret,
      backupCodes: record.backupCodes as string[] | undefined,
      loginNotifications: record.loginNotifications,
      trustedDevices: record.trustedDevices as TrustedDevice[],
      sessionTimeout: record.sessionTimeout,
      lastPasswordChange: record.lastPasswordChange,
      updatedAt: record.updatedAt
    }
  }

  async addTrustedDevice(userId: string, device: TrustedDevice): Promise<SecuritySettings> {
    const current = await this.findByUserId(userId)
    if (!current) {
      throw new Error('Security settings not found')
    }

    const updatedDevices = [...current.trustedDevices, device]
    
    return this.update(userId, { trustedDevices: updatedDevices })
  }

  async removeTrustedDevice(userId: string, deviceId: string): Promise<SecuritySettings> {
    const current = await this.findByUserId(userId)
    if (!current) {
      throw new Error('Security settings not found')
    }

    const updatedDevices = current.trustedDevices.filter(device => device.id !== deviceId)
    
    return this.update(userId, { trustedDevices: updatedDevices })
  }

  async updatePasswordChangeTime(userId: string): Promise<SecuritySettings> {
    return this.update(userId, { lastPasswordChange: new Date() })
  }

  async delete(userId: string): Promise<void> {
    await prisma.securitySettings.delete({
      where: { userId }
    })
  }

  // Get default security settings for new users
  static getDefaultSettings(userId: string): Omit<SecuritySettings, 'id' | 'updatedAt'> {
    return {
      userId,
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: undefined,
      loginNotifications: true,
      trustedDevices: [],
      sessionTimeout: 1440, // 24 hours
      lastPasswordChange: new Date()
    }
  }
}