import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Award, Lock, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const ipAssetSchema = z.object({
  type: z.enum(['patent', 'trademark', 'copyright', 'trade_secret', 'other']),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['pending', 'granted', 'expired', 'maintained']),
  value: z.number().min(0),
  jurisdiction: z.string(),
  expiryDate: z.string().optional()
});

const ipPortfolioSchema = z.object({
  patents: z.object({
    count: z.number().min(0),
    pendingApplications: z.number().min(0),
    totalValue: z.number().min(0),
    keyPatents: z.array(ipAssetSchema).optional()
  }),
  trademarks: z.object({
    count: z.number().min(0),
    registeredMarks: z.number().min(0),
    totalValue: z.number().min(0),
    primaryMarks: z.array(z.string()).optional()
  }),
  copyrights: z.object({
    count: z.number().min(0),
    totalValue: z.number().min(0),
    keyWorks: z.array(z.string()).optional()
  }),
  tradeSecrets: z.object({
    hasTradeSecrets: z.boolean(),
    protectionMeasures: z.array(z.string()).optional(),
    estimatedValue: z.number().min(0),
    riskAssessment: z.enum(['low', 'medium', 'high']).optional()
  }),
  overallValue: z.object({
    bookValue: z.number().min(0),
    marketValue: z.number().min(0),
    strategicValue: z.enum(['low', 'medium', 'high', 'critical']),
    valuationMethod: z.enum(['cost', 'market', 'income', 'risk_adjusted']).optional()
  })
});

type IPPortfolioData = z.infer<typeof ipPortfolioSchema>;

interface IPPortfolioSubsectionProps {
  data: Partial<IPPortfolioData>;
  onUpdate: (data: Partial<IPPortfolioData>) => void;
}

export const IPPortfolioSubsection: React.FC<IPPortfolioSubsectionProps> = ({
  data,
  onUpdate
}) => {
  const [newAsset, setNewAsset] = React.useState<{ type: string; description: string; status: string; value: number; jurisdiction: string } | null>(null);

  const updateField = (section: keyof IPPortfolioData, field: string, value: any) => {
    onUpdate({
      ...data,
      [section]: {
        ...data[section],
        [field]: value
      }
    });
  };

  const addIPAsset = (type: string) => {
    setNewAsset({ type, description: '', status: 'granted', value: 0, jurisdiction: '' });
  };

  const saveIPAsset = (asset: any) => {
    if (asset.type === 'patent') {
      const currentAssets = data.patents?.keyPatents || [];
      updateField('patents', 'keyPatents', [...currentAssets, asset]);
    } else if (asset.type === 'trademark') {
      const currentMarks = data.trademarks?.primaryMarks || [];
      updateField('trademarks', 'primaryMarks', [...currentMarks, asset.description]);
    } else if (asset.type === 'copyright') {
      const currentWorks = data.copyrights?.keyWorks || [];
      updateField('copyrights', 'keyWorks', [...currentWorks, asset.description]);
    }
    setNewAsset(null);
  };

  return (
    <div className="space-y-6">
      <Card className="tier-enterprise">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Intellectual Property Portfolio</span>
          </CardTitle>
          <CardDescription>
            Comprehensive assessment of your intellectual property assets, their protection status,
            and strategic value to your enterprise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Patents Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-lg">Patents</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patent-count">Granted Patents</Label>
                <Input
                  id="patent-count"
                  type="number"
                  min="0"
                  value={data.patents?.count || ''}
                  onChange={(e) => updateField('patents', 'count', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pending-patents">Pending Applications</Label>
                <Input
                  id="pending-patents"
                  type="number"
                  min="0"
                  value={data.patents?.pendingApplications || ''}
                  onChange={(e) => updateField('patents', 'pendingApplications', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patent-value">Total Patent Value ($)</Label>
                <Input
                  id="patent-value"
                  type="number"
                  min="0"
                  value={data.patents?.totalValue || ''}
                  onChange={(e) => updateField('patents', 'totalValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Trademarks Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-lg">Trademarks</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trademark-count">Total Trademarks</Label>
                <Input
                  id="trademark-count"
                  type="number"
                  min="0"
                  value={data.trademarks?.count || ''}
                  onChange={(e) => updateField('trademarks', 'count', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registered-marks">Registered Marks</Label>
                <Input
                  id="registered-marks"
                  type="number"
                  min="0"
                  value={data.trademarks?.registeredMarks || ''}
                  onChange={(e) => updateField('trademarks', 'registeredMarks', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trademark-value">Total Trademark Value ($)</Label>
                <Input
                  id="trademark-value"
                  type="number"
                  min="0"
                  value={data.trademarks?.totalValue || ''}
                  onChange={(e) => updateField('trademarks', 'totalValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Copyrights Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-lg">Copyrights</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="copyright-count">Copyright Holdings</Label>
                <Input
                  id="copyright-count"
                  type="number"
                  min="0"
                  value={data.copyrights?.count || ''}
                  onChange={(e) => updateField('copyrights', 'count', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyright-value">Total Copyright Value ($)</Label>
                <Input
                  id="copyright-value"
                  type="number"
                  min="0"
                  value={data.copyrights?.totalValue || ''}
                  onChange={(e) => updateField('copyrights', 'totalValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Trade Secrets Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold text-lg">Trade Secrets</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade-secret-value">Estimated Trade Secret Value ($)</Label>
                <Input
                  id="trade-secret-value"
                  type="number"
                  min="0"
                  value={data.tradeSecrets?.estimatedValue || ''}
                  onChange={(e) => updateField('tradeSecrets', 'estimatedValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-assessment">Risk Assessment</Label>
                <Select 
                  value={data.tradeSecrets?.riskAssessment || ''}
                  onValueChange={(value) => updateField('tradeSecrets', 'riskAssessment', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Overall IP Valuation */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Overall IP Valuation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-value">Book Value ($)</Label>
                <Input
                  id="book-value"
                  type="number"
                  min="0"
                  value={data.overallValue?.bookValue || ''}
                  onChange={(e) => updateField('overallValue', 'bookValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market-value">Market Value ($)</Label>
                <Input
                  id="market-value"
                  type="number"
                  min="0"
                  value={data.overallValue?.marketValue || ''}
                  onChange={(e) => updateField('overallValue', 'marketValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strategic-value">Strategic Value</Label>
                <Select 
                  value={data.overallValue?.strategicValue || ''}
                  onValueChange={(value) => updateField('overallValue', 'strategicValue', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select strategic value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valuation-method">Valuation Method</Label>
              <Select 
                value={data.overallValue?.valuationMethod || ''}
                onValueChange={(value) => updateField('overallValue', 'valuationMethod', value)}
              >
                <SelectTrigger className="tier-enterprise">
                  <SelectValue placeholder="Select valuation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost">Cost Approach</SelectItem>
                  <SelectItem value="market">Market Approach</SelectItem>
                  <SelectItem value="income">Income Approach</SelectItem>
                  <SelectItem value="risk_adjusted">Risk-Adjusted DCF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};