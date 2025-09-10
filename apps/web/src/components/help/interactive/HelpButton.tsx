'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpContent, GuideStep } from '@/types'
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  PlayCircle, 
  MessageCircle, 
  ExternalLink,
  Star,
  Clock,
  Zap
} from 'lucide-react'

interface HelpButtonProps {
  context?: string
  position?: 'fixed' | 'relative'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function HelpButton({ 
  context,
  position = 'fixed',
  size = 'md',
  variant = 'default'
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [helpContent, setHelpContent] = useState<HelpContent[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search')

  useEffect(() => {
    if (isOpen && context) {
      loadContextualHelp()
    }
  }, [isOpen, context])

  const loadContextualHelp = async () => {
    setLoading(true)
    try {
      // Fetch contextual help based on current context
      const response = await fetch(`/api/help/contextual?context=${encodeURIComponent(context || 'general')}`)
      if (!response.ok) {
        throw new Error('Failed to fetch help content')
      }
      const data = await response.json()
      setHelpContent(data.content || [])
    } catch (error) {
      console.error('Failed to load help content:', error)
      setHelpContent([])
    } finally {
      setLoading(false)
    }
  }

  const searchHelp = async (query: string) => {
    if (!query.trim()) {
      loadContextualHelp()
      return
    }

    setLoading(true)
    try {
      // In real implementation, search help content
      const filteredContent = helpContent.filter(content =>
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.content.toLowerCase().includes(query.toLowerCase()) ||
        content.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      setHelpContent(filteredContent)
    } catch (error) {
      console.error('Failed to search help content:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTour = () => {
    console.log('Starting guided tour for context:', context)
    // In real implementation, launch guided tour
    setIsOpen(false)
  }

  const openSupport = () => {
    console.log('Opening support for context:', context)
    // In real implementation, open support chat/ticket
    setIsOpen(false)
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
      case 'tutorial': return <PlayCircle className="h-4 w-4" />
      case 'guide': return <Zap className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const buttonSizes = {
    sm: 'h-8 w-8 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-12 w-12 p-0'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 right-6 z-50' 
    : 'relative'

  return (
    <div className={positionClasses}>
      {/* Help Button */}
      <Button
        variant={variant}
        className={buttonSizes[size]}
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle className={iconSizes[size]} />
      </Button>

      {/* Help Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          {position === 'fixed' && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Help Panel */}
          <Card className={`
            ${position === 'fixed' ? 'fixed bottom-20 right-6 z-50' : 'absolute bottom-full right-0 mb-2'}
            w-96 max-w-sm shadow-xl border
          `}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                Help Center
              </CardTitle>
              {context && (
                <p className="text-sm text-gray-600">
                  Context: <span className="font-medium">{context}</span>
                </p>
              )}
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="search">
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="tour">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Tour
                  </TabsTrigger>
                  <TabsTrigger value="support">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Support
                  </TabsTrigger>
                </TabsList>

                {/* Search Tab */}
                <TabsContent value="search" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search help articles..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchHelp(e.target.value)
                      }}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : helpContent.length > 0 ? (
                      helpContent.map((content) => (
                        <div
                          key={content.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            console.log('Open article:', content.id)
                            setIsOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-blue-600 mt-0.5">
                              {getTypeIcon(content.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {content.title}
                                </h4>
                                {content.premium_only && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {content.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getDifficultyColor(content.difficulty)}`}
                                >
                                  {content.difficulty}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {content.view_count} views
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No help articles found
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tour Tab */}
                <TabsContent value="tour" className="space-y-4">
                  <div className="text-center">
                    <PlayCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-medium mb-2">Interactive Tour</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Take a guided tour to learn how to use this feature effectively.
                    </p>
                    <Button onClick={startTour} className="w-full">
                      Start Tour
                    </Button>
                  </div>
                </TabsContent>

                {/* Support Tab */}
                <TabsContent value="support" className="space-y-4">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-medium mb-2">Need Personal Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Chat with our support team or create a support ticket for personalized assistance.
                    </p>
                    <div className="space-y-2">
                      <Button onClick={openSupport} className="w-full">
                        Start Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => console.log('Create ticket')}
                      >
                        Create Ticket
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Quick Links */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => console.log('Open knowledge base')}
                  >
                    <BookOpen className="h-3 w-3" />
                    Knowledge Base
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button 
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => console.log('Open video tutorials')}
                  >
                    <PlayCircle className="h-3 w-3" />
                    Video Tutorials
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}