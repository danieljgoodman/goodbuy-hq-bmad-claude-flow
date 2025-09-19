'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, Users, Star, Filter } from 'lucide-react'

export default function VideoTutorials() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Video Tutorials
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Learn GoodBuy HQ with step-by-step video guides created by our experts
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            All Categories
          </Button>
          <Button variant="ghost" size="sm">Getting Started</Button>
          <Button variant="ghost" size="sm">Advanced</Button>
          <Button variant="ghost" size="sm">Premium Features</Button>
        </div>
        <p className="text-sm text-muted-foreground">12 tutorials available</p>
      </div>

      {/* Featured Tutorial */}
      <Card className="mb-12 border-primary/20 bg-primary/5">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4">Featured Tutorial</Badge>
              <h2 className="text-2xl font-bold mb-4">Complete Beginner&apos;s Guide to Business Valuation</h2>
              <p className="text-muted-foreground mb-6">
                Learn everything you need to know to create your first professional business valuation with GoodBuy HQ. This comprehensive tutorial covers all the basics.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  22 minutes
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  2,341 views
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  4.9 rating
                </div>
              </div>
              <Button size="lg">
                <Play className="h-5 w-5 mr-2" />
                Watch Now
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-8 text-center">
              <Play className="h-16 w-16 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Video Preview</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: "Setting Up Your Account",
            description: "Quick setup guide to get started with GoodBuy HQ in 5 minutes",
            duration: "5 min",
            views: "1,523",
            level: "Beginner",
            isPremium: false
          },
          {
            title: "Document Upload Best Practices",
            description: "Learn how to prepare and upload your financial documents for optimal results",
            duration: "8 min",
            views: "987",
            level: "Beginner",
            isPremium: false
          },
          {
            title: "Understanding Your Valuation Report",
            description: "Deep dive into interpreting your business valuation results and recommendations",
            duration: "15 min",
            views: "2,103",
            level: "Intermediate",
            isPremium: false
          },
          {
            title: "Market Intelligence Dashboard",
            description: "Explore industry trends and competitive positioning with our premium tools",
            duration: "12 min",
            views: "756",
            level: "Advanced",
            isPremium: true
          },
          {
            title: "Setting Up Progress Tracking",
            description: "Monitor your business improvements and track value growth over time",
            duration: "10 min",
            views: "645",
            level: "Advanced",
            isPremium: true
          },
          {
            title: "Industry Benchmarking Analysis",
            description: "Compare your business performance against industry peers and competitors",
            duration: "14 min",
            views: "892",
            level: "Advanced",
            isPremium: true
          }
        ].map((tutorial, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                <Play className="h-12 w-12 text-primary" />
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant={tutorial.level === 'Beginner' ? 'default' : tutorial.level === 'Intermediate' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {tutorial.level}
                </Badge>
                {tutorial.isPremium && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                    PRO
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold mb-2">{tutorial.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {tutorial.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tutorial.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {tutorial.views} views
                </div>
              </div>
              
              <Button 
                variant={tutorial.isPremium ? "outline" : "default"} 
                size="sm" 
                className="w-full"
                disabled={tutorial.isPremium}
              >
                <Play className="h-4 w-4 mr-2" />
                {tutorial.isPremium ? "Upgrade Required" : "Watch"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <Card className="bg-muted">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to become a valuation expert?</h2>
          <p className="text-muted-foreground mb-6">
            Unlock all premium tutorials and advanced training content
          </p>
          <div className="space-x-4">
            <Button>
              Upgrade to Professional
            </Button>
            <Button variant="outline">
              Browse Free Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}