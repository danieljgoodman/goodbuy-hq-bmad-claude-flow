'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoContent, TutorialProgress } from '@/types'
import { 
  Play, 
  Clock, 
  Eye, 
  Star, 
  Search, 
  Filter,
  Grid,
  List,
  BookOpen,
  TrendingUp,
  CheckCircle,
  PlayCircle,
  Users
} from 'lucide-react'

interface VideoLibraryProps {
  videos?: VideoContent[]
  userProgress?: Record<string, TutorialProgress>
  onVideoSelect: (video: VideoContent) => void
  showProgress?: boolean
}

export function VideoLibrary({
  videos = [],
  userProgress = {},
  onVideoSelect,
  showProgress = true
}: VideoLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'duration' | 'progress'>('recent')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Mock data for demonstration
  const mockVideos: VideoContent[] = [
    {
      id: 'video_1',
      title: 'Understanding Business Valuation Fundamentals',
      description: 'Learn the core concepts of business valuation including asset-based, income-based, and market-based approaches used by our AI system.',
      video_url: '/videos/valuation-fundamentals.mp4',
      thumbnail_url: '/thumbnails/valuation-fundamentals.jpg',
      duration: 1200, // 20 minutes
      category: 'Valuation',
      tags: ['valuation', 'fundamentals', 'methodology'],
      difficulty: 'beginner',
      transcript: 'Business valuation is the process of determining the economic value...',
      chapters: [
        {
          id: 'ch_1_1',
          title: 'Introduction to Valuation',
          start_time: 0,
          end_time: 180,
          description: 'Overview of what business valuation means'
        },
        {
          id: 'ch_1_2',
          title: 'Asset-Based Approach',
          start_time: 180,
          end_time: 480,
          description: 'Understanding asset valuation methods'
        },
        {
          id: 'ch_1_3',
          title: 'Income-Based Approach',
          start_time: 480,
          end_time: 780,
          description: 'DCF and earnings-based valuations'
        },
        {
          id: 'ch_1_4',
          title: 'Market-Based Approach',
          start_time: 780,
          end_time: 1200,
          description: 'Comparable company analysis'
        }
      ],
      view_count: 3450,
      premium_only: false,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: 'video_2',
      title: 'Advanced Financial Modeling Techniques',
      description: 'Deep dive into sophisticated modeling approaches including sensitivity analysis, Monte Carlo simulations, and scenario planning.',
      video_url: '/videos/advanced-modeling.mp4',
      thumbnail_url: '/thumbnails/advanced-modeling.jpg',
      duration: 2100, // 35 minutes
      category: 'Analysis',
      tags: ['modeling', 'financial-analysis', 'advanced'],
      difficulty: 'advanced',
      transcript: 'Advanced financial modeling requires understanding...',
      chapters: [
        {
          id: 'ch_2_1',
          title: 'Model Structure & Design',
          start_time: 0,
          end_time: 420,
          description: 'Building robust financial models'
        },
        {
          id: 'ch_2_2',
          title: 'Sensitivity Analysis',
          start_time: 420,
          end_time: 840,
          description: 'Testing model assumptions'
        },
        {
          id: 'ch_2_3',
          title: 'Monte Carlo Simulations',
          start_time: 840,
          end_time: 1470,
          description: 'Probabilistic modeling approaches'
        },
        {
          id: 'ch_2_4',
          title: 'Scenario Planning',
          start_time: 1470,
          end_time: 2100,
          description: 'Building multiple scenarios'
        }
      ],
      view_count: 1890,
      premium_only: true,
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: 'video_3',
      title: 'Health Score Dashboard Walkthrough',
      description: 'Complete guide to understanding and interpreting your business health score across all five dimensions.',
      video_url: '/videos/health-score-guide.mp4',
      thumbnail_url: '/thumbnails/health-score-guide.jpg',
      duration: 900, // 15 minutes
      category: 'Health Score',
      tags: ['health-score', 'dashboard', 'interpretation'],
      difficulty: 'intermediate',
      transcript: 'Your business health score provides insights...',
      chapters: [
        {
          id: 'ch_3_1',
          title: 'Health Score Overview',
          start_time: 0,
          end_time: 180,
          description: 'Understanding the overall score'
        },
        {
          id: 'ch_3_2',
          title: 'Financial Dimension',
          start_time: 180,
          end_time: 360,
          description: 'Financial health indicators'
        },
        {
          id: 'ch_3_3',
          title: 'Operational & Market Dimensions',
          start_time: 360,
          end_time: 630,
          description: 'Operations and market positioning'
        },
        {
          id: 'ch_3_4',
          title: 'Risk & Growth Analysis',
          start_time: 630,
          end_time: 900,
          description: 'Risk assessment and growth potential'
        }
      ],
      view_count: 2750,
      premium_only: false,
      created_at: new Date('2024-01-25'),
      updated_at: new Date('2024-01-25')
    }
  ]

  const allVideos = videos.length > 0 ? videos : mockVideos

  const filteredAndSortedVideos = React.useMemo(() => {
    let filtered = allVideos

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category === selectedCategory)
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(video => video.difficulty === selectedDifficulty)
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.view_count - a.view_count)
        break
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration)
        break
      case 'progress':
        filtered.sort((a, b) => {
          const progressA = userProgress[a.id]?.progress_percentage || 0
          const progressB = userProgress[b.id]?.progress_percentage || 0
          return progressB - progressA
        })
        break
      default:
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        break
    }

    return filtered
  }, [allVideos, searchQuery, selectedCategory, selectedDifficulty, sortBy, userProgress])

  const getVideosByTab = (tab: string) => {
    switch (tab) {
      case 'in_progress':
        return filteredAndSortedVideos.filter(video => {
          const progress = userProgress[video.id]
          return progress && progress.progress_percentage > 0 && progress.progress_percentage < 100
        })
      case 'completed':
        return filteredAndSortedVideos.filter(video => {
          const progress = userProgress[video.id]
          return progress && progress.completed
        })
      case 'bookmarked':
        return filteredAndSortedVideos.filter(video => {
          const progress = userProgress[video.id]
          return progress && progress.bookmarks && progress.bookmarks.length > 0
        })
      default:
        return filteredAndSortedVideos
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (videoId: string) => {
    return userProgress[videoId]?.progress_percentage || 0
  }

  const VideoCard = ({ video }: { video: VideoContent }) => {
    const progress = getProgressPercentage(video.id)
    const isCompleted = userProgress[video.id]?.completed || false
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div 
          className="relative"
          onClick={() => onVideoSelect(video)}
        >
          <div className="aspect-video bg-gray-200 relative overflow-hidden">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
                <PlayCircle className="h-12 w-12 text-blue-600" />
              </div>
            )}
            
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-3 scale-0 group-hover:scale-100 transition-transform duration-200">
                <Play className="h-6 w-6 text-gray-900 ml-0.5" />
              </div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>

            {/* Progress Bar */}
            {showProgress && progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-25">
                <div 
                  className="h-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Completed Badge */}
            {isCompleted && (
              <div className="absolute top-2 left-2 bg-green-600 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}

            {/* Premium Badge */}
            {video.premium_only && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                <Star className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {video.description}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className={getDifficultyColor(video.difficulty)}
                >
                  {video.difficulty}
                </Badge>
                <Badge variant="outline">
                  {video.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {video.view_count.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.duration)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const VideoListItem = ({ video }: { video: VideoContent }) => {
    const progress = getProgressPercentage(video.id)
    const isCompleted = userProgress[video.id]?.completed || false
    
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onVideoSelect(video)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
                    <PlayCircle className="h-6 w-6 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
              {isCompleted && (
                <div className="absolute top-1 left-1 bg-green-600 text-white rounded-full p-0.5">
                  <CheckCircle className="h-3 w-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={getDifficultyColor(video.difficulty)}
                    >
                      {video.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {video.category}
                    </Badge>
                    {video.premium_only && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.view_count.toLocaleString()} views
                    </div>
                    <span>Updated {video.updated_at.toLocaleDateString()}</span>
                  </div>

                  {showProgress && progress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(progress)}% complete
                      </p>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Watch
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Tutorials
          </h1>
          <p className="text-gray-600">
            Learn BMad through comprehensive video tutorials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos..."
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
              <option value="Valuation">Valuation</option>
              <option value="Health Score">Health Score</option>
              <option value="Analysis">Analysis</option>
              <option value="Market Intelligence">Market Intelligence</option>
            </select>
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="duration">Duration</option>
            {showProgress && <option value="progress">Progress</option>}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Videos</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
        </TabsList>

        {['all', 'in_progress', 'completed', 'bookmarked'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {getVideosByTab(tab).map((video) => 
                  viewMode === 'grid' ? (
                    <VideoCard key={video.id} video={video} />
                  ) : (
                    <VideoListItem key={video.id} video={video} />
                  )
                )}
              </div>
            )}

            {getVideosByTab(tab).length === 0 && !loading && (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No videos found
                </h3>
                <p className="text-gray-600">
                  {tab === 'all' 
                    ? 'Try adjusting your search or filters'
                    : `No ${tab.replace('_', ' ')} videos available`
                  }
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}