import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BusinessEvaluationRepository } from '@/lib/repositories/BusinessEvaluationRepository'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessEvaluation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    implementationGuide: {
      updateMany: vi.fn(),
    },
    progressEntry: {
      updateMany: vi.fn(),
    }
  }
}))

const { prisma } = await import('@/lib/prisma')

describe('BusinessEvaluationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('should find evaluation by id excluding soft deleted', async () => {
      const mockEvaluation = { id: 'test-id', userId: 'user-1', deletedAt: null }
      ;(prisma.businessEvaluation.findFirst as any).mockResolvedValue(mockEvaluation)

      const result = await BusinessEvaluationRepository.findById('test-id')

      expect(prisma.businessEvaluation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'test-id',
          deletedAt: null
        }
      })
      expect(result).toBe(mockEvaluation)
    })
  })

  describe('softDelete', () => {
    it('should soft delete evaluation and related data', async () => {
      const mockEvaluation = { id: 'test-id', userId: 'user-1', deletedAt: null }
      ;(prisma.businessEvaluation.findFirst as any).mockResolvedValue(mockEvaluation)
      ;(prisma.businessEvaluation.update as any).mockResolvedValue(mockEvaluation)
      ;(prisma.implementationGuide.updateMany as any).mockResolvedValue({ count: 2 })
      ;(prisma.progressEntry.updateMany as any).mockResolvedValue({ count: 3 })

      const result = await BusinessEvaluationRepository.softDelete('test-id', 'user-1')

      expect(prisma.businessEvaluation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'test-id',
          userId: 'user-1',
          deletedAt: null
        }
      })
      expect(prisma.businessEvaluation.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { deletedAt: expect.any(Date) }
      })
      expect(prisma.implementationGuide.updateMany).toHaveBeenCalledWith({
        where: {
          evaluationId: 'test-id',
          deletedAt: null
        },
        data: { deletedAt: expect.any(Date) }
      })
      expect(result).toBe(true)
    })

    it('should return false if evaluation not found or access denied', async () => {
      ;(prisma.businessEvaluation.findFirst as any).mockResolvedValue(null)

      const result = await BusinessEvaluationRepository.softDelete('test-id', 'user-1')

      expect(result).toBe(false)
    })
  })
})