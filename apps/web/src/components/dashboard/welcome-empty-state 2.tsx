'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  ArrowRight,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react'

interface WelcomeEmptyStateProps {
  onCreateEvaluation: () => void
  className?: string
}

export default function WelcomeEmptyState({ 
  onCreateEvaluation,
  className = ""
}: WelcomeEmptyStateProps) {
  const steps = [
    {
      number: 1,
      title: "Business Basics",
      description: "Tell us about your company",
      icon: FileText,
      duration: "3 min"
    },
    {
      number: 2,
      title: "Financial Data",
      description: "Share key financial metrics",
      icon: BarChart3,
      duration: "5 min"
    },
    {
      number: 3,
      title: "Get Results",
      description: "Receive your valuation & insights",
      icon: Target,
      duration: "2 min"
    }
  ]

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Welcome Section */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            
            {/* Main Message */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Discover Your Business Value
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Get a comprehensive valuation and health assessment of your business in just 10 minutes.
              </p>
            </div>

            {/* Trust Signal */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Trusted by 500+ businesses</span>
            </div>

            {/* Primary CTA */}
            <Button 
              onClick={onCreateEvaluation}
              size="lg"
              className="text-base px-8 py-3 h-auto"
            >
              Start Your Evaluation
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Quick Info */}
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>10 minutes</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span>No credit card required</span>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span>Instant results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple 3-Step Process */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to get your business valuation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center space-y-3">
                {/* Step Icon */}
                <div className="relative">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center"
                  >
                    {step.number}
                  </Badge>
                </div>

                {/* Step Content */}
                <div>
                  <h3 className="font-semibold text-base">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {step.duration}
                  </Badge>
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-6 z-10">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 transform translate-x-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What You'll Get Preview */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">What You'll Get</h3>
            <p className="text-sm text-muted-foreground">Preview of your dashboard after evaluation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-background p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">$250K</div>
              <div className="text-sm font-medium">Business Value</div>
              <div className="text-xs text-muted-foreground">Estimated valuation</div>
            </div>
            
            <div className="bg-background p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">85/100</div>
              <div className="text-sm font-medium">Health Score</div>
              <div className="text-xs text-muted-foreground">Business health</div>
            </div>
            
            <div className="bg-background p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">+12%</div>
              <div className="text-sm font-medium">Growth Rate</div>
              <div className="text-xs text-muted-foreground">Annual growth</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}