'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TierProtectedComponent,
  UpgradePrompt,
  TierBadge,
  UsageMeter,
  useTierAccess
} from '@/components/access-control';
import { FileText, BarChart3, Bot, Settings, Users, Crown } from 'lucide-react';

/**
 * Integration examples for the access control system
 * These examples show how to use the components in real scenarios
 */

/**
 * Example 1: Protected feature with inline upgrade prompt
 */
export function ProtectedReportGenerator() {
  const { userTier } = useTierAccess();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Advanced Report Generator
            </CardTitle>
            <CardDescription>
              Generate comprehensive business reports with AI insights
            </CardDescription>
          </div>
          <TierBadge tier={userTier} showUpgradeButton />
        </div>
      </CardHeader>
      <CardContent>
        <TierProtectedComponent
          feature="reports"
          action="advanced_analytics"
          variant="default"
          showUpgradePrompt
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create detailed reports with advanced analytics, custom charts, and AI-powered insights.
            </p>
            <div className="flex gap-2">
              <Button>Generate Report</Button>
              <Button variant="outline">Save Template</Button>
            </div>
          </div>
        </TierProtectedComponent>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: AI Analysis with usage tracking
 */
export function AIAnalysisPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Business Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TierProtectedComponent
            feature="ai_analysis"
            action="create"
            variant="compact"
          >
            <UsageMeter
              feature="ai_analysis"
              action="create"
              variant="default"
            />
          </TierProtectedComponent>
          
          <Separator />
          
          <TierProtectedComponent
            feature="ai_analysis"
            action="create"
            hideOnNoAccess
          >
            <Button className="w-full">
              Start AI Analysis
            </Button>
          </TierProtectedComponent>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Dashboard customization with tier restrictions
 */
export function DashboardCustomization() {
  const features = [
    { id: 'basic', name: 'Basic Widgets', icon: BarChart3, feature: 'dashboard', action: 'widgets' },
    { id: 'custom', name: 'Custom Widgets', icon: Settings, feature: 'dashboard', action: 'customize' },
    { id: 'realtime', name: 'Real-time Updates', icon: Crown, feature: 'dashboard', action: 'real_time' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Customization</CardTitle>
        <CardDescription>
          Customize your dashboard with advanced widgets and features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <TierProtectedComponent
                key={feature.id}
                feature={feature.feature as any}
                action={feature.action}
                variant="compact"
                className="h-full"
              >
                <Card className="h-full border-dashed border-2 hover:border-solid transition-colors cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <h3 className="font-medium text-sm">{feature.name}</h3>
                    <Badge variant="outline" className="mt-2">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              </TierProtectedComponent>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Team management with user limits
 */
export function TeamManagement() {
  const { userTier } = useTierAccess();
  
  const mockTeamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Owner' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Manager' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage your team members and permissions
            </CardDescription>
          </div>
          <TierBadge tier={userTier} variant="detailed" showUpgradeButton />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current team members */}
          <div className="space-y-2">
            {mockTeamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                <Badge variant="outline">{member.role}</Badge>
              </div>
            ))}
          </div>
          
          <Separator />
          
          {/* Add team member - protected by tier */}
          <TierProtectedComponent
            feature="admin"
            action="user_management"
            variant="compact"
            customAccessDeniedMessage="Upgrade to Professional or Enterprise to add team members"
          >
            <Button variant="outline" className="w-full">
              Add Team Member
            </Button>
          </TierProtectedComponent>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Upgrade prompt dialog
 */
export function UpgradePromptExample() {
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);
  
  const handleUpgrade = async (tier: any) => {
    console.log('Upgrading to:', tier);
    // Implement upgrade logic here
    setShowUpgradeDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade Prompt Examples</CardTitle>
        <CardDescription>
          Different ways to present upgrade options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dialog upgrade prompt */}
          <UpgradePrompt
            variant="dialog"
            open={showUpgradeDialog}
            onOpenChange={setShowUpgradeDialog}
            onUpgrade={handleUpgrade}
            feature="ai_analysis"
            action="advanced"
            trigger={
              <Button variant="outline" onClick={() => setShowUpgradeDialog(true)}>
                Show Upgrade Dialog
              </Button>
            }
          />
          
          {/* Inline upgrade prompt */}
          <UpgradePrompt
            variant="inline"
            showComparison
            onUpgrade={handleUpgrade}
            feature="reports"
            action="advanced_analytics"
          />
          
          {/* Banner upgrade prompt */}
          <UpgradePrompt
            variant="banner"
            onUpgrade={handleUpgrade}
            targetTier="professional"
          />
          
          {/* Compact upgrade prompt */}
          <UpgradePrompt
            variant="compact"
            onUpgrade={handleUpgrade}
            targetTier="enterprise"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 6: Usage meters for different features
 */
export function UsageMetersExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Tracking</CardTitle>
        <CardDescription>
          Monitor feature usage across different limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Default usage meter */}
          <UsageMeter
            feature="reports"
            action="create"
            variant="default"
          />
          
          {/* Compact usage meter */}
          <UsageMeter
            feature="evaluations"
            action="create"
            variant="compact"
          />
          
          {/* Circular usage meter */}
          <UsageMeter
            feature="ai_analysis"
            action="create"
            variant="circular"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main examples showcase component
 */
export function AccessControlExamples() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Access Control Examples</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore how to implement tier-based access control in your application
          with these comprehensive examples.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProtectedReportGenerator />
        <AIAnalysisPanel />
        <DashboardCustomization />
        <TeamManagement />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <UpgradePromptExample />
        <UsageMetersExample />
      </div>
    </div>
  );
}

export default AccessControlExamples;