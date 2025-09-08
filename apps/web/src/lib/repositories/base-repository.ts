import { prisma } from '@/lib/prisma'

export abstract class BaseRepository<T> {
  protected prisma = prisma

  abstract create(data: any): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract findMany(where?: any): Promise<T[]>
  abstract update(id: string, data: any): Promise<T>
  abstract delete(id: string): Promise<T>
}