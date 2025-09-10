'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpContent } from '@/types'
import { 
  BookOpen, 
  Search, 
  Filter, 
  Clock, 
  Eye, 
  ThumbsUp,
  Star,
  TrendingUp,
  Users
} from 'lucide-react'
import { SearchBar } from './SearchBar'
import { ArticleViewer } from './ArticleViewer'
import { CategoryTree } from './CategoryTree'

interface KnowledgeBaseLayoutProps {
  initialArticles?: HelpContent[]
  categories?: string[]
  onArticleSelect?: (articleId: string) => void
}

export function KnowledgeBaseLayout({
  initialArticles = [],
  categories = [],
  onArticleSelect
}: KnowledgeBaseLayoutProps) {
  const [articles, setArticles] = useState<HelpContent[]>(initialArticles)
  const [selectedArticle, setSelectedArticle] = useState<HelpContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular' | 'helpful'>('relevance')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    if (initialArticles.length === 0) {
      loadArticles()
    }
  }, [])

  const loadArticles = async () => {
    setLoading(true)
    try {
      // In real implementation, fetch from API
      const mockArticles: HelpContent[] = [
        {
          id: 'kb_1',
          title: 'Understanding Your Business Valuation',
          content: 'Business valuation is a comprehensive process that determines the economic value of your company. Our AI system uses multiple methodologies including asset-based, income-based, and market-based approaches to provide you with an accurate assessment.',
          category: 'Valuation',
          subcategory: 'Fundamentals',
          type: 'article',
          difficulty: 'beginner',
          tags: ['valuation', 'fundamentals', 'methodology'],
          related_articles: ['kb_2', 'kb_3'],
          view_count: 2150,
          helpful_votes: 187,
          premium_only: false,
          last_updated: new Date('2024-01-15'),
          author: 'BMad AI',
          status: 'published',
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 'kb_2',
          title: 'Interpreting Health Score Metrics',
          content: 'Your business health score is calculated across five key dimensions: Financial stability, Operational efficiency, Market position, Risk assessment, and Growth potential. Each dimension contributes to your overall score.',
          category: 'Health Score',
          subcategory: 'Interpretation',
          type: 'guide',
          difficulty: 'intermediate',
          tags: ['health-score', 'metrics', 'analysis'],
          related_articles: ['kb_1', 'kb_4'],
          view_count: 1890,
          helpful_votes: 165,
          premium_only: false,
          last_updated: new Date('2024-01-20'),
          author: 'BMad AI',
          status: 'published',
          created_at: new Date('2024-01-12'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 'kb_3',
          title: 'Advanced Financial Analysis Techniques',
          content: 'Deep dive into sophisticated financial analysis methods including DCF modeling, comparable company analysis, precedent transaction analysis, and sensitivity analysis for comprehensive business evaluation.',
          category: 'Analysis',
          subcategory: 'Advanced Techniques',
          type: 'tutorial',
          difficulty: 'advanced',
          tags: ['financial-analysis', 'dcf', 'modeling'],
          related_articles: ['kb_1', 'kb_5'],
          view_count: 945,
          helpful_votes: 89,
          premium_only: true,
          last_updated: new Date('2024-01-25'),
          author: 'BMad AI',
          status: 'published',
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-01-25')
        },
        {
          id: 'kb_4',
          title: 'Market Intelligence Dashboard Guide',
          content: 'Learn how to navigate and interpret your market intelligence dashboard, including trend analysis, competitive positioning, and market opportunities identification.',
          category: 'Market Intelligence',
          subcategory: 'Dashboard',
          type: 'guide',
          difficulty: 'intermediate',
          tags: ['market-intelligence', 'dashboard', 'trends'],
          related_articles: ['kb_2', 'kb_6'],
          view_count: 1320,
          helpful_votes: 112,
          premium_only: false,
          last_updated: new Date('2024-02-01'),
          author: 'BMad AI',
          status: 'published',
          created_at: new Date('2024-01-28'),
          updated_at: new Date('2024-02-01')
        }
      ]
      
      setArticles(mockArticles)
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedArticles = React.useMemo(() => {
    let filtered = articles

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.category === selectedCategory
      )
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(article => 
        article.difficulty === selectedDifficulty
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.last_updated.getTime() - a.last_updated.getTime())
        break
      case 'popular':
        filtered.sort((a, b) => b.view_count - a.view_count)
        break
      case 'helpful':
        filtered.sort((a, b) => b.helpful_votes - a.helpful_votes)
        break
      default:
        // Keep current order for relevance
        break
    }

    return filtered
  }, [articles, searchQuery, selectedCategory, selectedDifficulty, sortBy])

  const handleArticleSelect = (article: HelpContent) => {
    setSelectedArticle(article)
    onArticleSelect?.(article.id)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen className="h-4 w-4" />
      case 'tutorial': return <Users className="h-4 w-4" />
      case 'guide': return <TrendingUp className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  if (selectedArticle) {
    return (
      <ArticleViewer
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        relatedArticles={articles.filter(a => 
          selectedArticle.related_articles.includes(a.id)
        )}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Knowledge Base
        </h1>
        <p className="text-gray-600">
          Find answers, guides, and tutorials to help you make the most of BMad
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            placeholder="Search articles, guides, and tutorials..."
          />

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Valuation">Valuation</option>
                <option value="Health Score">Health Score</option>
                <option value="Analysis">Analysis</option>
                <option value="Market Intelligence">Market Intelligence</option>
              </select>
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        <TabsContent value="browse" className="space-y-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedArticles.map((article) => (
                <Card
                  key={article.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleArticleSelect(article)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-blue-600">
                        {getTypeIcon(article.type)}
                        <CardTitle className="text-lg hover:text-blue-700 transition-colors">
                          {article.title}
                        </CardTitle>
                        {article.premium_only && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={getDifficultyColor(article.difficulty)}
                      >
                        {article.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {article.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {article.helpful_votes}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.last_updated.toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredAndSortedArticles.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular">
          <div className="grid gap-4">
            {articles
              .sort((a, b) => b.view_count - a.view_count)
              .slice(0, 10)
              .map((article) => (
                <Card
                  key={article.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleArticleSelect(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(article.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Eye className="h-3 w-3" />
                            {article.view_count} views
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {article.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid gap-4">
            {articles
              .sort((a, b) => b.last_updated.getTime() - a.last_updated.getTime())
              .slice(0, 10)
              .map((article) => (
                <Card
                  key={article.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleArticleSelect(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(article.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Updated {article.last_updated.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {article.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryTree
            articles={articles}
            onArticleSelect={handleArticleSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}