'use client';

import { BusinessEvaluation } from '@/types/valuation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Mail, Share2, Printer } from 'lucide-react';

interface ValuationExportProps {
  evaluation: BusinessEvaluation;
}

export function ValuationExport({ evaluation }: ValuationExportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportPDF = async () => {
    // In a real implementation, this would call an API endpoint to generate a PDF
    console.log('Exporting PDF for evaluation:', evaluation.id);
    
    // Mock implementation - would typically call /api/valuations/[id]/export
    const response = await fetch(`/api/valuations/${evaluation.id}/export`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/pdf' },
    }).catch(() => null);
    
    if (response?.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `valuation-report-${evaluation.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // Mock download for demo purposes
      alert('PDF export would be available in full implementation');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Business Valuation Report',
        text: `Business valuation: ${formatCurrency(evaluation.valuations.weighted.value)}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Business Valuation: ${formatCurrency(evaluation.valuations.weighted.value)} - ${window.location.href}`
      );
      alert('Valuation link copied to clipboard');
    }
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent('Business Valuation Report');
    const body = encodeURIComponent(
      `I'd like to share this business valuation report:\n\n` +
      `Valuation: ${formatCurrency(evaluation.valuations.weighted.value)}\n` +
      `Confidence: ${(evaluation.valuations.weighted.confidence * 100).toFixed(1)}%\n` +
      `Industry: ${evaluation.businessData.industry}\n\n` +
      `View full report: ${window.location.href}`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Share Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Report Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Final Valuation</span>
              <div className="font-bold text-primary">
                {formatCurrency(evaluation.valuations.weighted.value)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence Level</span>
              <div className="font-bold">
                {(evaluation.valuations.weighted.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Industry</span>
              <div className="font-bold">{evaluation.businessData.industry}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Report Date</span>
              <div className="font-bold">
                {evaluation.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Professional PDF Export */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                <span className="font-medium">Professional PDF Report</span>
              </div>
              <Badge variant="default">Recommended</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Comprehensive 15-page professional valuation report with executive summary, 
              methodology details, industry benchmarks, and risk analysis.
            </p>
            
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Executive Summary & Key Findings</li>
              <li>• Detailed Methodology Explanations</li>
              <li>• Industry Benchmark Analysis</li>
              <li>• Risk Factor Assessment</li>
              <li>• Confidence Analysis & Recommendations</li>
              <li>• Professional Formatting & Charts</li>
            </ul>
            
            <Button onClick={handleExportPDF} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Quick Actions</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share your valuation results or print the current view for immediate use.
            </p>
            
            <div className="space-y-2">
              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Current View
              </Button>
              
              <Button variant="outline" onClick={handleShare} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Valuation
              </Button>
              
              <Button variant="outline" onClick={handleEmailReport} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email Summary
              </Button>
            </div>
          </div>
        </div>

        {/* Report Features */}
        <div className="space-y-4">
          <h3 className="font-semibold">Professional Report Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Comprehensive Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Multi-methodology approach with detailed explanations and industry context
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-green-100 rounded-full p-3 w-fit mx-auto">
                <Badge className="h-6 w-6 bg-green-600" />
              </div>
              <h4 className="font-medium">Professional Quality</h4>
              <p className="text-xs text-muted-foreground">
                Bank-grade formatting suitable for investors, lenders, and stakeholders
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Instant Download</h4>
              <p className="text-xs text-muted-foreground">
                Generated in seconds with all charts, tables, and professional formatting
              </p>
            </div>
          </div>
        </div>

        {/* Usage Disclaimer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
          <strong>Disclaimer:</strong> This valuation is for informational purposes only and should not be 
          considered as professional financial advice. For official valuations, consult with certified 
          valuation professionals. The AI-generated analysis is based on provided data and industry benchmarks.
        </div>
      </CardContent>
    </Card>
  );
}