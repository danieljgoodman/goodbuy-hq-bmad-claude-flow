'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  Zap,
  TrendingUp,
  Users,
  Target,
  Calculator,
  Activity,
  ArrowRight,
  Check,
  Star,
  BarChart3,
  PieChart,
  DollarSign,
  Lightbulb,
  Shield,
  Settings
} from 'lucide-react';

// Import Professional Dashboard Components
import { MultiYearFinancialTrends } from '@/components/dashboard/professional/MultiYearFinancialTrends';
import { CustomerConcentrationRisk } from '@/components/dashboard/professional/CustomerConcentrationRisk';
import { CompetitivePositioningChart } from '@/components/dashboard/professional/CompetitivePositioningChart';
import { InvestmentROICalculator } from '@/components/dashboard/professional/InvestmentROICalculator';
import { OperationalCapacityUtilization } from '@/components/dashboard/professional/OperationalCapacityUtilization';

// Import Tier Management
import {
  getUserTier,
  getTierPermissions,
  getTierFeatures,
  calculateUpgradeValue,
  getTierComparison,
  formatCurrency,
  canAccessFeature,
  type UserTier,
  type TierFeature
} from '@/lib/utils/tier-management';

// Import Dashboard Data Hook
import { useProfessionalDashboardData } from '@/hooks/useProfessionalDashboardData';

interface ProfessionalIntegrationProps {
  /** Show tier comparison view */
  showComparison?: boolean;
  /** Enable tier switching interface */
  enableTierSwitching?: boolean;
  /** Show Professional components in read-only mode for demonstration */
  demoMode?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface TierSwitchState {
  viewMode: 'enterprise' | 'professional' | 'comparison';
  showProfessionalDemo: boolean;
}

export function ProfessionalIntegration({
  showComparison = true,
  enableTierSwitching = true,
  demoMode = false,
  className = ''
}: ProfessionalIntegrationProps) {
  const { user, isLoaded } = useUser();

  // Tier management state
  const [tierSwitch, setTierSwitch] = useState<TierSwitchState>({
    viewMode: 'enterprise',
    showProfessionalDemo: false
  });

  // Get user tier and permissions
  const userTier = useMemo(() => getUserTier(user), [user]);
  const permissions = useMemo(() => getTierPermissions(userTier), [userTier]);
  const tierFeatures = useMemo(() => getTierFeatures(userTier), [userTier]);

  // Load Professional dashboard data (for Enterprise users)
  const {
    data: professionalData,
    isLoading: professionalLoading,
    error: professionalError
  } = useProfessionalDashboardData({
    userId: user?.id || '',
    enabled: permissions.canAccessProfessionalDashboard,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Calculate tier comparison and upgrade values
  const tierComparison = useMemo(() => getTierComparison(), []);
  const upgradeValue = useMemo(() => {
    if (userTier === 'enterprise') return null;
    return calculateUpgradeValue('professional', 'enterprise', 1000000); // Assume $1M revenue
  }, [userTier]);

  // Handle tier view switching
  const handleTierViewChange = useCallback((viewMode: TierSwitchState['viewMode']) => {
    setTierSwitch(prev => ({ ...prev, viewMode }));
  }, []);

  // Handle Professional demo toggle
  const handleProfessionalDemoToggle = useCallback((enabled: boolean) => {
    setTierSwitch(prev => ({ ...prev, showProfessionalDemo: enabled }));
  }, []);

  // Render tier badge
  const renderTierBadge = (tier: UserTier) => {
    const badgeConfig = {
      basic: { color: 'bg-gray-500', icon: Shield, label: 'Basic' },
      professional: { color: 'bg-yellow-600', icon: Crown, label: 'Professional' },
      enterprise: { color: 'bg-purple-600', icon: Star, label: 'Enterprise' }
    };

    const config = badgeConfig[tier];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Render feature comparison
  const renderFeatureComparison = () => {
    const professionalFeatures = getTierFeatures('professional');
    const enterpriseFeatures = getTierFeatures('enterprise');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Features */}
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Crown className="w-5 h-5 mr-2" />
              Professional Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {professionalFeatures.map((feature) => (
                <div key={feature.id} className="flex items-start space-x-3">
                  <Check className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-gray-600">{feature.businessValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Exclusive Features */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Star className="w-5 h-5 mr-2" />
              Enterprise Exclusive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enterpriseFeatures.filter(f => !f.professionalTier).map((feature) => (
                <div key={feature.id} className="flex items-start space-x-3">
                  <Star className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-gray-600">{feature.businessValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Professional components with access control
  const renderProfessionalComponents = (readOnly: boolean = false) => {
    if (!permissions.canAccessProfessionalDashboard && !demoMode && !tierSwitch.showProfessionalDemo) {
      return (
        <Card className="border-yellow-200">
          <CardContent className="py-12">
            <div className="text-center">
              <Crown className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Professional Tier Features
              </h3>
              <p className="text-gray-600 mb-6">
                Access advanced business analytics and insights with Professional tier capabilities.
              </p>
              <Button
                onClick={() => handleProfessionalDemoToggle(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Preview Professional Features
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const isDemo = readOnly || demoMode || tierSwitch.showProfessionalDemo;
    const mockData = professionalData || {
      financial: {},
      customerRisk: {},
      competitive: {},
      investment: {},
      operational: {}
    };

    return (
      <div className="space-y-6">
        {isDemo && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Lightbulb className="w-4 h-4" />
            <AlertDescription>
              You're viewing Professional tier features in demo mode.
              {userTier !== 'enterprise' && ' Upgrade to access full functionality.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MultiYearFinancialTrends
            data={mockData.financial}
            onExport={() => Promise.resolve('')}
            loading={professionalLoading}
            readOnly={isDemo}
            className="xl:col-span-2"
          />

          <CustomerConcentrationRisk
            data={mockData.customerRisk}
            onExport={() => Promise.resolve('')}
            loading={professionalLoading}
            readOnly={isDemo}
          />

          <CompetitivePositioningChart
            data={mockData.competitive}
            onExport={() => Promise.resolve('')}
            loading={professionalLoading}
            readOnly={isDemo}
          />

          <InvestmentROICalculator
            data={mockData.investment}
            onExport={() => Promise.resolve('')}
            loading={professionalLoading}
            readOnly={isDemo}
            className="xl:col-span-2"
          />

          <OperationalCapacityUtilization
            data={mockData.operational}
            onExport={() => Promise.resolve('')}
            loading={professionalLoading}
            readOnly={isDemo}
            className="xl:col-span-2"
          />
        </div>
      </div>
    );
  };

  // Render value proposition
  const renderValueProposition = () => {
    if (!upgradeValue) return null;

    return (
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <TrendingUp className="w-5 h-5 mr-2" />
            Enterprise Tier Value Proposition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {upgradeValue.roiMultiplier}x
              </div>
              <p className="text-sm text-gray-600">Expected ROI Multiplier</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(upgradeValue.monthlyValue)}
              </div>
              <p className="text-sm text-gray-600">Monthly Value Impact</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {upgradeValue.paybackPeriod}
              </div>
              <p className="text-sm text-gray-600">Payback Period</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Exclusive Enterprise Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {upgradeValue.features.slice(0, 6).map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Star className="w-3 h-3 text-purple-600" />
                  <span className="text-sm">{feature.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Tier Switching */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Professional Dashboard Integration
            </h2>
            {renderTierBadge(userTier)}
          </div>
          <p className="text-gray-600 mt-1">
            Access Professional tier capabilities within your Enterprise dashboard
          </p>
        </div>

        {enableTierSwitching && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">View Mode:</label>
              <Tabs value={tierSwitch.viewMode} onValueChange={handleTierViewChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={tierSwitch.viewMode} onValueChange={handleTierViewChange}>
        {/* Enterprise View */}
        <TabsContent value="enterprise" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Professional Components Access */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                  Professional Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfessionalComponents()}
              </CardContent>
            </Card>

            {/* Quick Access Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleTierViewChange('professional')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Professional Dashboard
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleTierViewChange('comparison')}
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    Tier Comparison
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Dashboard Settings
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-sm">Your Tier Benefits:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Data Retention</span>
                      <Badge variant="outline">{permissions.maxDataRetention} months</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Monthly Exports</span>
                      <Badge variant="outline">{permissions.maxExportsPerMonth}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Support Level</span>
                      <Badge variant="outline">{permissions.supportLevel}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Value Proposition */}
          {userTier !== 'enterprise' && renderValueProposition()}
        </TabsContent>

        {/* Professional View */}
        <TabsContent value="professional" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Crown className="w-4 h-4" />
            <AlertDescription>
              You're viewing the Professional tier dashboard. All Professional features are included in your Enterprise subscription.
            </AlertDescription>
          </Alert>

          {renderProfessionalComponents(false)}
        </TabsContent>

        {/* Comparison View */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Tier Feature Comparison</h3>
            <p className="text-gray-600">
              Compare Professional and Enterprise tier capabilities
            </p>
          </div>

          {renderFeatureComparison()}

          {/* Pricing Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {tierComparison.slice(1).map((tier) => (
              <Card key={tier.tier} className={`${
                tier.tier === 'enterprise' ? 'border-purple-200 bg-purple-50/50' : 'border-yellow-200 bg-yellow-50/50'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{tier.tier}</span>
                    {renderTierBadge(tier.tier)}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {formatCurrency(tier.pricing.monthly)}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.features.slice(0, 5).map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature.name}</span>
                      </div>
                    ))}
                    {tier.features.length > 5 && (
                      <p className="text-sm text-gray-600 italic">
                        +{tier.features.length - 5} more features
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}