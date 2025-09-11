'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, Video, Users, MessageCircle, FileText, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function HelpCenter() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Help Center
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Find answers to your questions and learn how to get the most out of GoodBuy HQ
        </p>
        
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link href="/help/knowledge-base">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">
                Browse articles and guides
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/help/tutorials">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Video className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground">
                Learn with step-by-step videos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/help/community">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">
                Connect with other users
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/support">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized help
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Popular Articles */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">How to Create Your First Business Valuation</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Step-by-step guide to getting started with GoodBuy HQ
                  </p>
                  <Button variant="ghost" size="sm" className="p-0">
                    Read more →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Understanding Your Valuation Report</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn how to interpret your business valuation results
                  </p>
                  <Button variant="ghost" size="sm" className="p-0">
                    Read more →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Improving Your Business Value</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tips and strategies to increase your business valuation
                  </p>
                  <Button variant="ghost" size="sm" className="p-0">
                    Read more →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Account Settings and Billing</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage your account and subscription settings
                  </p>
                  <Button variant="ghost" size="sm" className="p-0">
                    Read more →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <Card className="bg-muted">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help you succeed
          </p>
          <div className="space-x-4">
            <Link href="/support">
              <Button>
                Contact Support
              </Button>
            </Link>
            <Link href="/help/community">
              <Button variant="outline">
                Join Community
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}