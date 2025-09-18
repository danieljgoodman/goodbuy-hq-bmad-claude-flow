/**
 * Enterprise-Grade Encryption Utilities
 * Story 11.5: Field-level encryption for sensitive enterprise data
 */

import crypto from 'crypto';
import { ENCRYPTED_FIELDS, type EnterpriseTierData, type EncryptedFieldName } from '@/types/enterprise-evaluation';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_ITERATIONS = 100000;

/**
 * Get or generate encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const masterKey = process.env.ENTERPRISE_ENCRYPTION_KEY;

  if (!masterKey) {
    throw new Error('ENTERPRISE_ENCRYPTION_KEY environment variable is not set');
  }

  // Derive a key from the master key using PBKDF2
  const salt = process.env.ENTERPRISE_ENCRYPTION_SALT || 'default-salt-change-in-production';
  return crypto.pbkdf2Sync(masterKey, salt, KEY_ITERATIONS, 32, 'sha256');
}

/**
 * Encrypt a string value
 */
export function encrypt(value: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(value, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    // Combine IV, tag, and encrypted data
    const combined = Buffer.concat([iv, tag, encrypted]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt a string value
 */
export function decrypt(encryptedValue: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedValue, 'base64');

    // Extract IV, tag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Encrypt specific fields in Enterprise data
 */
export function encryptEnterpriseData(data: Partial<EnterpriseTierData>): Partial<EnterpriseTierData> {
  const encrypted = JSON.parse(JSON.stringify(data)); // Deep clone

  // Strategic Value Drivers encryption
  if (encrypted.strategicValueDrivers) {
    const svd = encrypted.strategicValueDrivers;
    if (svd.ipPortfolioValue !== undefined) {
      (svd as any).ipPortfolioValue = encrypt(svd.ipPortfolioValue.toString());
    }
    if (svd.partnershipAgreementsValue !== undefined) {
      (svd as any).partnershipAgreementsValue = encrypt(svd.partnershipAgreementsValue.toString());
    }
    if (svd.customerDatabaseValue !== undefined) {
      (svd as any).customerDatabaseValue = encrypt(svd.customerDatabaseValue.toString());
    }
  }

  // Strategic Scenario Planning encryption
  if (encrypted.strategicScenarioPlanning) {
    const ssp = encrypted.strategicScenarioPlanning;
    if (ssp.exitStrategyPreferences) {
      (ssp as any).exitStrategyPreferences = encrypt(JSON.stringify(ssp.exitStrategyPreferences));
    }
    if (ssp.acquisitionScenario) {
      (ssp as any).acquisitionScenario = encrypt(JSON.stringify(ssp.acquisitionScenario));
    }
  }

  // Multi-Year Projections encryption
  if (encrypted.multiYearProjections) {
    const myp = encrypted.multiYearProjections;
    if (myp.strategicOptions) {
      (myp as any).strategicOptions = encrypt(JSON.stringify(myp.strategicOptions));
    }
  }

  return encrypted;
}

/**
 * Decrypt specific fields in Enterprise data
 */
export function decryptEnterpriseData(data: Partial<EnterpriseTierData>): Partial<EnterpriseTierData> {
  const decrypted = JSON.parse(JSON.stringify(data)); // Deep clone

  try {
    // Strategic Value Drivers decryption
    if (decrypted.strategicValueDrivers) {
      const svd = decrypted.strategicValueDrivers;
      if (svd.ipPortfolioValue && typeof svd.ipPortfolioValue === 'string') {
        (svd as any).ipPortfolioValue = Number(decrypt(svd.ipPortfolioValue));
      }
      if (svd.partnershipAgreementsValue && typeof svd.partnershipAgreementsValue === 'string') {
        (svd as any).partnershipAgreementsValue = Number(decrypt(svd.partnershipAgreementsValue));
      }
      if (svd.customerDatabaseValue && typeof svd.customerDatabaseValue === 'string') {
        (svd as any).customerDatabaseValue = Number(decrypt(svd.customerDatabaseValue));
      }
    }

    // Strategic Scenario Planning decryption
    if (decrypted.strategicScenarioPlanning) {
      const ssp = decrypted.strategicScenarioPlanning;
      if (ssp.exitStrategyPreferences && typeof ssp.exitStrategyPreferences === 'string') {
        (ssp as any).exitStrategyPreferences = JSON.parse(decrypt(ssp.exitStrategyPreferences));
      }
      if (ssp.acquisitionScenario && typeof ssp.acquisitionScenario === 'string') {
        (ssp as any).acquisitionScenario = JSON.parse(decrypt(ssp.acquisitionScenario));
      }
    }

    // Multi-Year Projections decryption
    if (decrypted.multiYearProjections) {
      const myp = decrypted.multiYearProjections;
      if (myp.strategicOptions && typeof myp.strategicOptions === 'string') {
        (myp as any).strategicOptions = JSON.parse(decrypt(myp.strategicOptions));
      }
    }
  } catch (error) {
    console.error('Failed to decrypt some enterprise fields:', error);
    // Return partially decrypted data rather than throwing
  }

  return decrypted;
}

/**
 * Check if a field should be encrypted
 */
export function isEncryptedField(fieldName: string): boolean {
  return ENCRYPTED_FIELDS.includes(fieldName as EncryptedFieldName);
}

/**
 * Generate a deterministic hash for searchable encryption
 * This allows searching encrypted fields while maintaining security
 */
export function generateSearchableHash(value: string): string {
  const key = getEncryptionKey();
  const hash = crypto.createHmac('sha256', key);
  hash.update(value);
  return hash.digest('hex');
}

/**
 * Validate encryption key configuration
 */
export function validateEncryptionConfig(): boolean {
  try {
    const key = process.env.ENTERPRISE_ENCRYPTION_KEY;
    const salt = process.env.ENTERPRISE_ENCRYPTION_SALT;

    if (!key || key.length < 32) {
      console.error('ENTERPRISE_ENCRYPTION_KEY must be at least 32 characters');
      return false;
    }

    if (!salt || salt.length < 16) {
      console.error('ENTERPRISE_ENCRYPTION_SALT must be at least 16 characters');
      return false;
    }

    // Test encryption/decryption
    const testData = 'test-encryption-data';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testData) {
      console.error('Encryption/decryption test failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Encryption configuration validation failed:', error);
    return false;
  }
}

/**
 * Secure comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any, fieldName: string): string {
  if (!isEncryptedField(fieldName)) {
    return JSON.stringify(data);
  }

  if (typeof data === 'string') {
    return '***ENCRYPTED***';
  }

  if (typeof data === 'number') {
    return '***NUMBER***';
  }

  return '***SENSITIVE***';
}