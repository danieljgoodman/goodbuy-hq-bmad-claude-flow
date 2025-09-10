'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { SupportTicket, SupportMessage } from '@/types'
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Download, 
  User, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Star,
  MoreVertical,
  Edit,
  X
} from 'lucide-react'

interface TicketViewerProps {
  ticket: SupportTicket
  currentUserId: string
  onBack: () => void
  onMessageSend?: (ticketId: string, message: string, attachments?: File[]) => Promise<void>
  onStatusUpdate?: (ticketId: string, status: SupportTicket['status']) => Promise<void>
  onRating?: (ticketId: string, rating: number, feedback?: string) => Promise<void>
}

export function TicketViewer({
  ticket,
  currentUserId,
  onBack,
  onMessageSend,
  onStatusUpdate,
  onRating
}: TicketViewerProps) {
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await onMessageSend?.(ticket.id, newMessage, attachments)
      setNewMessage('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusUpdate = async (newStatus: SupportTicket['status']) => {
    try {
      await onStatusUpdate?.(ticket.id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRatingSubmit = async () => {
    if (rating === 0) return

    try {
      await onRating?.(ticket.id, rating, feedback)
      setShowRating(false)
      setRating(0)
      setFeedback('')
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday ' + timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'waiting_response': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'waiting_response': return <MessageCircle className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const canReply = ticket.status !== 'closed' && ticket.status !== 'resolved'
  const showSatisfactionRating = (ticket.status === 'resolved' || ticket.status === 'closed') && !ticket.satisfaction_rating

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support Center
        </Button>

        <div className="flex items-center gap-2">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusUpdate(e.target.value as SupportTicket['status'])}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-3">
                {ticket.subject}
              </CardTitle>
              
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getStatusColor(ticket.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ')}
                  </span>
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={getPriorityColor(ticket.priority)}
                >
                  {ticket.priority} priority
                </Badge>
                <Badge variant="outline">
                  {ticket.category}
                </Badge>
                {ticket.subscription_tier === 'premium' && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Premium Support
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {ticket.created_at.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated {ticket.updated_at.toLocaleDateString()}
                </div>
                {ticket.assigned_to && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned to support
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation ({ticket.messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {ticket.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender_type === 'support' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    S
                  </div>
                )}
                
                <div className={`max-w-[70%] ${
                  message.sender_type === 'user' ? 'order-last' : ''
                }`}>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.sender_type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-2 text-xs opacity-75"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{attachment}</span>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender_type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>

                {message.sender_type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    U
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          {canReply && (
            <form onSubmit={handleSendMessage} className="border-t pt-4">
              <div className="space-y-3">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="resize-none"
                />
                
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <Paperclip className="h-3 w-3" />
                        {file.name} ({Math.round(file.size / 1024)}KB)
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          className="h-auto p-0 text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files || [])])}
                      className="hidden"
                      id="reply-attachments"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('reply-attachments')?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach Files
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={!newMessage.trim() || isSending}>
                    {isSending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {!canReply && (
            <div className="border-t pt-4 text-center text-sm text-gray-500">
              This ticket is {ticket.status}. No new replies can be added.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Satisfaction Rating */}
      {showSatisfactionRating && (
        <Card>
          <CardHeader>
            <CardTitle>How was your support experience?</CardTitle>
          </CardHeader>
          <CardContent>
            {!showRating ? (
              <Button onClick={() => setShowRating(true)}>
                Rate Your Experience
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-full h-full fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Click to rate from 1 (poor) to 5 (excellent)
                  </p>
                </div>

                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience (optional)"
                  rows={3}
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRatingSubmit}
                    disabled={rating === 0}
                  >
                    Submit Rating
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowRating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Rating Display */}
      {ticket.satisfaction_rating && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Your rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`w-4 h-4 ${
                      star <= ticket.satisfaction_rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              {ticket.satisfaction_feedback && (
                <span className="ml-4 italic">"{ticket.satisfaction_feedback}"</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}