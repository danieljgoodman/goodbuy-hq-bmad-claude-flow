export interface Document {
  id: string;
  userId: string;
  evaluationId: string;
  filename: string;
  originalName: string;
  fileType: 'pdf' | 'excel' | 'csv' | 'image';
  fileSize: number;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  encryptionKey: string;
  storageLocation: string;
  documentType: 'financial_statement' | 'tax_return' | 'bank_statement' | 'other';
  extractedData?: ExtractedFinancialData;
  qualityAssessment?: DataQualityAssessment;
  redFlags: RedFlag[];
  ocrResults?: OCRResult;
}

export interface ExtractedFinancialData {
  id: string;
  documentId: string;
  revenue: {
    annual: number[];
    monthly: number[];
    confidence: number;
    source: string;
  };
  expenses: {
    total: number[];
    breakdown: ExpenseCategory[];
    confidence: number;
    source: string;
  };
  assets: {
    current: number;
    fixed: number;
    intangible: number;
    confidence: number;
    source: string;
  };
  liabilities: {
    current: number;
    longTerm: number;
    confidence: number;
    source: string;
  };
  cashFlow: {
    operating: number[];
    investing: number[];
    financing: number[];
    confidence: number;
    source: string;
  };
  keyMetrics: {
    profitMargin: number;
    roa: number;
    roe: number;
    currentRatio: number;
    confidence: number;
  };
  extractedAt: Date;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface DataQualityAssessment {
  id: string;
  documentId: string;
  overallScore: number;
  completeness: {
    score: number;
    missingFields: string[];
    criticalGaps: string[];
  };
  consistency: {
    score: number;
    inconsistencies: Inconsistency[];
    crossDocumentValidation: boolean;
  };
  accuracy: {
    score: number;
    confidenceLevel: number;
    validationResults: ValidationResult[];
  };
  timeliness: {
    score: number;
    dataAge: number;
    relevancePeriod: string;
  };
  assessedAt: Date;
}

export interface Inconsistency {
  field: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedResolution: string;
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  details: string;
  confidence: number;
}

export interface RedFlag {
  id: string;
  documentId: string;
  category: 'inconsistency' | 'anomaly' | 'missing_data' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  detectedAt: Date;
  resolved: boolean;
  resolution?: string;
}

export interface OCRResult {
  id: string;
  documentId: string;
  extractedText: string;
  confidence: number;
  boundingBoxes: TextBoundingBox[];
  tables: TableExtraction[];
  processedAt: Date;
}

export interface TextBoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface TableExtraction {
  id: string;
  rows: TableRow[];
  headers: string[];
  confidence: number;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  text: string;
  columnIndex: number;
  confidence: number;
}

export interface DocumentUploadOptions {
  maxFileSize: number;
  allowedTypes: string[];
  encryptionRequired: boolean;
  virusScanning: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'encrypting' | 'scanning' | 'processing' | 'complete';
}