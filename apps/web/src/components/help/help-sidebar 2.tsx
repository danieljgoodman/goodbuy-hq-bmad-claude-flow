'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  HelpCircle, 
  Search, 
  ChevronRight, 
  BookOpen, 
  Video, 
  FileText,
  X,
  ExternalLink
} from 'lucide-react'
import { useHelp } from '@/contexts/help-context'
import { contextualHelpItems, HelpItem } from '@/contexts/help-context'

interface HelpArticle {
  id: string
  title: string
  summary: string
  content: string
  category: 'getting-started' | 'evaluations' | 'features' | 'troubleshooting' | 'account'
  tags: string[]
  lastUpdated: Date
  readTime: string
  videoUrl?: string
}

// Sample help articles that would normally come from a CMS
const helpArticles: HelpArticle[] = [
  {
    id: 'understanding-business-valuation',
    title: 'Understanding Business Valuation Basics',
    summary: 'Learn the fundamental concepts behind business valuation and how our AI calculates your business worth.',
    content: 'Business valuation is the process of determining the economic value of a business...',
    category: 'getting-started',
    tags: ['valuation', 'basics', 'ebitda', 'revenue-multiples'],
    lastUpdated: new Date('2024-01-15'),
    readTime: '5 min read',
    videoUrl: 'https://example.com/valuation-basics'
  },
  {
    id: 'creating-first-evaluation',
    title: 'Creating Your First Evaluation',
    summary: 'Step-by-step guide to completing your first business valuation questionnaire.',
    content: 'Follow these steps to create your first evaluation...',
    category: 'evaluations',
    tags: ['evaluation', 'questionnaire', 'getting-started'],
    lastUpdated: new Date('2024-01-10'),
    readTime: '8 min read'
  },
  {
    id: 'interpreting-results',
    title: 'How to Interpret Your Valuation Results',
    summary: 'Understand your valuation report, health score, and improvement opportunities.',
    content: 'Your valuation results include several key components...',
    category: 'evaluations',
    tags: ['results', 'health-score', 'opportunities'],
    lastUpdated: new Date('2024-01-08'),
    readTime: '6 min read'
  },
  {
    id: 'premium-features-guide',
    title: 'Premium Features Overview',
    summary: 'Explore the advanced features available with premium subscription.',
    content: 'Premium subscribers get access to enhanced features...',
    category: 'features',
    tags: ['premium', 'implementation-guides', 'progress-tracking'],
    lastUpdated: new Date('2024-01-12'),
    readTime: '4 min read'
  },
  {
    id: 'troubleshooting-common-issues',
    title: 'Troubleshooting Common Issues',
    summary: 'Solutions to frequently encountered problems and error messages.',
    content: 'Here are solutions to common issues you might encounter...',
    category: 'troubleshooting',
    tags: ['errors', 'troubleshooting', 'support'],
    lastUpdated: new Date('2024-01-05'),
    readTime: '7 min read'
  }
]

interface HelpSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
  const { getContextualHelp, trackHelpInteraction } = useHelp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const currentContext = typeof window !== 'undefined' ? window.location.pathname : ''
  const contextualHelp = getContextualHelp(currentContext)

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let filtered = helpArticles

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
  }, [searchQuery, selectedCategory])

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Topics', count: helpArticles.length },
    { id: 'getting-started', label: 'Getting Started', count: helpArticles.filter(a => a.category === 'getting-started').length },
    { id: 'evaluations', label: 'Evaluations', count: helpArticles.filter(a => a.category === 'evaluations').length },
    { id: 'features', label: 'Features', count: helpArticles.filter(a => a.category === 'features').length },
    { id: 'troubleshooting', label: 'Troubleshooting', count: helpArticles.filter(a => a.category === 'troubleshooting').length },
    { id: 'account', label: 'Account', count: helpArticles.filter(a => a.category === 'account').length }
  ]

  const handleArticleClick = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId)
    
    trackHelpInteraction(articleId, {
      type: 'viewed',
      context: currentContext,
      userTier: 'FREE' // This should come from auth
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'article':
        return <BookOpen className="w-4 h-4" />
      case 'tooltip':
      case 'popover':
        return <HelpCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Help & Support</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Contextual Help Section */}
          {contextualHelp.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 text-sm text-primary">Contextual Help</h3>
              <div className="space-y-2">
                {contextualHelp.map((helpItem) => (
                  <Card key={helpItem.id} className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="text-primary">
                          {getTypeIcon(helpItem.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{helpItem.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{helpItem.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {helpItem.type}
                            </Badge>
                            {helpItem.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                Important
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="my-4" />
            </div>
          )}

          {/* Category Filter */}
          <div>
            <h3 className="font-medium mb-3 text-sm">Categories</h3>
            <div className="grid grid-cols-1 gap-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                  className="justify-start h-8 text-sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span>{category.label}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Help Articles */}
          <div>
            <h3 className="font-medium mb-3 text-sm">
              Help Articles
              {searchQuery && (
                <span className="text-muted-foreground font-normal">
                  {' '}({filteredArticles.length} results)
                </span>
              )}
            </h3>
            
            {filteredArticles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No articles found</p>
                {searchQuery && (
                  <p className="text-xs">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight">{article.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={() => handleArticleClick(article.id)}
                          >
                            <ChevronRight className={`w-3 h-3 transition-transform ${
                              expandedArticle === article.id ? 'rotate-90' : ''
                            }`} />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {article.summary}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {article.category.replace('-', ' ')}
                            </Badge>
                            {article.videoUrl && (
                              <Badge variant="secondary" className="text-xs">
                                <Video className="w-3 h-3 mr-1" />
                                Video
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {article.readTime}
                          </span>
                        </div>

                        {expandedArticle === article.id && (
                          <div className="pt-3 border-t space-y-3">
                            <div className="text-sm text-muted-foreground leading-relaxed">
                              {article.content}
                            </div>
                            
                            {article.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {article.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-2">
                              {article.videoUrl && (
                                <Button size="sm" variant="outline" className="text-xs gap-1">
                                  <Video className="w-3 h-3" />
                                  Watch Video
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="text-xs gap-1">
                                <BookOpen className="w-3 h-3" />
                                Full Article
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Still need help? Contact our support team
          </p>
          <Button size="sm" className="w-full text-xs">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing help sidebar
export function useHelpSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const openSidebar = () => setIsOpen(true)
  const closeSidebar = () => setIsOpen(false)
  const toggleSidebar = () => setIsOpen(!isOpen)

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar
  }
}