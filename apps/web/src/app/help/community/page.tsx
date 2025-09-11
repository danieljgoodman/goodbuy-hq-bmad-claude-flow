'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar'
import { Users, MessageCircle, TrendingUp, Award, Plus, ThumbsUp, Reply, Clock } from 'lucide-react'

export default function Community() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Community Forum
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow business owners, share experiences, and learn from the GoodBuy HQ community
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-sm text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">1,256</div>
            <p className="text-sm text-muted-foreground">Discussions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">89%</div>
            <p className="text-sm text-muted-foreground">Questions Answered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">156</div>
            <p className="text-sm text-muted-foreground">Expert Contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button variant="outline">All Topics</Button>
          <Button variant="ghost">Popular</Button>
          <Button variant="ghost">Unanswered</Button>
          <Button variant="ghost">Success Stories</Button>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Start Discussion
        </Button>
      </div>

      {/* Discussion List */}
      <div className="space-y-6 mb-12">
        {[
          {
            title: "How do I improve my business value before selling?",
            author: "Sarah M.",
            authorInitials: "SM",
            category: "General Discussion",
            replies: 12,
            likes: 24,
            timeAgo: "2 hours ago",
            isAnswered: true,
            isPopular: true
          },
          {
            title: "Understanding the difference between market value and book value",
            author: "Michael R.",
            authorInitials: "MR",
            category: "Valuation Methods",
            replies: 8,
            likes: 16,
            timeAgo: "4 hours ago",
            isAnswered: true,
            isPopular: false
          },
          {
            title: "Success Story: Increased my business value by 40% in 6 months",
            author: "Jennifer L.",
            authorInitials: "JL",
            category: "Success Stories",
            replies: 23,
            likes: 67,
            timeAgo: "1 day ago",
            isAnswered: false,
            isPopular: true
          },
          {
            title: "Best practices for preparing financial documents?",
            author: "David K.",
            authorInitials: "DK",
            category: "Getting Started",
            replies: 5,
            likes: 11,
            timeAgo: "2 days ago",
            isAnswered: false,
            isPopular: false
          }
        ].map((discussion, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg hover:text-primary cursor-pointer">
                      {discussion.title}
                    </h3>
                    {discussion.isAnswered && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Answered
                      </Badge>
                    )}
                    {discussion.isPopular && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🔥 Popular
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{discussion.authorInitials}</AvatarFallback>
                      </Avatar>
                      <span>{discussion.author}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {discussion.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {discussion.timeAgo}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Reply className="h-4 w-4" />
                      {discussion.replies} replies
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      {discussion.likes} likes
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  View Discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Guidelines */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>
              Help us maintain a helpful and respectful community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Be respectful and professional in all interactions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Search before posting to avoid duplicate questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Provide context and details in your questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Mark helpful answers as solutions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Share your success stories to inspire others
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Categories</CardTitle>
            <CardDescription>
              Browse discussions by topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "General Discussion", count: 342 },
                { name: "Valuation Methods", count: 156 },
                { name: "Success Stories", count: 89 },
                { name: "Getting Started", count: 234 },
                { name: "Premium Features", count: 78 }
              ].map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer">
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}