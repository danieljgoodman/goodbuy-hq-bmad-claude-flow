'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommunityPost, CommunityReply } from '@/types'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Star,
  Clock,
  User,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Trophy
} from 'lucide-react'
import { PostViewer } from './PostViewer'

interface CommunityForumProps {
  posts?: CommunityPost[]
  currentUserId: string
  onPostCreate?: (post: Omit<CommunityPost, 'id' | 'created_at' | 'updated_at'>) => Promise<string>
  onPostVote?: (postId: string, vote: 'up' | 'down') => Promise<void>
  onReplyCreate?: (postId: string, content: string) => Promise<void>
  onPostSelect?: (postId: string) => void
}

export function CommunityForum({
  posts = [],
  currentUserId,
  onPostCreate,
  onPostVote,
  onReplyCreate,
  onPostSelect
}: CommunityForumProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  
  // Create post form state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    type: 'discussion' as CommunityPost['type'],
    tags: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for demonstration
  const mockPosts: CommunityPost[] = [
    {
      id: 'post_1',
      userId: 'user_2',
      title: 'How do you interpret Health Score dimensions?',
      content: 'I\'m having trouble understanding what factors contribute most to my operational efficiency score. My financial metrics look good, but operational is lagging. Any insights?',
      category: 'Health Score',
      type: 'question',
      tags: ['health-score', 'operational', 'metrics'],
      upvotes: 12,
      downvotes: 1,
      view_count: 89,
      reply_count: 7,
      is_featured: false,
      is_moderated: true,
      moderation_status: 'approved',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-21'),
      replies: [
        {
          id: 'reply_1',
          post_id: 'post_1',
          userId: 'user_3',
          content: 'Operational efficiency often comes down to process optimization and resource utilization. Check your inventory turnover rates and employee productivity metrics.',
          upvotes: 8,
          is_solution: false,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        }
      ]
    },
    {
      id: 'post_2',
      userId: currentUserId,
      title: 'Successfully increased valuation by 30% in 6 months',
      content: 'Wanted to share my success story using BMad\'s recommendations. By focusing on the top 3 improvement opportunities, I was able to significantly increase my business value. The key was improving cash flow management and expanding my customer base strategically.',
      category: 'Success Stories',
      type: 'success_story',
      tags: ['valuation', 'success', 'improvement-opportunities'],
      upvotes: 45,
      downvotes: 2,
      view_count: 234,
      reply_count: 15,
      is_featured: true,
      is_moderated: true,
      moderation_status: 'approved',
      created_at: new Date('2024-01-18'),
      updated_at: new Date('2024-01-21'),
      replies: []
    },
    {
      id: 'post_3',
      userId: 'user_4',
      title: 'Best practices for document upload and data quality',
      content: 'After struggling with document processing, I\'ve learned some best practices that might help others get better AI analysis results.',
      category: 'Tips & Tricks',
      type: 'tip',
      tags: ['documents', 'data-quality', 'best-practices'],
      upvotes: 23,
      downvotes: 0,
      view_count: 156,
      reply_count: 9,
      is_featured: false,
      is_moderated: true,
      moderation_status: 'approved',
      created_at: new Date('2024-01-19'),
      updated_at: new Date('2024-01-20'),
      replies: []
    }
  ]

  const allPosts = posts.length > 0 ? posts : mockPosts

  const filteredAndSortedPosts = React.useMemo(() => {
    let filtered = allPosts

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType)
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
        break
      case 'trending':
        // Simple trending algorithm based on recent activity and votes
        filtered.sort((a, b) => {
          const aScore = (a.upvotes - a.downvotes) + (a.reply_count * 2) + (a.view_count * 0.1)
          const bScore = (b.upvotes - b.downvotes) + (b.reply_count * 2) + (b.view_count * 0.1)
          return bScore - aScore
        })
        break
      default:
        filtered.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
        break
    }

    return filtered
  }, [allPosts, searchQuery, selectedCategory, selectedType, sortBy])

  const getPostsByTab = (tab: string) => {
    switch (tab) {
      case 'featured':
        return filteredAndSortedPosts.filter(post => post.is_featured)
      case 'my_posts':
        return filteredAndSortedPosts.filter(post => post.userId === currentUserId)
      case 'questions':
        return filteredAndSortedPosts.filter(post => post.type === 'question')
      case 'success_stories':
        return filteredAndSortedPosts.filter(post => post.type === 'success_story')
      default:
        return filteredAndSortedPosts
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.title.trim() || !newPost.content.trim()) return

    setIsSubmitting(true)
    try {
      const postData = {
        userId: currentUserId,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        type: newPost.type,
        tags: newPost.tags,
        upvotes: 0,
        downvotes: 0,
        view_count: 0,
        reply_count: 0,
        is_featured: false,
        is_moderated: false,
        moderation_status: 'pending' as const,
        replies: []
      }

      const postId = await onPostCreate?.(postData) || `post_${Date.now()}`
      
      // Reset form
      setNewPost({
        title: '',
        content: '',
        category: '',
        type: 'discussion',
        tags: []
      })
      setShowCreateModal(false)
      
      console.log('Post created:', postId)
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (postId: string, vote: 'up' | 'down') => {
    try {
      await onPostVote?.(postId, vote)
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

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

  if (selectedPost) {
    return (
      <PostViewer
        post={selectedPost}
        currentUserId={currentUserId}
        onBack={() => setSelectedPost(null)}
        onVote={onPostVote}
        onReplyCreate={onReplyCreate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Community Forum
          </h1>
          <p className="text-gray-600">
            Connect with other BMad users, share experiences, and get help
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="Health Score">Health Score</option>
              <option value="Valuation">Valuation</option>
              <option value="Success Stories">Success Stories</option>
              <option value="Tips & Tricks">Tips & Tricks</option>
              <option value="General">General</option>
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="question">Questions</option>
            <option value="discussion">Discussions</option>
            <option value="success_story">Success Stories</option>
            <option value="tip">Tips</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="success_stories">Success Stories</TabsTrigger>
          <TabsTrigger value="my_posts">My Posts</TabsTrigger>
        </TabsList>

        {['all', 'featured', 'questions', 'success_stories', 'my_posts'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="space-y-4">
              {getPostsByTab(tab).map((post) => (
                <Card 
                  key={post.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPost(post)
                    onPostSelect?.(post.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Vote Column */}
                      <div className="flex flex-col items-center space-y-1 w-16">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(post.id, 'up')
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ArrowUp className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          {post.upvotes - post.downvotes}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVote(post.id, 'down')
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ArrowDown className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
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
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.userId === currentUserId ? 'You' : 'User'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(post.updated_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count} views
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.reply_count} replies
                          </div>
                          {post.replies.some(reply => reply.is_solution) && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Solved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getPostsByTab(tab).length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-600 mb-4">
                  {tab === 'all' 
                    ? 'Be the first to start a conversation!'
                    : `No ${tab.replace('_', ' ')} available yet`
                  }
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="What's your post about?"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select category</option>
                      <option value="Health Score">Health Score</option>
                      <option value="Valuation">Valuation</option>
                      <option value="Success Stories">Success Stories</option>
                      <option value="Tips & Tricks">Tips & Tricks</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post Type
                    </label>
                    <select
                      value={newPost.type}
                      onChange={(e) => setNewPost({...newPost, type: e.target.value as any})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="discussion">Discussion</option>
                      <option value="question">Question</option>
                      <option value="success_story">Success Story</option>
                      <option value="tip">Tip</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    placeholder="Share your thoughts, experience, or question..."
                    rows={8}
                    className="w-full p-3 border rounded-lg resize-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <Input
                    placeholder="Enter tags separated by commas (e.g., valuation, metrics, tips)"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      setNewPost({...newPost, tags})
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tags help others find your post
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Publishing...' : 'Publish Post'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}