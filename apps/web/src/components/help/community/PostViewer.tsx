'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CommunityPost, CommunityReply } from '@/types'
import { 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  MessageSquare,
  Eye,
  Clock,
  User,
  Send,
  Star,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Trophy,
  Flag,
  Share2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react'

interface PostViewerProps {
  post: CommunityPost
  currentUserId: string
  onBack: () => void
  onVote?: (postId: string, vote: 'up' | 'down') => Promise<void>
  onReplyCreate?: (postId: string, content: string) => Promise<void>
  onReplyVote?: (replyId: string, vote: 'up' | 'down') => Promise<void>
  onMarkSolution?: (replyId: string) => Promise<void>
}

export function PostViewer({
  post,
  currentUserId,
  onBack,
  onVote,
  onReplyCreate,
  onReplyVote,
  onMarkSolution
}: PostViewerProps) {
  const [newReply, setNewReply] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [sortRepliesBy, setSortRepliesBy] = useState<'oldest' | 'newest' | 'popular'>('oldest')

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReply.trim()) return

    setIsSubmitting(true)
    try {
      await onReplyCreate?.(post.id, newReply)
      setNewReply('')
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (vote: 'up' | 'down') => {
    try {
      await onVote?.(post.id, vote)
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const handleReplyVote = async (replyId: string, vote: 'up' | 'down') => {
    try {
      await onReplyVote?.(replyId, vote)
    } catch (error) {
      console.error('Failed to vote on reply:', error)
    }
  }

  const handleMarkSolution = async (replyId: string) => {
    try {
      await onMarkSolution?.(replyId)
    } catch (error) {
      console.error('Failed to mark solution:', error)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // In real implementation, sync with API
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: post.title,
        text: post.content.substring(0, 200) + '...',
        url: window.location.href
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        console.log('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  const sortedReplies = React.useMemo(() => {
    const sorted = [...post.replies]
    
    switch (sortRepliesBy) {
      case 'newest':
        return sorted.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      case 'popular':
        return sorted.sort((a, b) => b.upvotes - a.upvotes)
      default:
        return sorted.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    }
  }, [post.replies, sortRepliesBy])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="h-4 w-4" />
      case 'success_story': return <Trophy className="h-4 w-4" />
      case 'discussion': return <MessageSquare className="h-4 w-4" />
      case 'tip': return <Lightbulb className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800'
      case 'success_story': return 'bg-green-100 text-green-800'
      case 'discussion': return 'bg-gray-100 text-gray-800'
      case 'tip': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const hasSolution = post.replies.some(reply => reply.is_solution)
  const isAuthor = post.userId === currentUserId
  const canMarkSolution = isAuthor && post.type === 'question' && !hasSolution

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
      </div>

      {/* Post Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* Voting Column */}
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleVote('up')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowUp className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-lg font-semibold text-gray-700">
                {post.upvotes - post.downvotes}
              </span>
              <button
                onClick={() => handleVote('down')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowDown className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Post Header */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getTypeColor(post.type)}>
                  <span className="flex items-center gap-1">
                    {getTypeIcon(post.type)}
                    {post.type.replace('_', ' ')}
                  </span>
                </Badge>
                <Badge variant="outline">
                  {post.category}
                </Badge>
                {post.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {hasSolution && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Solved
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl mb-3">
                {post.title}
              </CardTitle>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {isAuthor ? 'You' : 'User'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTimeAgo(post.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count} views
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {post.content}
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Replies ({post.reply_count})
            </CardTitle>
            
            <select
              value={sortRepliesBy}
              onChange={(e) => setSortRepliesBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Reply Form */}
          <form onSubmit={handleSubmitReply} className="space-y-3">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="resize-none"
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={!newReply.trim() || isSubmitting}>
                {isSubmitting ? (
                  'Publishing...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Reply
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Replies List */}
          {sortedReplies.length > 0 ? (
            <div className="space-y-4">
              {sortedReplies.map((reply) => (
                <div 
                  key={reply.id}
                  className={`border rounded-lg p-4 ${
                    reply.is_solution ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Reply Voting */}
                    <div className="flex flex-col items-center space-y-1">
                      <button
                        onClick={() => handleReplyVote(reply.id, 'up')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ArrowUp className="h-3 w-3 text-gray-600" />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {reply.upvotes}
                      </span>
                    </div>

                    {/* Reply Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {reply.userId === currentUserId ? 'You' : 'User'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(reply.created_at)}
                          </div>
                          {reply.is_solution && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Solution
                            </Badge>
                          )}
                        </div>

                        {canMarkSolution && !reply.is_solution && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkSolution(reply.id)}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark as Solution
                          </Button>
                        )}
                      </div>

                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {reply.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No replies yet. Be the first to respond!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}