'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, FileText, TrendingUp, Target } from 'lucide-react'

// Import tier components
import {
  TierBadge,
  UpgradePrompt,
  TierGuard,
  AnalyticsGuard,
  ProgressTrackingGuard,
  FeatureRequirementBadge
} from '@/components/tier'
import { useSubscriptionTier } from '@/hooks/use-subscription-tier'

/**
 * Example component demonstrating how to use the tier-based UI components
 * This shows various patterns for implementing subscription-based features
 */
export function TierComponentExamples() {
  const { currentTier, hasAnalytics, hasProgressTracking } = useSubscriptionTier()

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Tier Component Examples</h1>
        <p className="text-muted-foreground">
          Demonstrating subscription-based UI components and patterns
        </p>
      </div>

      {/* Current tier display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Subscription
            <TierBadge />
          </CardTitle>
          <CardDescription>
            Your current subscription tier and available features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Tier:</p>
              <TierBadge tier={currentTier} size="lg" />
            </div>
            <div>
              <p className="text-sm font-medium">Analytics Access:</p>
              <Badge variant={hasAnalytics ? "default" : "secondary"}>
                {hasAnalytics ? "Enabled" : "Upgrade Required"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature cards with tier guards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Analytics Feature */}
        <AnalyticsGuard restrictContent={false} blurContent={true}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
                <FeatureRequirementBadge requiredTier="premium" />
              </CardTitle>
              <CardDescription>
                Advanced business analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Chart Placeholder</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">$125K</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">8.2</div>
                    <div className="text-xs text-muted-foreground">Health Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">+15%</div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnalyticsGuard>

        {/* Progress Tracking Feature */}
        <ProgressTrackingGuard restrictContent={true}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
              <CardDescription>
                Track your business improvements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Progress Chart</span>
                </div>
                <Button className="w-full">View Progress Details</Button>
              </div>
            </CardContent>
          </Card>
        </ProgressTrackingGuard>

        {/* Benchmarking Feature (Enterprise) */}
        <TierGuard feature="benchmarks" requiredTier="enterprise" restrictContent={true}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Industry Benchmarking
                <FeatureRequirementBadge requiredTier="enterprise" />
              </CardTitle>
              <CardDescription>
                Compare against industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Benchmark Chart</span>
                </div>
                <div className="text-sm">
                  <p>Your performance: <strong>Above Average</strong></p>
                  <p>Industry median: <strong>$98K</strong></p>
                  <p>Top quartile: <strong>$156K</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TierGuard>

        {/* PDF Reports Feature */}
        <TierGuard feature="pdf_reports" blurContent={true}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional Reports
                <FeatureRequirementBadge requiredTier="premium" />
              </CardTitle>
              <CardDescription>
                Generate branded PDF reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">PDF Preview</span>
                </div>
                <Button className="w-full">Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </TierGuard>
      </div>

      {/* Manual upgrade prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Prompts</CardTitle>
          <CardDescription>
            Different styles of upgrade prompts for various contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Dialog prompt */}
            <UpgradePrompt
              feature="analytics"
              trigger={
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              }
            />

            {/* Card prompt */}
            <UpgradePrompt
              feature="progress_tracking"
              variant="card"
              trigger={
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Track Progress
                </Button>
              }
            />

            {/* Inline prompt */}
            <div className="border rounded-lg p-4">
              <UpgradePrompt
                feature="benchmarks"
                requiredTier="enterprise"
                variant="inline"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier badge examples */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Badges</CardTitle>
          <CardDescription>
            Different styles and sizes of tier badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-20">Sizes:</span>
              <TierBadge tier="free" size="sm" />
              <TierBadge tier="premium" size="md" />
              <TierBadge tier="enterprise" size="lg" />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-20">Variants:</span>
              <TierBadge tier="premium" variant="default" />
              <TierBadge tier="premium" variant="outline" />
              <TierBadge tier="premium" variant="minimal" />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-20">Features:</span>
              <FeatureRequirementBadge requiredTier="premium" />
              <FeatureRequirementBadge requiredTier="enterprise" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Usage example in a real component
export function ExampleDashboardCard() {
  return (
    <AnalyticsGuard
      blurContent={true}
      fallback={
        <div className="text-center p-8">
          <h3 className="font-semibold mb-2">Analytics Available in Premium</h3>
          <p className="text-muted-foreground mb-4">
            Get detailed insights into your business performance
          </p>
          <UpgradePrompt
            feature="analytics"
            trigger={<Button>Upgrade Now</Button>}
            size="sm"
          />
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Business Analytics</CardTitle>
          <CardDescription>Your performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Your analytics content here */}
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Advanced Analytics Dashboard</span>
          </div>
        </CardContent>
      </Card>
    </AnalyticsGuard>
  )
}