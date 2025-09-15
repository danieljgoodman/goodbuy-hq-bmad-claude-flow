import { prisma } from '@/lib/prisma'
import type { BusinessEvaluation } from '@prisma/client'

export class BusinessEvaluationRepository {
  static async findById(id: string): Promise<BusinessEvaluation | null> {
    return prisma.businessEvaluation.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })
  }

  static async findByUserId(userId: string): Promise<BusinessEvaluation[]> {
    return prisma.businessEvaluation.findMany({
      where: {
        userId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async create(data: Omit<BusinessEvaluation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<BusinessEvaluation> {
    return prisma.businessEvaluation.create({
      data
    })
  }

  static async update(id: string, data: Partial<BusinessEvaluation>): Promise<BusinessEvaluation | null> {
    try {
      return await prisma.businessEvaluation.update({
        where: {
          id,
          deletedAt: null
        },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      return null
    }
  }

  static async softDelete(id: string, userId: string): Promise<boolean> {
    try {
      const evaluation = await prisma.businessEvaluation.findFirst({
        where: {
          id,
          userId,
          deletedAt: null
        }
      })

      if (!evaluation) {
        return false
      }

      // Soft delete the evaluation
      await prisma.businessEvaluation.update({
        where: { id },
        data: { deletedAt: new Date() }
      })

      // Soft delete related implementation guides
      await prisma.implementationGuide.updateMany({
        where: {
          evaluationId: id,
          deletedAt: null
        },
        data: { deletedAt: new Date() }
      })

      // Soft delete related progress entries
      await prisma.progressEntry.updateMany({
        where: {
          guide: {
            evaluationId: id
          },
          deletedAt: null
        },
        data: { deletedAt: new Date() }
      })

      return true
    } catch (error) {
      console.error('Failed to soft delete evaluation:', error)
      return false
    }
  }

  static async findAll(): Promise<BusinessEvaluation[]> {
    return prisma.businessEvaluation.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}