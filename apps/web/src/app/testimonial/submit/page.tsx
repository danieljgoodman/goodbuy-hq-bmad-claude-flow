'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Building,
  User,
  Lock
} from 'lucide-react'

interface UserMetrics {
  baselineValuation: number
  currentValuation: number
  improvementPercentage: number
  timeFrame: string
}

export default function TestimonialSubmitPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<UserMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    content: '',
    authorName: '',
    authorTitle: '',
    companyName: '',
    permissions: {
      useCompanyName: true,
      useRealName: true,
      useQuantifiedData: true
    }
  })

  useEffect(() => {
    loadUserMetrics()
  }, [])

  const loadUserMetrics = async () => {
    try {
      const response = await fetch('/api/success-tracking/metrics?type=user')
      const data = await response.json()
      
      if (data.success) {
        const userMetrics = data.data.metrics
        setMetrics({
          baselineValuation: userMetrics.baselineValuation,
          currentValuation: userMetrics.currentValuation,
          improvementPercentage: userMetrics.improvementPercentage,
          timeFrame: '6 months' // Mock timeframe
        })
        
        // Pre-fill some form data
        setFormData(prev => ({
          ...prev,
          authorName: '', // Would get from user profile
          authorTitle: '',
          companyName: ''
        }))
      }
    } catch (error) {
      console.error('Error loading user metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your success story...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Thank You!</CardTitle>
            <CardDescription>
              Your testimonial has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your testimonial is now under review. We'll notify you once it's approved and published.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>No Success Story Yet</CardTitle>
            <CardDescription>
              We'll reach out when you have significant improvements to share!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Share Your Success Story
            </h1>
            <p className="text-lg text-gray-600">
              Your business improvement could inspire other entrepreneurs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Success Metrics Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Your Success</span>
                  </CardTitle>
                  <CardDescription>
                    Congratulations on your improvement!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700 mb-1">
                        {metrics.improvementPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-600">Improvement</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Before:</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.baselineValuation)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.currentValuation)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timeframe:</span>
                      <span className="font-medium">{metrics.timeFrame}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Value Added:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(metrics.currentValuation - metrics.baselineValuation)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Privacy Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>✓ You control what information is shared</p>
                  <p>✓ You can choose to remain anonymous</p>
                  <p>✓ Your testimonial will be reviewed before publication</p>
                  <p>✓ You can request removal at any time</p>
                </CardContent>
              </Card>
            </div>

            {/* Testimonial Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tell Your Story</CardTitle>
                  <CardDescription>
                    Share how GoodBuy HQ helped improve your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Author Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="authorName">Your Name *</Label>
                        <Input
                          id="authorName"
                          value={formData.authorName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            authorName: e.target.value
                          }))}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="authorTitle">Your Title *</Label>
                        <Input
                          id="authorTitle"
                          value={formData.authorTitle}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            authorTitle: e.target.value
                          }))}
                          placeholder="CEO, Founder, Manager"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companyName: e.target.value
                        }))}
                        placeholder="Your Company Name"
                        required
                      />
                    </div>

                    {/* Testimonial Content */}
                    <div>
                      <Label htmlFor="content">Your Testimonial *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          content: e.target.value
                        }))}
                        placeholder="Tell us about your experience with GoodBuy HQ. How did it help your business? What improvements did you see? What would you tell other business owners?"
                        rows={6}
                        className="resize-none"
                        minLength={50}
                        maxLength={1000}
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {formData.content.length}/1000 characters (minimum 50)
                      </div>
                    </div>

                    {/* Privacy Permissions */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Sharing Permissions</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="useRealName"
                            checked={formData.permissions.useRealName}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                useRealName: checked as boolean
                              }
                            }))}
                          />
                          <Label htmlFor="useRealName" className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Use my real name in the testimonial</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="useCompanyName"
                            checked={formData.permissions.useCompanyName}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                useCompanyName: checked as boolean
                              }
                            }))}
                          />
                          <Label htmlFor="useCompanyName" className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>Include my company name</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="useQuantifiedData"
                            checked={formData.permissions.useQuantifiedData}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                useQuantifiedData: checked as boolean
                              }
                            }))}
                          />
                          <Label htmlFor="useQuantifiedData" className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>Include my improvement metrics ({metrics.improvementPercentage.toFixed(1)}% increase)</span>
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg border-t">
                      <h4 className="font-medium mb-2">Preview:</h4>
                      <div className="text-sm italic">
                        "{formData.content || 'Your testimonial will appear here...'}"
                      </div>
                      {formData.content && (
                        <div className="text-xs text-muted-foreground mt-2">
                          — {formData.permissions.useRealName ? formData.authorName : 'Business Owner'}, 
                          {formData.authorTitle}{formData.permissions.useCompanyName && formData.companyName ? `, ${formData.companyName}` : ''}
                          {formData.permissions.useQuantifiedData && ` (${metrics.improvementPercentage.toFixed(1)}% improvement)`}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || formData.content.length < 50}
                      >
                        {submitting ? 'Submitting...' : 'Submit Testimonial'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}