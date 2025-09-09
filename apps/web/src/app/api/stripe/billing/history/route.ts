import { PaymentService } from '@/lib/services/PaymentService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const paymentHistory = await PaymentService.getUserPaymentHistory(
      userId,
      limit ? parseInt(limit) : 10
    )

    const invoices = await PaymentService.getUserInvoices(
      userId,
      limit ? parseInt(limit) : 10
    )

    return NextResponse.json({
      payments: paymentHistory,
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        pdfUrl: invoice.hosted_invoice_url,
        created: invoice.created,
      })),
    })
  } catch (error) {
    console.error('Error getting billing history:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get billing history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}