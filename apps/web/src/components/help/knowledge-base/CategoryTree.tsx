'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HelpContent } from '@/types'
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Users, 
  TrendingUp,
  Folder,
  FolderOpen,
  Star,
  Clock,
  Eye
} from 'lucide-react'

interface CategoryTreeProps {
  articles: HelpContent[]
  onArticleSelect: (article: HelpContent) => void
}

interface CategoryNode {
  name: string
  articles: HelpContent[]
  subcategories: Record<string, CategoryNode>
  totalCount: number
}

export function CategoryTree({ articles, onArticleSelect }: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Valuation']))

  // Build category tree structure
  const categoryTree = useMemo(() => {
    const tree: Record<string, CategoryNode> = {}

    articles.forEach(article => {
      const categoryName = article.category
      const subcategoryName = article.subcategory || 'General'

      // Initialize category if it doesn't exist
      if (!tree[categoryName]) {
        tree[categoryName] = {
          name: categoryName,
          articles: [],
          subcategories: {},
          totalCount: 0
        }
      }

      // Initialize subcategory if it doesn't exist
      if (!tree[categoryName].subcategories[subcategoryName]) {
        tree[categoryName].subcategories[subcategoryName] = {
          name: subcategoryName,
          articles: [],
          subcategories: {},
          totalCount: 0
        }
      }

      // Add article to appropriate subcategory
      tree[categoryName].subcategories[subcategoryName].articles.push(article)
      tree[categoryName].subcategories[subcategoryName].totalCount++
      tree[categoryName].totalCount++
    })

    return tree
  }, [articles])

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen className="h-3 w-3" />
      case 'tutorial': return <Users className="h-3 w-3" />
      case 'guide': return <TrendingUp className="h-3 w-3" />
      default: return <BookOpen className="h-3 w-3" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Valuation': <TrendingUp className="h-4 w-4" />,
      'Health Score': <BookOpen className="h-4 w-4" />,
      'Analysis': <Users className="h-4 w-4" />,
      'Market Intelligence': <TrendingUp className="h-4 w-4" />
    }
    return iconMap[categoryName] || <Folder className="h-4 w-4" />
  }

  const getCategoryColor = (categoryName: string) => {
    const colorMap: Record<string, string> = {
      'Valuation': 'border-blue-200 bg-blue-50',
      'Health Score': 'border-green-200 bg-green-50',
      'Analysis': 'border-purple-200 bg-purple-50',
      'Market Intelligence': 'border-orange-200 bg-orange-50'
    }
    return colorMap[categoryName] || 'border-gray-200 bg-gray-50'
  }

  return (
    <div className="space-y-4">
      {Object.entries(categoryTree).map(([categoryName, categoryData]) => {
        const isExpanded = expandedCategories.has(categoryName)
        
        return (
          <Card 
            key={categoryName} 
            className={`border-l-4 ${getCategoryColor(categoryName)}`}
          >
            <Collapsible
              open={isExpanded}
              onOpenChange={() => toggleCategory(categoryName)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-white/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(categoryName)}
                      <div>
                        <CardTitle className="text-lg">
                          {categoryName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {categoryData.totalCount} article{categoryData.totalCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {categoryData.totalCount}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {Object.entries(categoryData.subcategories).map(([subcategoryName, subcategoryData]) => (
                    <div key={subcategoryName} className="mb-6 last:mb-0">
                      {/* Subcategory Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">
                          {subcategoryName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {subcategoryData.totalCount}
                        </Badge>
                      </div>

                      {/* Articles in Subcategory */}
                      <div className="space-y-2">
                        {subcategoryData.articles.map((article) => (
                          <div
                            key={article.id}
                            onClick={() => onArticleSelect(article)}
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="text-blue-600 mt-0.5">
                              {getTypeIcon(article.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-sm leading-relaxed">
                                  {article.title}
                                </h4>
                                {article.premium_only && (
                                  <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {article.content}
                              </p>
                              
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getDifficultyColor(article.difficulty)}`}
                                >
                                  {article.difficulty}
                                </Badge>
                                
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {article.view_count}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {article.last_updated.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Quick Stats for Category */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">
                          {categoryData.articles.filter(a => a.difficulty === 'beginner').length}
                        </div>
                        <div className="text-gray-500">Beginner</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">
                          {categoryData.articles.filter(a => a.difficulty === 'intermediate').length}
                        </div>
                        <div className="text-gray-500">Intermediate</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">
                          {categoryData.articles.filter(a => a.difficulty === 'advanced').length}
                        </div>
                        <div className="text-gray-500">Advanced</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}

      {Object.keys(categoryTree).length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No categories found
          </h3>
          <p className="text-gray-600">
            Articles will be organized by category when available
          </p>
        </div>
      )}
    </div>
  )
}