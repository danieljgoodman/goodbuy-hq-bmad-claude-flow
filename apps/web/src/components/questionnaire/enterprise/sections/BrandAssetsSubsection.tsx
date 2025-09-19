import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, Users, TrendingUp, Award, Star, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const brandAssetsSchema = z.object({
  brandInvestment: z.object({
    annualBrandingBudget: z.number().min(0),
    brandDevelopmentCosts: z.number().min(0),
    marketingROI: z.number().min(0),
    brandValueGrowth: z.number()
  }),
  marketPosition: z.object({
    marketShare: z.number().min(0).max(100),
    brandRecognition: z.enum(['low', 'regional', 'national', 'international', 'global']),
    competitiveRanking: z.number().min(1),
    thoughtLeadership: z.enum(['emerging', 'established', 'dominant', 'pioneering'])
  }),
  customerAssets: z.object({
    totalCustomers: z.number().min(0),
    customerLifetimeValue: z.number().min(0),
    customerRetentionRate: z.number().min(0).max(100),
    netPromoterScore: z.number().min(-100).max(100),
    customerAcquisitionCost: z.number().min(0),
    organicGrowthRate: z.number()
  }),
  digitalAssets: z.object({
    websiteTraffic: z.number().min(0),
    socialMediaFollowers: z.number().min(0),
    emailSubscribers: z.number().min(0),
    digitalEngagementRate: z.number().min(0).max(100),
    seoRanking: z.enum(['poor', 'average', 'good', 'excellent', 'dominant'])
  }),
  brandValuation: z.object({
    estimatedBrandValue: z.number().min(0),
    valuationMethod: z.enum(['cost', 'market', 'income', 'royalty_relief', 'premium_pricing']),
    brandContributionToRevenue: z.number().min(0).max(100),
    brandEquity: z.enum(['weak', 'moderate', 'strong', 'exceptional'])
  })
});

type BrandAssetsData = z.infer<typeof brandAssetsSchema>;

interface BrandAssetsSubsectionProps {
  data: Partial<BrandAssetsData>;
  onUpdate: (data: Partial<BrandAssetsData>) => void;
}

export const BrandAssetsSubsection: React.FC<BrandAssetsSubsectionProps> = ({
  data,
  onUpdate
}) => {
  const updateField = (section: keyof BrandAssetsData, field: string, value: any) => {
    onUpdate({
      ...data,
      [section]: {
        ...data[section],
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="tier-enterprise">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <span>Brand & Market Assets</span>
          </CardTitle>
          <CardDescription>
            Assess your brand value, market position, customer base, and digital assets that
            contribute to your enterprise's competitive positioning and market equity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Brand Investment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-lg">Brand Investment</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annual-branding-budget">Annual Branding Budget ($)</Label>
                <Input
                  id="annual-branding-budget"
                  type="number"
                  min="0"
                  value={data.brandInvestment?.annualBrandingBudget || ''}
                  onChange={(e) => updateField('brandInvestment', 'annualBrandingBudget', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-development-costs">Brand Development Costs ($)</Label>
                <Input
                  id="brand-development-costs"
                  type="number"
                  min="0"
                  value={data.brandInvestment?.brandDevelopmentCosts || ''}
                  onChange={(e) => updateField('brandInvestment', 'brandDevelopmentCosts', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketing-roi">Marketing ROI (%)</Label>
                <Input
                  id="marketing-roi"
                  type="number"
                  min="0"
                  value={data.brandInvestment?.marketingROI || ''}
                  onChange={(e) => updateField('brandInvestment', 'marketingROI', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-value-growth">Brand Value Growth (% YoY)</Label>
                <Input
                  id="brand-value-growth"
                  type="number"
                  value={data.brandInvestment?.brandValueGrowth || ''}
                  onChange={(e) => updateField('brandInvestment', 'brandValueGrowth', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Market Position */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-lg">Market Position</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="market-share">Market Share (%)</Label>
                <Input
                  id="market-share"
                  type="number"
                  min="0"
                  max="100"
                  value={data.marketPosition?.marketShare || ''}
                  onChange={(e) => updateField('marketPosition', 'marketShare', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitive-ranking">Competitive Ranking (#)</Label>
                <Input
                  id="competitive-ranking"
                  type="number"
                  min="1"
                  value={data.marketPosition?.competitiveRanking || ''}
                  onChange={(e) => updateField('marketPosition', 'competitiveRanking', parseInt(e.target.value) || 1)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-recognition">Brand Recognition</Label>
                <Select 
                  value={data.marketPosition?.brandRecognition || ''}
                  onValueChange={(value) => updateField('marketPosition', 'brandRecognition', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select recognition level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low/Local</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thought-leadership">Thought Leadership</Label>
                <Select 
                  value={data.marketPosition?.thoughtLeadership || ''}
                  onValueChange={(value) => updateField('marketPosition', 'thoughtLeadership', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select leadership level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging">Emerging</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                    <SelectItem value="dominant">Dominant</SelectItem>
                    <SelectItem value="pioneering">Pioneering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Assets */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-lg">Customer Base Assets</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total-customers">Total Customers</Label>
                <Input
                  id="total-customers"
                  type="number"
                  min="0"
                  value={data.customerAssets?.totalCustomers || ''}
                  onChange={(e) => updateField('customerAssets', 'totalCustomers', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-lifetime-value">Customer Lifetime Value ($)</Label>
                <Input
                  id="customer-lifetime-value"
                  type="number"
                  min="0"
                  value={data.customerAssets?.customerLifetimeValue || ''}
                  onChange={(e) => updateField('customerAssets', 'customerLifetimeValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-retention-rate">Customer Retention Rate (%)</Label>
                <Input
                  id="customer-retention-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={data.customerAssets?.customerRetentionRate || ''}
                  onChange={(e) => updateField('customerAssets', 'customerRetentionRate', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net-promoter-score">Net Promoter Score</Label>
                <Input
                  id="net-promoter-score"
                  type="number"
                  min="-100"
                  max="100"
                  value={data.customerAssets?.netPromoterScore || ''}
                  onChange={(e) => updateField('customerAssets', 'netPromoterScore', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-acquisition-cost">Customer Acquisition Cost ($)</Label>
                <Input
                  id="customer-acquisition-cost"
                  type="number"
                  min="0"
                  value={data.customerAssets?.customerAcquisitionCost || ''}
                  onChange={(e) => updateField('customerAssets', 'customerAcquisitionCost', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organic-growth-rate">Organic Growth Rate (% YoY)</Label>
                <Input
                  id="organic-growth-rate"
                  type="number"
                  value={data.customerAssets?.organicGrowthRate || ''}
                  onChange={(e) => updateField('customerAssets', 'organicGrowthRate', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Digital Assets */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-lg">Digital Assets</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website-traffic">Monthly Website Traffic</Label>
                <Input
                  id="website-traffic"
                  type="number"
                  min="0"
                  value={data.digitalAssets?.websiteTraffic || ''}
                  onChange={(e) => updateField('digitalAssets', 'websiteTraffic', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-media-followers">Social Media Followers</Label>
                <Input
                  id="social-media-followers"
                  type="number"
                  min="0"
                  value={data.digitalAssets?.socialMediaFollowers || ''}
                  onChange={(e) => updateField('digitalAssets', 'socialMediaFollowers', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subscribers">Email Subscribers</Label>
                <Input
                  id="email-subscribers"
                  type="number"
                  min="0"
                  value={data.digitalAssets?.emailSubscribers || ''}
                  onChange={(e) => updateField('digitalAssets', 'emailSubscribers', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digital-engagement-rate">Digital Engagement Rate (%)</Label>
                <Input
                  id="digital-engagement-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={data.digitalAssets?.digitalEngagementRate || ''}
                  onChange={(e) => updateField('digitalAssets', 'digitalEngagementRate', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-ranking">SEO Ranking Performance</Label>
                <Select 
                  value={data.digitalAssets?.seoRanking || ''}
                  onValueChange={(value) => updateField('digitalAssets', 'seoRanking', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select SEO performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="dominant">Dominant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Brand Valuation */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-gold-600" />
              <h4 className="font-semibold text-lg">Brand Valuation</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated-brand-value">Estimated Brand Value ($)</Label>
                <Input
                  id="estimated-brand-value"
                  type="number"
                  min="0"
                  value={data.brandValuation?.estimatedBrandValue || ''}
                  onChange={(e) => updateField('brandValuation', 'estimatedBrandValue', parseInt(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-contribution-revenue">Brand Contribution to Revenue (%)</Label>
                <Input
                  id="brand-contribution-revenue"
                  type="number"
                  min="0"
                  max="100"
                  value={data.brandValuation?.brandContributionToRevenue || ''}
                  onChange={(e) => updateField('brandValuation', 'brandContributionToRevenue', parseFloat(e.target.value) || 0)}
                  className="tier-enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valuation-method">Valuation Method</Label>
                <Select 
                  value={data.brandValuation?.valuationMethod || ''}
                  onValueChange={(value) => updateField('brandValuation', 'valuationMethod', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost">Cost Approach</SelectItem>
                    <SelectItem value="market">Market Approach</SelectItem>
                    <SelectItem value="income">Income Approach</SelectItem>
                    <SelectItem value="royalty_relief">Royalty Relief</SelectItem>
                    <SelectItem value="premium_pricing">Premium Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-equity">Brand Equity</Label>
                <Select 
                  value={data.brandValuation?.brandEquity || ''}
                  onValueChange={(value) => updateField('brandValuation', 'brandEquity', value)}
                >
                  <SelectTrigger className="tier-enterprise">
                    <SelectValue placeholder="Select equity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weak">Weak</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                    <SelectItem value="exceptional">Exceptional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Brand Assets Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Crown className="h-6 w-6 text-purple-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Brand Value</h5>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(data.brandValuation?.estimatedBrandValue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Users className="h-6 w-6 text-green-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Total Customers</h5>
                  <p className="text-2xl font-bold text-green-600">
                    {(data.customerAssets?.totalCustomers || 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <TrendingUp className="h-6 w-6 text-blue-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">Market Share</h5>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.marketPosition?.marketShare || 0}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Star className="h-6 w-6 text-orange-600 mx-auto" />
                  </div>
                  <h5 className="font-medium">NPS Score</h5>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.customerAssets?.netPromoterScore || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};