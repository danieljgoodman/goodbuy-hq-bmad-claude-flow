import { prisma } from '../prisma'
import { UserProfile } from '../../types'
import { BaseRepository } from './BaseRepository'

export class UserProfileRepository extends BaseRepository<UserProfile, Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>> {
  protected tableName = 'userProfile'
  async findByUserId(userId: string): Promise<UserProfile | null> {
    this.validateRequired(userId, 'userId')
    
    return this.findUnique({ userId })
  }

  async create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    this.validateRequired(profile.userId, 'userId')
    return super.create(profile)
  }

  async update(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile> {
    this.validateRequired(userId, 'userId')
    
    const record = await prisma.userProfile.update({
      where: { userId },
      data: updates
    })

    return this.transformFromDb(record)
  }

  async upsert(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const record = await prisma.userProfile.upsert({
      where: { userId: profile.userId },
      update: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatar: profile.avatar,
        businessSize: profile.businessSize,
        timezone: profile.timezone,
        language: profile.language
      },
      create: {
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatar: profile.avatar,
        businessSize: profile.businessSize,
        timezone: profile.timezone,
        language: profile.language
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      avatar: record.avatar,
      businessSize: record.businessSize,
      timezone: record.timezone,
      language: record.language,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  async delete(userId: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { userId }
    })
  }

  async findAll(): Promise<UserProfile[]> {
    const records = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      avatar: record.avatar,
      businessSize: record.businessSize,
      timezone: record.timezone,
      language: record.language,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }))
  }
}