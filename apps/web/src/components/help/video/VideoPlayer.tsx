'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { VideoContent, VideoChapter, TutorialProgress } from '@/types'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings,
  Bookmark,
  BookmarkCheck,
  List,
  MessageSquare,
  ThumbsUp,
  Share2
} from 'lucide-react'

interface VideoPlayerProps {
  video: VideoContent
  progress?: TutorialProgress
  onProgressUpdate?: (progressPercentage: number, currentTime: number) => void
  onBookmark?: (timestamp: number) => void
  onComplete?: () => void
  autoPlay?: boolean
  showChapters?: boolean
  showNotes?: boolean
}

export function VideoPlayer({
  video,
  progress,
  onProgressUpdate,
  onBookmark,
  onComplete,
  autoPlay = false,
  showChapters = true,
  showNotes = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChaptersList, setShowChaptersList] = useState(false)
  const [activeChapter, setActiveChapter] = useState<VideoChapter | null>(null)
  const [userNotes, setUserNotes] = useState(progress?.notes || '')
  const [bookmarks, setBookmarks] = useState<number[]>(progress?.bookmarks || [])
  
  const controlsTimeout = useRef<NodeJS.Timeout>()
  const progressUpdateInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set initial time from progress
    if (progress && progress.progress_percentage > 0) {
      const startTime = (progress.progress_percentage / 100) * video.duration
      video.currentTime = startTime
      setCurrentTime(startTime)
    }

    // Add event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Update active chapter
      const currentChapter = video.chapters?.find(chapter =>
        video.currentTime >= chapter.start_time && video.currentTime <= chapter.end_time
      )
      setActiveChapter(currentChapter || null)
      
      // Send progress updates
      const progressPercentage = (video.currentTime / video.duration) * 100
      onProgressUpdate?.(progressPercentage, video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    const handleLoadedMetadata = () => {
      if (progress && progress.progress_percentage > 0) {
        const startTime = (progress.progress_percentage / 100) * video.duration
        video.currentTime = startTime
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [progress, onProgressUpdate, onComplete])

  useEffect(() => {
    // Auto-hide controls
    if (showControls && isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [showControls, isPlaying])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (newTime: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.max(0, Math.min(video.duration, currentTime + seconds))
    handleSeek(newTime)
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const addBookmark = () => {
    const timestamp = Math.floor(currentTime)
    if (!bookmarks.includes(timestamp)) {
      const newBookmarks = [...bookmarks, timestamp].sort((a, b) => a - b)
      setBookmarks(newBookmarks)
      onBookmark?.(timestamp)
    }
  }

  const jumpToBookmark = (timestamp: number) => {
    handleSeek(timestamp)
  }

  const jumpToChapter = (chapter: VideoChapter) => {
    handleSeek(chapter.start_time)
    setShowChaptersList(false)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = videoRef.current ? (currentTime / videoRef.current.duration) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.thumbnail_url}
            className="w-full aspect-video"
            onMouseMove={() => setShowControls(true)}
            onClick={togglePlayPause}
          />
          
          {/* Video Controls Overlay */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div className="absolute bottom-16 left-4 right-4">
              <div className="relative">
                <Progress 
                  value={progressPercentage} 
                  className="h-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const percent = (e.clientX - rect.left) / rect.width
                    const newTime = percent * (videoRef.current?.duration || 0)
                    handleSeek(newTime)
                  }}
                />
                
                {/* Bookmarks */}
                {bookmarks.map((bookmark) => {
                  const position = videoRef.current ? (bookmark / videoRef.current.duration) * 100 : 0
                  return (
                    <button
                      key={bookmark}
                      className="absolute top-0 w-2 h-2 -mt-0.5 bg-yellow-400 rounded-full"
                      style={{ left: `${position}%` }}
                      onClick={() => jumpToBookmark(bookmark)}
                    />
                  )
                })}
              </div>
              
              <div className="flex items-center justify-between text-white text-sm mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(videoRef.current?.duration || 0)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(value) => handleVolumeChange(value[0])}
                    max={1}
                    step={0.1}
                    className="w-16"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                  className="bg-black/50 text-white text-sm rounded px-2 py-1"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addBookmark}
                  className="text-white hover:bg-white/20"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                {showChapters && video.chapters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChaptersList(!showChaptersList)}
                    className="text-white hover:bg-white/20"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{video.title}</CardTitle>
              <p className="text-gray-600 text-sm mb-3">{video.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{video.view_count.toLocaleString()} views</span>
                <span>{formatTime(video.duration)}</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {video.difficulty}
                </Badge>
                {video.premium_only && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Premium
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chapters List */}
        {showChapters && video.chapters.length > 0 && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Chapters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {video.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      onClick={() => jumpToChapter(chapter)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeChapter?.id === chapter.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-mono text-gray-500 min-w-0">
                        {formatTime(chapter.start_time)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{chapter.title}</h4>
                        {chapter.description && (
                          <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                        )}
                      </div>
                      {activeChapter?.id === chapter.id && (
                        <Play className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notes and Bookmarks */}
        {showNotes && (
          <div className="space-y-4">
            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookmarkCheck className="h-5 w-5" />
                    Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookmarks.map((bookmark) => (
                      <div
                        key={bookmark}
                        onClick={() => jumpToBookmark(bookmark)}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="font-mono text-sm">{formatTime(bookmark)}</span>
                        <Button variant="ghost" size="sm">
                          Jump to
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  My Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add your notes about this video..."
                  className="w-full h-32 p-3 border rounded-lg resize-none text-sm"
                />
                <Button size="sm" className="mt-2">
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}