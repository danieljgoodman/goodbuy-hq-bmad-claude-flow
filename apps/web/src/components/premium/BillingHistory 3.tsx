'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Receipt, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react'

interface Payment {
  id: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: string
  receiptUrl?: string
  createdAt: string
}

interface Invoice {
  id: string
  number: string
  amount: number
  currency: string
  status: string
  pdfUrl: string
  created: number
}

interface BillingHistoryProps {
  userId: string
}

export function BillingHistory({ userId }: BillingHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingHistory()
  }, [userId])

  const fetchBillingHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stripe/billing/history?userId=${userId}&limit=20`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch billing history')
      }

      setPayments(data.payments || [])
      setInvoices(data.invoices || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load billing history'
      setError(errorMessage)
      console.error('Error fetching billing history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString * 1000) : new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'REFUNDED':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank')
    }
  }

  const handleViewReceipt = (payment: Payment) => {
    if (payment.receiptUrl) {
      if (payment.receiptUrl.startsWith('http')) {
        window.open(payment.receiptUrl, '_blank')
      } else {
        alert(payment.receiptUrl) // For receipt messages like "Receipt sent to email"
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAnyBillingData = payments.length > 0 || invoices.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Billing History</span>
          </CardTitle>
          <CardDescription>
            View your payment history, invoices, and receipts
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!hasAnyBillingData ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No billing history yet</h3>
              <p className="text-muted-foreground">
                Your payment history and invoices will appear here once you make your first payment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invoices Section */}
              {invoices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Invoices</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Invoice #{invoice.number}</div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(invoice.created)}</span>
                              </span>
                              <span>{formatAmount(invoice.amount, invoice.currency)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(invoice.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Separator if both sections exist */}
              {invoices.length > 0 && payments.length > 0 && <Separator />}

              {/* Payments Section */}
              {payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payments</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              Payment {payment.stripePaymentIntentId.substring(0, 12)}...
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(payment.createdAt)}</span>
                              </span>
                              <span>{formatAmount(payment.amount, payment.currency)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(payment.status)}
                          {payment.receiptUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReceipt(payment)}
                              className="flex items-center space-x-1"
                            >
                              <Receipt className="h-4 w-4" />
                              <span>Receipt</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasAnyBillingData && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Need help with billing? {' '}
                <Button variant="link" className="p-0 h-auto text-sm">
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BillingHistory