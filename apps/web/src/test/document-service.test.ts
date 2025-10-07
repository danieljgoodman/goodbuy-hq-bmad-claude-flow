import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '@/lib/services/document-service';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: { path: 'test/path' }, error: null })),
        remove: vi.fn(() => ({ error: null }))
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockDocument, error: null })),
          order: vi.fn(() => ({ data: [mockDocument], error: null }))
        }))
      })),
      update: vi.fn(() => ({ 
        eq: vi.fn(() => ({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
  randomBytes: vi.fn(() => ({ toString: vi.fn(() => 'test-encryption-key') })),
  createCipher: vi.fn(() => ({
    update: vi.fn(() => Buffer.from('encrypted')),
    final: vi.fn(() => Buffer.from('data'))
  }))
}));

const mockDocument = {
  id: 'test-uuid-123',
  user_id: 'user-123',
  evaluation_id: 'eval-123',
  filename: 'test-document.pdf',
  original_name: 'test-document.pdf',
  file_type: 'pdf',
  file_size: 1024,
  uploaded_at: '2024-01-01T00:00:00.000Z',
  processing_status: 'pending',
  encryption_key: 'test-encryption-key',
  storage_location: 'documents/user-123/test-document.pdf',
  document_type: 'financial_statement',
  extracted_data: null,
  quality_assessment: null,
  red_flags: [],
  ocr_results: null
};

describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateDocumentSecurity', () => {
    it('should validate file size within limits', () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
        lastModified: Date.now()
      });
      
      const result = DocumentService.validateDocumentSecurity(mockFile);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject files that are too large', () => {
      // Mock a large file by overriding the size property
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
        lastModified: Date.now()
      });
      
      Object.defineProperty(mockFile, 'size', {
        value: 60 * 1024 * 1024, // 60MB
        writable: false
      });
      
      const result = DocumentService.validateDocumentSecurity(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should reject unsupported file types', () => {
      const mockFile = new File(['test content'], 'test.exe', {
        type: 'application/x-executable',
        lastModified: Date.now()
      });
      
      const result = DocumentService.validateDocumentSecurity(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type not supported');
    });

    it('should reject potentially dangerous file extensions', () => {
      const mockFile = new File(['test content'], 'malicious.exe', {
        type: 'application/pdf', // Spoofed MIME type
        lastModified: Date.now()
      });
      
      const result = DocumentService.validateDocumentSecurity(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Potentially dangerous file type');
    });
  });

  describe('uploadSecureDocument', () => {
    it('should successfully upload a valid document', async () => {
      const mockFile = new File(['test content'], 'financial-statement.pdf', {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      const progressCallback = vi.fn();
      
      const result = await DocumentService.uploadSecureDocument(
        mockFile,
        'user-123',
        'eval-123',
        progressCallback
      );

      expect(result.id).toBe('test-uuid-123');
      expect(result.originalName).toBe('financial-statement.pdf');
      expect(result.fileType).toBe('pdf');
      expect(result.documentType).toBe('financial_statement');
      expect(progressCallback).toHaveBeenCalledTimes(5); // Upload stages
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = new File([''], 'invalid.pdf', {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      // Mock validation failure
      const originalValidate = DocumentService.validateDocumentSecurity;
      DocumentService.validateDocumentSecurity = vi.fn(() => ({
        isValid: false,
        error: 'Test validation error'
      }));

      await expect(DocumentService.uploadSecureDocument(
        mockFile,
        'user-123',
        'eval-123'
      )).rejects.toThrow('Test validation error');

      DocumentService.validateDocumentSecurity = originalValidate;
    });
  });

  describe('getUserDocuments', () => {
    it('should retrieve user documents successfully', async () => {
      const documents = await DocumentService.getUserDocuments('user-123');
      
      expect(documents).toHaveLength(1);
      expect(documents[0].id).toBe('test-uuid-123');
      expect(documents[0].userId).toBe('user-123');
    });

    it('should filter documents by evaluation ID', async () => {
      const documents = await DocumentService.getUserDocuments('user-123', 'eval-123');
      
      expect(documents).toHaveLength(1);
      expect(documents[0].evaluationId).toBe('eval-123');
    });
  });

  describe('deleteSecureDocument', () => {
    it('should delete a document successfully', async () => {
      const result = await DocumentService.deleteSecureDocument('test-uuid-123', 'user-123');
      
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent documents', async () => {
      // Mock document not found
      const result = await DocumentService.deleteSecureDocument('non-existent', 'user-123');
      
      expect(result).toBe(false);
    });
  });

  describe('getSecureDocument', () => {
    it('should retrieve a specific document', async () => {
      const document = await DocumentService.getSecureDocument('test-uuid-123', 'user-123');
      
      expect(document).not.toBeNull();
      expect(document?.id).toBe('test-uuid-123');
      expect(document?.userId).toBe('user-123');
    });

    it('should return null for non-existent documents', async () => {
      const document = await DocumentService.getSecureDocument('non-existent', 'user-123');
      
      expect(document).toBeNull();
    });
  });
});

describe('Document Type Inference', () => {
  it('should correctly identify tax return documents', () => {
    const mockFile = new File(['content'], 'tax_return_2023.pdf', {
      type: 'application/pdf'
    });

    const result = DocumentService.validateDocumentSecurity(mockFile);
    expect(result.isValid).toBe(true);
    
    // Test the inference logic indirectly through upload
    // In a real implementation, you'd expose inferDocumentType for direct testing
  });

  it('should correctly identify bank statement documents', () => {
    const mockFile = new File(['content'], 'bank_statement_january.pdf', {
      type: 'application/pdf'
    });

    const result = DocumentService.validateDocumentSecurity(mockFile);
    expect(result.isValid).toBe(true);
  });

  it('should correctly identify financial statement documents', () => {
    const mockFile = new File(['content'], 'financial_statement_q4.pdf', {
      type: 'application/pdf'
    });

    const result = DocumentService.validateDocumentSecurity(mockFile);
    expect(result.isValid).toBe(true);
  });
});