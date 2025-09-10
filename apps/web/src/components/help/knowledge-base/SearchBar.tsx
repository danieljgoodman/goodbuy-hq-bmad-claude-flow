'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpContent } from '@/types'
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  BookOpen,
  Zap,
  ArrowUpRight
} from 'lucide-react'

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  placeholder?: string
  suggestions?: HelpContent[]
  onSuggestionSelect?: (article: HelpContent) => void
  showSuggestions?: boolean
  popularSearches?: string[]
}

export function SearchBar({
  query,
  onQueryChange,
  placeholder = "Search articles, guides, and tutorials...",
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = true,
  popularSearches = ['business valuation', 'health score', 'market analysis', 'financial metrics']
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('bmad_recent_searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const updated = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5)
      
      setRecentSearches(updated)
      localStorage.setItem('bmad_recent_searches', JSON.stringify(updated))
    }
    
    onQueryChange(searchQuery)
    setIsFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('bmad_recent_searches')
  }

  const filteredSuggestions = suggestions.filter(suggestion =>
    query.trim() && (
      suggestion.title.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.content.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
  ).slice(0, 5)

  const shouldShowDropdown = isFocused && showSuggestions && (
    !query.trim() || filteredSuggestions.length > 0
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen className="h-3 w-3" />
      case 'tutorial': return <Zap className="h-3 w-3" />
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

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 py-3 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQueryChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {shouldShowDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Suggestions from search query */}
            {query.trim() && filteredSuggestions.length > 0 && (
              <div className="border-b">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  Suggested Articles
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => {
                        onSuggestionSelect?.(article)
                        setIsFocused(false)
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 mt-0.5">
                          {getTypeIcon(article.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {article.title}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getDifficultyColor(article.difficulty)}`}
                            >
                              {article.difficulty}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {article.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {article.view_count} views
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!query.trim() && recentSearches.length > 0 && (
              <div className="border-b">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                  <span className="text-xs font-medium text-gray-500">
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 h-auto p-0"
                  >
                    Clear
                  </Button>
                </div>
                <div className="py-1">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {!query.trim() && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  Popular Searches
                </div>
                <div className="py-1">
                  {popularSearches.map((search, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {query.trim() && filteredSuggestions.length === 0 && (
              <div className="px-3 py-8 text-center">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  No articles found for "{query}"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(query)}
                  className="text-xs"
                >
                  Search anyway
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}