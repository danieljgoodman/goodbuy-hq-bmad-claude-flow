'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, BookOpen, Clock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function KnowledgeBase() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Knowledge Base
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Everything you need to know about business valuations and getting the most out of GoodBuy HQ
        </p>
        
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              New to GoodBuy HQ? Start here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Creating Your First Valuation</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Understanding Your Dashboard</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Setup Guide</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4 p-0">
              View all articles →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Valuation Methods
            </CardTitle>
            <CardDescription>
              Learn about different valuation approaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Asset-Based Valuations</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Market-Based Approach</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Income-Based Methods</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4 p-0">
              View all articles →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Advanced Features
            </CardTitle>
            <CardDescription>
              Make the most of premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Market Intelligence</span>
                <Badge variant="secondary" className="text-xs">PRO</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Industry Benchmarking</span>
                <Badge variant="secondary" className="text-xs">PRO</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress Tracking</span>
                <Badge variant="secondary" className="text-xs">PRO</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4 p-0">
              View all articles →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Articles */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
        <div className="space-y-4">
          {[
            {
              title: 'How to Prepare Financial Documents for Valuation',
              description: "Learn what financial documents you need and how to organize them for the best results.",
              readTime: "5 min read",
              author: "GoodBuy HQ Team",
              isNew: true
            },
            {
              title: "Understanding Valuation Multiples",
              description: "Deep dive into how industry multiples affect your business valuation.",
              readTime: "8 min read",
              author: "Sarah Chen, CPA",
              isNew: false
            },
            {
              title: "Improving Your Business Value: 10 Key Areas",
              description: "Actionable strategies to increase your business valuation over time.",
              readTime: "12 min read",
              author: "Michael Rodriguez",
              isNew: false
            }
          ].map((article, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{article.title}</h3>
                      {article.isNew && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {article.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Read
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-muted">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is ready to help you with any questions
          </p>
          <div className="space-x-4">
            <Link href="/support">
              <Button>
                Contact Support
              </Button>
            </Link>
            <Link href="/help/community">
              <Button variant="outline">
                Ask the Community
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}