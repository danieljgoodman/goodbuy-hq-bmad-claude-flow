'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SupportTicket, SupportMessage } from '@/types'
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  User,
  Calendar,
  Filter,
  Send,
  Paperclip,
  Star,
  MoreHorizontal
} from 'lucide-react'
import { TicketViewer } from './TicketViewer'

interface SupportTicketSystemProps {
  tickets?: SupportTicket[]
  currentUserId: string
  subscriptionTier: string
  onTicketCreate?: (ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>) => Promise<string>
  onMessageSend?: (ticketId: string, message: string, attachments?: File[]) => Promise<void>
  onTicketStatusUpdate?: (ticketId: string, status: SupportTicket['status']) => Promise<void>
}

export function SupportTicketSystem({
  tickets = [],
  currentUserId,
  subscriptionTier,
  onTicketCreate,
  onMessageSend,
  onTicketStatusUpdate
}: SupportTicketSystemProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [activeTab, setActiveTab] = useState('my_tickets')
  
  // Create ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as SupportTicket['priority']
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for demonstration
  const mockTickets: SupportTicket[] = [
    {
      id: 'ticket_1',
      userId: currentUserId,
      subject: 'Question about valuation methodology',
      description: 'I need clarification on how the AI determines market comparables for my industry.',
      category: 'Product Question',
      priority: 'medium',
      status: 'open',
      assigned_to: 'support_agent_1',
      subscription_tier: subscriptionTier,
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-21'),
      messages: [
        {
          id: 'msg_1',
          ticket_id: 'ticket_1',
          sender_id: currentUserId,
          sender_type: 'user',
          message: 'I need clarification on how the AI determines market comparables for my industry.',
          timestamp: new Date('2024-01-20'),
          attachments: []
        },
        {
          id: 'msg_2',
          ticket_id: 'ticket_1',
          sender_id: 'support_agent_1',
          sender_type: 'support',
          message: 'Thank you for reaching out! Our AI uses multiple data sources to identify comparable companies including industry classification, revenue size, business model, and geographic location. I can provide more specific details about your particular case.',
          timestamp: new Date('2024-01-21'),
          attachments: []
        }
      ]
    },
    {
      id: 'ticket_2',
      userId: currentUserId,
      subject: 'Unable to upload financial documents',
      description: 'Getting error when trying to upload my P&L statement in PDF format.',
      category: 'Technical Issue',
      priority: 'high',
      status: 'in_progress',
      assigned_to: 'support_agent_2',
      subscription_tier: subscriptionTier,
      created_at: new Date('2024-01-22'),
      updated_at: new Date('2024-01-22'),
      messages: [
        {
          id: 'msg_3',
          ticket_id: 'ticket_2',
          sender_id: currentUserId,
          sender_type: 'user',
          message: 'Getting error when trying to upload my P&L statement in PDF format. The error says "Invalid file format" but PDF should be supported.',
          timestamp: new Date('2024-01-22'),
          attachments: ['screenshot.png']
        }
      ]
    }
  ]

  const allTickets = tickets.length > 0 ? tickets : mockTickets

  const filteredTickets = React.useMemo(() => {
    let filtered = allTickets

    // Filter by tab
    if (activeTab === 'my_tickets') {
      filtered = filtered.filter(ticket => ticket.userId === currentUserId)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus)
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === selectedPriority)
    }

    // Sort by most recent first
    filtered.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())

    return filtered
  }, [allTickets, activeTab, currentUserId, searchQuery, selectedStatus, selectedPriority])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return

    setIsSubmitting(true)
    try {
      const ticketData = {
        userId: currentUserId,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open' as const,
        subscription_tier: subscriptionTier,
        messages: [{
          id: `msg_${Date.now()}`,
          ticket_id: '',
          sender_id: currentUserId,
          sender_type: 'user' as const,
          message: newTicket.description,
          timestamp: new Date(),
          attachments: attachments.map(f => f.name)
        }]
      }

      const ticketId = await onTicketCreate?.(ticketData) || `ticket_${Date.now()}`
      
      // Reset form
      setNewTicket({
        subject: '',
        description: '',
        category: '',
        priority: 'medium'
      })
      setAttachments([])
      setShowCreateModal(false)
      
      console.log('Ticket created:', ticketId)
    } catch (error) {
      console.error('Failed to create ticket:', error)
    } finally {
      setIsSubmitting(false)
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

  const getResponseTime = () => {
    switch (subscriptionTier) {
      case 'enterprise': return '1 hour'
      case 'premium': return '4 hours'
      case 'free': return '24 hours'
      default: return '24 hours'
    }
  }

  if (selectedTicket) {
    return (
      <TicketViewer
        ticket={selectedTicket}
        currentUserId={currentUserId}
        onBack={() => setSelectedTicket(null)}
        onMessageSend={onMessageSend}
        onStatusUpdate={onTicketStatusUpdate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Center
          </h1>
          <p className="text-gray-600">
            Get help from our support team • {subscriptionTier} plan • {getResponseTime()} response time
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_response">Waiting Response</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my_tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="all_tickets">All Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {ticket.subject}
                        </h3>
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
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {ticket.created_at.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {ticket.updated_at.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ticket.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      {ticket.subscription_tier === 'premium' && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tickets found
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'my_tickets' 
                  ? "You haven't created any support tickets yet"
                  : "No tickets match your current filters"
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select category</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Product Question">Product Question</option>
                      <option value="Billing">Billing</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Account Access">Account Access</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                      className="hidden"
                      id="attachments"
                    />
                    <label htmlFor="attachments" className="cursor-pointer">
                      <div className="flex items-center justify-center">
                        <Paperclip className="h-6 w-6 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          Click to attach files or drag and drop
                        </span>
                      </div>
                    </label>
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((file, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {file.name} ({Math.round(file.size / 1024)}KB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                    {isSubmitting ? 'Creating...' : 'Create Ticket'}
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