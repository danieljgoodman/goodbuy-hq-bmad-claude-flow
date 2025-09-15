'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Star } from 'lucide-react'
import Link from 'next/link'

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get professional business valuations at a fraction of the cost
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">$0</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">1 Basic Valuation</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Simple PDF Report</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Email Support</span>
              </li>
            </ul>
            <Link href="/auth/register">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-primary shadow-lg">
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
            Most Popular
          </Badge>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              Professional
              <Crown className="ml-2 h-5 w-5 text-amber-500" />
            </CardTitle>
            <CardDescription>For serious business owners</CardDescription>
            <div className="text-3xl font-bold">$99<span className="text-base font-normal">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Unlimited Valuations</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Advanced Analytics</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Market Intelligence</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Industry Benchmarking</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Progress Tracking</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Priority Support</span>
              </li>
            </ul>
            <Link href="/auth/register">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Start Free Trial
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              Enterprise
              <Star className="ml-2 h-5 w-5 text-amber-500" />
            </CardTitle>
            <CardDescription>For large organizations</CardDescription>
            <div className="text-3xl font-bold">Custom</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Everything in Professional</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Custom Integrations</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">Dedicated Support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">API Access</span>
              </li>
            </ul>
            <Link href="/support">
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          All plans include our 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}