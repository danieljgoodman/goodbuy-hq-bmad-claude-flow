'use client'

import { useEvaluationStore } from '@/stores/evaluation-store'
import { useAuthStore } from '@/stores/auth-store'

export default function ReviewSubmitStep() {
  const { user } = useAuthStore()
  const { currentEvaluation } = useEvaluationStore()

  if (!currentEvaluation?.businessData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data to review. Please complete the previous steps.</p>
      </div>
    )
  }

  const data = currentEvaluation.businessData as any

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const sections = [
    {
      title: 'Business Information',
      items: [
        { label: 'Business Name', value: user?.businessName },
        { label: 'Industry', value: data.industryFocus || user?.industry },
        { label: 'Business Type', value: data.businessType },
        { label: 'Years in Business', value: data.yearsInBusiness },
        { label: 'Business Model', value: data.businessModel },
        { label: 'Revenue Model', value: data.revenueModel },
      ]
    },
    {
      title: 'Financial Metrics',
      items: [
        { label: 'Annual Revenue', value: formatCurrency(data.annualRevenue || 0) },
        { label: 'Monthly Recurring Revenue', value: formatCurrency(data.monthlyRecurring || 0) },
        { label: 'Annual Expenses', value: formatCurrency(data.expenses || 0) },
        { label: 'Monthly Cash Flow', value: formatCurrency(data.cashFlow || 0) },
        { label: 'Gross Margin', value: `${data.grossMargin || 0}%` },
      ]
    },
    {
      title: 'Operational Data',
      items: [
        { label: 'Total Customers', value: (data.customerCount || 0).toLocaleString() },
        { label: 'Total Employees', value: (data.employeeCount || 0).toLocaleString() },
        { label: 'Market Position', value: data.marketPosition },
        { label: 'Total Assets', value: formatCurrency(data.assets || 0) },
        { label: 'Total Liabilities', value: formatCurrency(data.liabilities || 0) },
      ]
    }
  ]

  // Calculate key metrics
  const netProfit = (data.annualRevenue || 0) - (data.expenses || 0)
  const netWorth = (data.assets || 0) - (data.liabilities || 0)
  const profitMargin = data.annualRevenue > 0 ? (netProfit / data.annualRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
        <p className="text-muted-foreground mb-6">
          Please review your information before submitting for AI analysis. You can go back to make changes if needed.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Annual Revenue</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(data.annualRevenue || 0)}</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
          <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className={`text-xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </p>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-card border rounded-lg p-4">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}:</span>
                  <span className="text-sm font-medium">{item.value || 'Not provided'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Competitive Advantages & Sales Channels */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Competitive Advantages</h4>
          <div className="space-y-2">
            {data.competitiveAdvantages?.map((advantage: string) => (
              <div key={advantage} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">{advantage}</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">None selected</p>}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Primary Sales Channels</h4>
          <div className="space-y-2">
            {data.primaryChannels?.map((channel: string) => (
              <div key={channel} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">{channel}</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">None selected</p>}
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
        <h4 className="font-semibold mb-3">What happens next?</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
            <div>
              <p className="font-medium">AI Analysis</p>
              <p className="text-sm text-muted-foreground">Our AI analyzes your data using industry benchmarks and valuation models</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
            <div>
              <p className="font-medium">Business Health Score</p>
              <p className="text-sm text-muted-foreground">Receive a comprehensive health score (1-100) with detailed explanations</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
            <div>
              <p className="font-medium">Improvement Recommendations</p>
              <p className="text-sm text-muted-foreground">Get top 3 actionable opportunities to increase your business value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
          <div className="text-sm">
            <p className="font-medium mb-1">Your data is secure and confidential:</p>
            <p className="text-muted-foreground">
              All information is encrypted and used solely for generating your business analysis. 
              We never share your data with third parties or use it for any other purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}