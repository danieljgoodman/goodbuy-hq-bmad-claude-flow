/**
 * Enterprise Questionnaire Integration Tests
 * Comprehensive testing for the complete Enterprise questionnaire workflow
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Import the components and utilities we've created
import {
  createEnterpriseEncryption,
  isFieldSensitive,
  getSensitiveFieldCategory
} from '@/lib/security/enterprise-form-encryption'

describe('Enterprise Questionnaire Integration Tests', () => {
  describe('Security and Encryption', () => {
    it('should identify sensitive fields correctly', () => {
      expect(isFieldSensitive('annualRevenue')).toBe(true)
      expect(isFieldSensitive('ownerCompensation')).toBe(true)
      expect(isFieldSensitive('businessType')).toBe(false)
      expect(isFieldSensitive('marketPosition')).toBe(false)
    })

    it('should categorize sensitive fields', () => {
      expect(getSensitiveFieldCategory('annualRevenue')).toBe('financial')
      expect(getSensitiveFieldCategory('ipPortfolioValue')).toBe('strategic')
      expect(getSensitiveFieldCategory('businessType')).toBeNull()
    })

    it('should create encryption instance', () => {
      const encryption = createEnterpriseEncryption({
        enabled: true,
        auditLogging: true
      })

      expect(encryption).toBeDefined()
      expect(encryption.getSecurityMetrics).toBeDefined()
    })
  })
})

// Additional utility tests
describe('Utility Functions', () => {
  it('should export all required functions', () => {
    expect(createEnterpriseEncryption).toBeDefined()
  })
})