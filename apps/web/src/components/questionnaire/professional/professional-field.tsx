"use client"

import React, { memo, useMemo, useCallback } from 'react'
import { InfoIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFieldOptimization } from '@/lib/performance/questionnaire-optimizer'

interface FieldMethodology {
  purpose: string
  calculation?: string
  benchmarks?: string
  impact: string
}

interface ProfessionalFieldProps {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  value: any
  onChange: (value: any) => void
  methodology: FieldMethodology
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
  step?: number
  min?: number
  max?: number
}

export const ProfessionalField = memo<ProfessionalFieldProps>(function ProfessionalField({
  name,
  label,
  type,
  value,
  onChange,
  methodology,
  options,
  placeholder,
  required = false,
  error,
  className,
  step,
  min,
  max
}) {
  const { trackFieldPerformance } = useFieldOptimization()

  // Memoized field identifiers
  const fieldIds = useMemo(() => ({
    fieldId: `field-${name}`,
    errorId: `field-${name}-error`,
    descriptionId: `field-${name}-description`
  }), [name])

  const { fieldId, errorId, descriptionId } = fieldIds

  // Optimized change handler with performance tracking
  const optimizedOnChange = useCallback((newValue: any) => {
    const startTime = performance.now()
    onChange(newValue)
    const renderTime = performance.now() - startTime
    trackFieldPerformance(name, renderTime)
  }, [onChange, name, trackFieldPerformance])

  // Memoized input renderer to prevent unnecessary re-renders
  const renderInput = useMemo(() => {
    const baseProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
        optimizedOnChange(newValue)
      },
      placeholder,
      required,
      'aria-describedby': `${descriptionId} ${error ? errorId : ''}`,
      'aria-invalid': !!error,
      className: cn(
        error && 'border-red-500 focus-visible:ring-red-500',
        'transition-colors'
      )
    }

    switch (type) {
      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            step={step}
            min={min}
            max={max}
            onChange={(e) => {
              const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
              optimizedOnChange(newValue)
            }}
          />
        )
      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            rows={3}
            className={cn(
              'resize-none',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        )
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={optimizedOnChange}
            required={required}
          >
            <SelectTrigger
              id={fieldId}
              aria-describedby={`${descriptionId} ${error ? errorId : ''}`}
              aria-invalid={!!error}
              className={cn(
                error && 'border-red-500 focus-visible:ring-red-500'
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return <Input {...baseProps} type="text" />
    }
  }, [fieldId, name, value, placeholder, required, descriptionId, error, step, min, max, options, optimizedOnChange, type])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={fieldId}
          className="text-sm font-medium text-gray-900 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500" aria-label="required">*</span>}
        </Label>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              aria-label={`Learn more about ${label}`}
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" side="top">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">
                  Why we need this
                </h4>
                <p className="text-sm text-gray-700">
                  {methodology.purpose}
                </p>
              </div>
              
              {methodology.calculation && (
                <div>
                  <h5 className="font-medium text-blue-800 text-xs mb-1">
                    How it's calculated
                  </h5>
                  <p className="text-xs text-gray-600">
                    {methodology.calculation}
                  </p>
                </div>
              )}
              
              {methodology.benchmarks && (
                <div>
                  <h5 className="font-medium text-blue-800 text-xs mb-1">
                    Industry benchmarks
                  </h5>
                  <p className="text-xs text-gray-600">
                    {methodology.benchmarks}
                  </p>
                </div>
              )}
              
              <div>
                <h5 className="font-medium text-blue-800 text-xs mb-1">
                  Impact on valuation
                </h5>
                <p className="text-xs text-gray-600">
                  {methodology.impact}
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {renderInput}
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
})

ProfessionalField.displayName = 'ProfessionalField'

export default ProfessionalField