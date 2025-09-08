export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ScheduledDelivery {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  timezone: string;
  isActive: boolean;
}

export interface ExportConfiguration {
  id: string;
  userId: string;
  exportType: 'pdf' | 'powerpoint' | 'excel' | 'json';
  template: 'executive' | 'detailed' | 'investor' | 'custom';
  branding: {
    companyName: string;
    logo: string;
    colorScheme: ColorScheme;
    customFooter: string;
    whiteLabel: boolean;
  };
  sections: {
    executiveSummary: boolean;
    valuation: boolean;
    healthAnalysis: boolean;
    opportunities: boolean;
    appendices: boolean;
  };
  confidentialityLevel: 'public' | 'confidential' | 'restricted';
  scheduledDelivery?: ScheduledDelivery;
  recipients: string[];
  createdAt: Date;
  lastUsed: Date;
}

export interface ExportTemplate {
  id: string;
  name: string;
  type: 'executive' | 'detailed' | 'investor' | 'custom';
  description: string;
  sections: string[];
  supportedFormats: ('pdf' | 'powerpoint' | 'excel' | 'json')[];
  customizationOptions: {
    branding: boolean;
    sections: boolean;
    styling: boolean;
    whiteLabel: boolean;
  };
  isPremium: boolean;
}

export interface ExportProgress {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // in seconds
  errorMessage?: string;
  downloadUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}