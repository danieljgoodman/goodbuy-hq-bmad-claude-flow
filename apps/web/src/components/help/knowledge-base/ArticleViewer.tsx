'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { HelpContent } from '@/types'
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  User,
  Calendar,
  Star,
  ChevronRight,
  MessageCircle
} from 'lucide-react'

interface ArticleViewerProps {
  article: HelpContent
  relatedArticles?: HelpContent[]
  onBack: () => void
  onArticleSelect?: (articleId: string) => void
  onFeedback?: (articleId: string, type: 'helpful' | 'not_helpful') => void
}

export function ArticleViewer({
  article,
  relatedArticles = [],
  onBack,
  onArticleSelect,
  onFeedback
}: ArticleViewerProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [hasVoted, setHasVoted] = useState<'helpful' | 'not_helpful' | null>(null)
  const [viewTracked, setViewTracked] = useState(false)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    // Track article view
    if (!viewTracked) {
      trackArticleView()
      setViewTracked(true)
    }

    // Check if article is bookmarked
    checkBookmarkStatus()
    
    // Check if user has already voted
    checkVoteStatus()
  }, [article.id])

  const trackArticleView = async () => {
    try {
      // In real implementation, send view tracking to API
      console.log('Tracking view for article:', article.id)
    } catch (error) {
      console.error('Failed to track article view:', error)
    }
  }

  const checkBookmarkStatus = () => {
    // In real implementation, check from API or localStorage
    const bookmarks = JSON.parse(localStorage.getItem('bmad_bookmarks') || '[]')
    setIsBookmarked(bookmarks.includes(article.id))
  }

  const checkVoteStatus = () => {
    // In real implementation, check from API or localStorage
    const votes = JSON.parse(localStorage.getItem('bmad_article_votes') || '{}')
    setHasVoted(votes[article.id] || null)
  }

  const handleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bmad_bookmarks') || '[]')
      let updated
      
      if (isBookmarked) {
        updated = bookmarks.filter((id: string) => id !== article.id)
      } else {
        updated = [...bookmarks, article.id]
      }
      
      localStorage.setItem('bmad_bookmarks', JSON.stringify(updated))
      setIsBookmarked(!isBookmarked)
      
      // In real implementation, also sync with API
      console.log(isBookmarked ? 'Removed bookmark' : 'Added bookmark', article.id)
    } catch (error) {
      console.error('Failed to update bookmark:', error)
    }
  }

  const handleFeedback = (type: 'helpful' | 'not_helpful') => {
    if (hasVoted) return // Prevent multiple votes
    
    try {
      const votes = JSON.parse(localStorage.getItem('bmad_article_votes') || '{}')
      votes[article.id] = type
      localStorage.setItem('bmad_article_votes', JSON.stringify(votes))
      setHasVoted(type)
      
      onFeedback?.(article.id, type)
      
      // In real implementation, send to API
      console.log('Feedback submitted:', type, 'for article:', article.id)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: article.title,
        text: article.content.substring(0, 200) + '...',
        url: window.location.href
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
        // Show success message (you might want to use a toast here)
        console.log('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Failed to share article:', error)
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800'
      case 'tutorial': return 'bg-purple-100 text-purple-800'
      case 'guide': return 'bg-orange-100 text-orange-800'
      case 'faq': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
      </div>

      {/* Article Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getTypeColor(article.type)}>
                  {article.type}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={getDifficultyColor(article.difficulty)}
                >
                  {article.difficulty}
                </Badge>
                <Badge variant="outline">
                  {article.category}
                </Badge>
                {article.premium_only && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {article.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Updated {article.last_updated.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.view_count.toLocaleString()} views
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {article.helpful_votes} helpful
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className="flex items-center gap-2"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Article Content */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div 
            className="prose max-w-none prose-gray prose-headings:text-gray-900 prose-links:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Was this article helpful?
          </h3>
          
          <div className="flex items-center gap-4">
            <Button
              variant={hasVoted === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedback('helpful')}
              disabled={hasVoted !== null}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              {hasVoted === 'helpful' ? 'Marked as helpful' : 'Yes, helpful'}
            </Button>
            
            <Button
              variant={hasVoted === 'not_helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedback('not_helpful')}
              disabled={hasVoted !== null}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              {hasVoted === 'not_helpful' ? 'Marked as not helpful' : 'No, not helpful'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 ml-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Leave feedback
            </Button>
          </div>

          {showComments && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                placeholder="Tell us how we can improve this article..."
                className="w-full p-3 border rounded-md resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowComments(false)}>
                  Cancel
                </Button>
                <Button size="sm">
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Related Articles
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedArticles.map((relatedArticle) => (
                <div
                  key={relatedArticle.id}
                  onClick={() => onArticleSelect?.(relatedArticle.id)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {relatedArticle.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={getDifficultyColor(relatedArticle.difficulty)}
                      >
                        {relatedArticle.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedArticle.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{relatedArticle.view_count} views</span>
                      <span>{relatedArticle.helpful_votes} helpful</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}