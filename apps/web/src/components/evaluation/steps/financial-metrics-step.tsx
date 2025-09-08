'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluation-store'

const financialMetricsSchema = z.object({
  annualRevenue: z.number().min(0, 'Annual revenue must be 0 or greater'),
  monthlyRecurring: z.number().min(0, 'Monthly recurring revenue must be 0 or greater'),
  expenses: z.number().min(0, 'Annual expenses must be 0 or greater'),
  cashFlow: z.number().min(-999999999, 'Please enter a valid cash flow amount'),
  grossMargin: z.number().min(0).max(100, 'Gross margin must be between 0-100%'),
})

type FinancialMetrics = z.infer<typeof financialMetricsSchema>

export default function FinancialMetricsStep() {
  const { currentEvaluation, updateBusinessData, uploadedDocuments } = useEvaluationStore()
  
  const [formData, setFormData] = useState<FinancialMetrics>({
    annualRevenue: 0,
    monthlyRecurring: 0,
    expenses: 0,
    cashFlow: 0,
    grossMargin: 0,
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof FinancialMetrics, string>>>({})
  const [showDocumentSync, setShowDocumentSync] = useState(false)
  
  // Function to sync data from uploaded documents
  const handleSyncFromDocuments = () => {
    console.log('🔄 FINANCIAL-METRICS: Syncing data from documents')
    
    if (!uploadedDocuments || uploadedDocuments.length === 0) return
    
    let totalRevenue = 0
    let totalExpenses = 0
    let totalCashFlow = 0
    let totalAssets = 0
    let hasValidData = false
    
    uploadedDocuments.forEach(doc => {
      const data = doc.extractedData
      if (data) {
        const revenue = data.revenue?.value || 0
        const expenses = data.expenses?.value || 0
        const cashFlow = data.cashFlow?.value || 0
        const assets = data.balanceSheet?.assets || 0
        
        console.log(`📄 Processing ${doc.originalFileName}:`, { revenue, expenses, assets })
        
        // Use highest confidence revenue, sum others
        if (revenue > totalRevenue) totalRevenue = revenue
        totalExpenses += expenses
        totalCashFlow += cashFlow
        if (assets > totalAssets) totalAssets = assets
        
        if (revenue > 0 || expenses > 0 || Math.abs(cashFlow) > 0 || assets > 0) {
          hasValidData = true
        }
      }
    })
    
    if (hasValidData) {
      const grossMargin = totalRevenue > 0 && totalExpenses > 0 
        ? Math.max(0, Math.min(100, Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)))
        : 0
      
      const syncedData = {
        annualRevenue: totalRevenue,
        monthlyRecurring: totalRevenue > 0 ? Math.round(totalRevenue / 12) : 0,
        expenses: totalExpenses,
        cashFlow: totalCashFlow,
        grossMargin
      }
      
      console.log('🔄 FINANCIAL-METRICS: Applying synced data:', syncedData)
      
      setFormData(syncedData)
      updateBusinessData({
        annualRevenue: totalRevenue,
        monthlyRecurring: Math.round(totalRevenue / 12),
        expenses: totalExpenses,
        cashFlow: totalCashFlow,
        assets: totalAssets
      })
      
      setShowDocumentSync(false)
    }
  }
  
  // Check if we have uploaded documents with financial data
  const hasDocumentData = uploadedDocuments && uploadedDocuments.length > 0 && uploadedDocuments.some(doc => {
    const data = doc.extractedData
    return data && (
      (data.revenue?.value && data.revenue.value > 0) ||
      (data.expenses?.value && data.expenses.value > 0) ||
      (data.balanceSheet?.assets && data.balanceSheet.assets > 0)
    )
  })

  // Load existing data if available - main effect for form population
  useEffect(() => {
    console.log('📊 FINANCIAL-METRICS: useEffect triggered')
    console.log('📊 FINANCIAL-METRICS: currentEvaluation exists:', !!currentEvaluation)
    console.log('📊 FINANCIAL-METRICS: businessData exists:', !!currentEvaluation?.businessData)
    
    if (currentEvaluation?.businessData) {
      const data = currentEvaluation.businessData
      console.log('📊 FINANCIAL-METRICS: Raw business data:', {
        annualRevenue: data.annualRevenue,
        expenses: data.expenses,
        cashFlow: data.cashFlow,
        assets: data.assets,
        lastDocumentUpdate: (data as any).lastDocumentUpdate
      })
      
      const newData = {
        annualRevenue: data.annualRevenue || 0,
        monthlyRecurring: data.monthlyRecurring || 0,
        expenses: data.expenses || 0,
        cashFlow: data.cashFlow || 0,
        grossMargin: (data as any).grossMargin || 0,
      }
      
      console.log('📊 FINANCIAL-METRICS: Prepared form data:', newData)
      
      // Only update if data has actually changed to prevent infinite loops
      setFormData(prevData => {
        if (
          prevData.annualRevenue === newData.annualRevenue &&
          prevData.monthlyRecurring === newData.monthlyRecurring &&
          prevData.expenses === newData.expenses &&
          prevData.cashFlow === newData.cashFlow &&
          prevData.grossMargin === newData.grossMargin
        ) {
          return prevData // No change, return previous data to prevent re-render
        }
        
        console.log('📊 Financial Metrics Form updating with new data:', newData)
        return newData
      })
    }
  }, [
    // Watch for the entire businessData object to catch all updates
    currentEvaluation?.businessData,
    // Specific field dependencies for better reactivity
    currentEvaluation?.businessData?.annualRevenue,
    currentEvaluation?.businessData?.monthlyRecurring,
    currentEvaluation?.businessData?.expenses,
    currentEvaluation?.businessData?.cashFlow,
    (currentEvaluation?.businessData as any)?.lastDocumentUpdate
  ])

  // Additional effect to handle evaluation changes specifically 
  useEffect(() => {
    if (currentEvaluation) {
      console.log('📊 FINANCIAL-METRICS: currentEvaluation changed, checking for updates')
      console.log('📊 FINANCIAL-METRICS: evaluation updatedAt:', currentEvaluation.updatedAt)
    }
  }, [currentEvaluation])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleInputChange = (field: keyof FinancialMetrics, inputValue: string) => {
    // Remove commas and non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/[^0-9.]/g, '')
    const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0
    
    setFormData(prev => ({ ...prev, [field]: numericValue }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Auto-save to store
    updateBusinessData({ [field]: numericValue })
  }

  const formatInputValue = (value: number): string => {
    // Show empty string for 0 to improve UX - user can type without seeing leading 0
    if (value === 0) return ''
    // Format with commas for readability
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  const formatDisplayValue = (value: number): string => {
    // For display in input fields, handle decimal values properly
    if (value === 0) return ''
    return value.toLocaleString('en-US')
  }

  const validateStep = () => {
    const result = financialMetricsSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FinancialMetrics, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          const fieldName = err.path[0] as keyof FinancialMetrics
          fieldErrors[fieldName] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  // Validate on form data changes
  useEffect(() => {
    validateStep()
  }, [formData])

  // Calculate derived metrics
  const netProfit = formData.annualRevenue - formData.expenses
  const profitMargin = formData.annualRevenue > 0 ? (netProfit / formData.annualRevenue) * 100 : 0

  // Debug logging for banner visibility - temporarily disabled
  // console.log('🔍 BANNER DEBUG:', { hasDocumentData, annualRevenue: formData.annualRevenue })

  return (
    <div className="space-y-6">
      {hasDocumentData && formData.annualRevenue === 0 && formData.expenses === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">📄 Document Data Available</h4>
              <p className="text-sm text-blue-700 mt-1">
                We've extracted financial data from your uploaded documents. Click to populate the form automatically.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDocumentSync(false)}
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
              >
                Maybe Later
              </button>
              <button
                onClick={handleSyncFromDocuments}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Fill Form from Documents
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Metrics</h3>
        <p className="text-muted-foreground mb-6">
          Please provide your key financial information. All data is encrypted and secure.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="annualRevenue" className="block text-sm font-medium mb-2">
            Annual Revenue <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="annualRevenue"
              type="text"
              value={formatDisplayValue(formData.annualRevenue)}
              onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.annualRevenue && (
            <p className="text-destructive text-sm mt-1">{errors.annualRevenue}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Total gross revenue for the last 12 months
          </p>
        </div>

        <div>
          <label htmlFor="monthlyRecurring" className="block text-sm font-medium mb-2">
            Monthly Recurring Revenue (MRR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="monthlyRecurring"
              type="text"
              value={formatDisplayValue(formData.monthlyRecurring)}
              onChange={(e) => handleInputChange('monthlyRecurring', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.monthlyRecurring && (
            <p className="text-destructive text-sm mt-1">{errors.monthlyRecurring}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Leave at 0 if not applicable to your business model
          </p>
        </div>

        <div>
          <label htmlFor="expenses" className="block text-sm font-medium mb-2">
            Annual Expenses <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="expenses"
              type="text"
              value={formatDisplayValue(formData.expenses)}
              onChange={(e) => handleInputChange('expenses', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.expenses && (
            <p className="text-destructive text-sm mt-1">{errors.expenses}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Total operating expenses for the last 12 months
          </p>
        </div>

        <div>
          <label htmlFor="cashFlow" className="block text-sm font-medium mb-2">
            Monthly Cash Flow <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="cashFlow"
              type="text"
              value={formatDisplayValue(formData.cashFlow)}
              onChange={(e) => handleInputChange('cashFlow', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.cashFlow && (
            <p className="text-destructive text-sm mt-1">{errors.cashFlow}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Average monthly cash flow (can be negative)
          </p>
        </div>

        <div>
          <label htmlFor="grossMargin" className="block text-sm font-medium mb-2">
            Gross Margin <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="grossMargin"
              type="text"
              value={formatDisplayValue(formData.grossMargin)}
              onChange={(e) => handleInputChange('grossMargin', e.target.value)}
              className="w-full pr-8 pl-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          {errors.grossMargin && (
            <p className="text-destructive text-sm mt-1">{errors.grossMargin}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            (Revenue - Cost of Goods Sold) / Revenue × 100
          </p>
        </div>
      </div>

      {/* Calculated Metrics */}
      {formData.annualRevenue > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Calculated Metrics</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Net Profit (Annual)</p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
          <div className="text-sm">
            <p className="font-medium mb-1">Your data is secure:</p>
            <p className="text-muted-foreground">
              All financial information is encrypted and used solely for generating your business 
              valuation and improvement recommendations. We never share your data with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}