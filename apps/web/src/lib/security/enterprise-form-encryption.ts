/**
 * Enterprise Form Encryption & Security Utilities
 * Field-level encryption for sensitive business data with audit logging
 */

import { z } from 'zod'

/**
 * Configuration for encryption settings
 */
interface EncryptionConfig {
  enabled: boolean
  algorithm: 'AES-GCM' | 'ChaCha20-Poly1305'
  keyDerivation: 'PBKDF2' | 'Argon2id'
  compressionEnabled: boolean
  auditLogging: boolean
}

/**
 * Sensitive field definitions for Enterprise questionnaire
 */
const SENSITIVE_FIELDS = {
  financial: [
    'annualRevenue',
    'revenueYear1',
    'revenueYear2',
    'revenueYear3',
    'profitYear1',
    'profitYear2',
    'profitYear3',
    'cashFlowYear1',
    'cashFlowYear2',
    'cashFlowYear3',
    'totalDebt',
    'ownerCompensation',
    'marketRateCompensation',
    'compensationAdjustment',
    'oneTimeExpenses2024',
    'oneTimeExpenses2023',
    'oneTimeExpenses2022',
    'debtServiceRequirements',
    'workingCapitalReduction',
    'growthInvestmentCapacity'
  ],
  strategic: [
    'ipPortfolioValue',
    'partnershipAgreementsValue',
    'customerDatabaseValue',
    'customerAcquisitionCost',
    'brandDevelopmentInvestment',
    'technologyInvestmentThreeYear',
    'infrastructureInvestmentRequired',
    'largestCustomerRevenue',
    'top5CustomerRevenue'
  ],
  operational: [
    'majorInfrastructureThreshold',
    'debtCapacityGrowth',
    'capex',
    'investmentRequired',
    'expectedROI',
    'valueCreationPotential',
    'opportunitySize'
  ]
} as const

type SensitiveFieldCategory = keyof typeof SENSITIVE_FIELDS
type SensitiveField = typeof SENSITIVE_FIELDS[SensitiveFieldCategory][number]

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
  timestamp: Date
  userId?: string
  sessionId: string
  action: 'encrypt' | 'decrypt' | 'access' | 'modify'
  fieldPath: string
  fieldCategory: SensitiveFieldCategory
  success: boolean
  metadata?: {
    userAgent?: string
    ipAddress?: string
    pageUrl?: string
    encryptionMethod?: string
    errorMessage?: string
  }
}

/**
 * Encrypted field wrapper
 */
interface EncryptedField {
  encrypted: true
  algorithm: string
  data: string
  iv: string
  salt?: string
  timestamp: string
  integrity: string
}

/**
 * Encryption result
 */
interface EncryptionResult {
  success: boolean
  data?: EncryptedField
  error?: string
  auditId?: string
}

/**
 * Decryption result
 */
interface DecryptionResult {
  success: boolean
  data?: any
  error?: string
  auditId?: string
}

/**
 * Enterprise form encryption class
 */
export class EnterpriseFormEncryption {
  private config: EncryptionConfig
  private auditLog: AuditLogEntry[] = []
  private sessionId: string
  private derivedKey?: CryptoKey

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = {
      enabled: true,
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2',
      compressionEnabled: true,
      auditLogging: true,
      ...config
    }
    this.sessionId = this.generateSessionId()
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    // Fallback for older browsers
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * Derive encryption key from user session
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available')
    }

    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Initialize encryption with user session
   */
  async initialize(userSession: string): Promise<boolean> {
    if (!this.config.enabled) return true

    try {
      const salt = new Uint8Array(16)
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(salt)
      }

      this.derivedKey = await this.deriveKey(userSession + this.sessionId, salt)
      return true
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
      return false
    }
  }

  /**
   * Check if field is sensitive and requires encryption
   */
  private isSensitiveField(fieldPath: string): { isSensitive: boolean; category?: SensitiveFieldCategory } {
    for (const [category, fields] of Object.entries(SENSITIVE_FIELDS)) {
      if (fields.some(field => fieldPath.includes(field))) {
        return { isSensitive: true, category: category as SensitiveFieldCategory }
      }
    }
    return { isSensitive: false }
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: Omit<AuditLogEntry, 'timestamp'>): string {
    if (!this.config.auditLogging) return ''

    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    }

    this.auditLog.push(auditEntry)

    // In production, send to secure logging service
    if (typeof window !== 'undefined') {
      console.log('Enterprise Form Audit:', {
        id: this.auditLog.length.toString(),
        timestamp: auditEntry.timestamp,
        action: auditEntry.action,
        fieldPath: auditEntry.fieldPath,
        success: auditEntry.success
      })
    }

    return this.auditLog.length.toString()
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    encryptionOperations: number
    decryptionOperations: number
    uniqueFields: number
    sessionDuration: number
  } {
    const successful = this.auditLog.filter(entry => entry.success).length
    const failed = this.auditLog.filter(entry => !entry.success).length
    const encryptions = this.auditLog.filter(entry => entry.action === 'encrypt').length
    const decryptions = this.auditLog.filter(entry => entry.action === 'decrypt').length
    const uniqueFields = new Set(this.auditLog.map(entry => entry.fieldPath)).size

    const firstEntry = this.auditLog[0]
    const lastEntry = this.auditLog[this.auditLog.length - 1]
    const sessionDuration = firstEntry && lastEntry
      ? lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime()
      : 0

    return {
      totalOperations: this.auditLog.length,
      successfulOperations: successful,
      failedOperations: failed,
      encryptionOperations: encryptions,
      decryptionOperations: decryptions,
      uniqueFields,
      sessionDuration
    }
  }
}

/**
 * Export utility functions for form components
 */
export const createEnterpriseEncryption = (config?: Partial<EncryptionConfig>) => {
  return new EnterpriseFormEncryption(config)
}

export const isFieldSensitive = (fieldPath: string): boolean => {
  for (const fields of Object.values(SENSITIVE_FIELDS)) {
    if (fields.some(field => fieldPath.includes(field))) {
      return true
    }
  }
  return false
}

export const getSensitiveFieldCategory = (fieldPath: string): SensitiveFieldCategory | null => {
  for (const [category, fields] of Object.entries(SENSITIVE_FIELDS)) {
    if (fields.some(field => fieldPath.includes(field))) {
      return category as SensitiveFieldCategory
    }
  }
  return null
}

/**
 * Decrypt enterprise data helper function
 */
export async function decryptEnterpriseData(encryptedData: any): Promise<any> {
  const encryption = createEnterpriseEncryption();

  // If data is not encrypted, return as-is
  if (!encryptedData || typeof encryptedData !== 'object') {
    return encryptedData;
  }

  // Check if it's an encrypted field object
  if (encryptedData.encrypted && encryptedData.iv && encryptedData.tag) {
    const result = await encryption.decryptField(encryptedData, 'data');
    return result.success ? result.data : null;
  }

  // Recursively decrypt nested objects
  const decrypted: any = {};
  for (const [key, value] of Object.entries(encryptedData)) {
    if (value && typeof value === 'object' && 'encrypted' in value) {
      const result = await encryption.decryptField(value, key);
      decrypted[key] = result.success ? result.data : null;
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}

/**
 * Type exports
 */
export type {
  EncryptionConfig,
  EncryptedField,
  EncryptionResult,
  DecryptionResult,
  AuditLogEntry,
  SensitiveField,
  SensitiveFieldCategory
}