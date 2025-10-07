'use client'

import { useState, useRef, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccessibility } from '@/contexts/accessibility-context'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface AccessibleInputProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function AccessibleInput({
  label,
  type = 'text',
  placeholder,
  description,
  required = false,
  disabled = false,
  error,
  value,
  onChange,
  className = ''
}: AccessibleInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = useId()
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const { announceToScreenReader } = useAccessibility()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
    
    // Announce validation errors
    if (error) {
      announceToScreenReader(`${label}: ${error}`, 'assertive')
    }
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={inputId}
        className={`text-sm font-medium ${required ? "after:content-['*'] after:text-destructive after:ml-1" : ''}`}
      >
        {label}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div className="relative">
        <Input
          id={inputId}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          className={`${error ? 'border-destructive focus:border-destructive' : ''}`}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => {
              setShowPassword(!showPassword)
              announceToScreenReader(
                showPassword ? 'Password hidden' : 'Password visible',
                'polite'
              )
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  )
}

interface AccessibleTextareaProps {
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
  value?: string
  onChange?: (value: string) => void
  rows?: number
  className?: string
}

export function AccessibleTextarea({
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  error,
  value,
  onChange,
  rows = 4,
  className = ''
}: AccessibleTextareaProps) {
  const textareaId = useId()
  const descriptionId = description ? `${textareaId}-description` : undefined
  const errorId = error ? `${textareaId}-error` : undefined
  const { announceToScreenReader } = useAccessibility()

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
    
    if (error) {
      announceToScreenReader(`${label}: ${error}`, 'assertive')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={textareaId}
        className={`text-sm font-medium ${required ? "after:content-['*'] after:text-destructive after:ml-1" : ''}`}
      >
        {label}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <Textarea
        id={textareaId}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        className={`${error ? 'border-destructive focus:border-destructive' : ''}`}
      />
      
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  )
}

interface AccessibleSelectProps {
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: string
  value?: string
  onChange?: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  className?: string
}

export function AccessibleSelect({
  label,
  placeholder = 'Select an option',
  description,
  required = false,
  disabled = false,
  error,
  value,
  onChange,
  options,
  className = ''
}: AccessibleSelectProps) {
  const selectId = useId()
  const descriptionId = description ? `${selectId}-description` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const { announceToScreenReader } = useAccessibility()

  const handleValueChange = (newValue: string) => {
    onChange?.(newValue)
    
    const selectedOption = options.find(option => option.value === newValue)
    if (selectedOption) {
      announceToScreenReader(`Selected: ${selectedOption.label}`, 'polite')
    }
    
    if (error) {
      announceToScreenReader(`${label}: ${error}`, 'assertive')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={selectId}
        className={`text-sm font-medium ${required ? "after:content-['*'] after:text-destructive after:ml-1" : ''}`}
      >
        {label}
      </Label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={selectId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          className={`${error ? 'border-destructive focus:border-destructive' : ''}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  )
}

interface AccessibleFormProps {
  onSubmit: (formData: FormData) => Promise<void> | void
  children: React.ReactNode
  className?: string
  submitLabel?: string
  isSubmitting?: boolean
  submitDisabled?: boolean
}

export function AccessibleForm({
  onSubmit,
  children,
  className = '',
  submitLabel = 'Submit',
  isSubmitting = false,
  submitDisabled = false
}: AccessibleFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const { announceToScreenReader } = useAccessibility()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitAttempted(true)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    // Check form validity
    if (!form.checkValidity()) {
      announceToScreenReader('Form has validation errors', 'assertive')
      
      // Focus first invalid field
      const firstInvalid = form.querySelector(':invalid') as HTMLElement
      if (firstInvalid) {
        firstInvalid.focus()
      }
      return
    }
    
    try {
      announceToScreenReader('Submitting form', 'polite')
      await onSubmit(formData)
      announceToScreenReader('Form submitted successfully', 'polite')
    } catch (error) {
      announceToScreenReader('Form submission failed', 'assertive')
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate // We handle validation manually for better accessibility
    >
      {children}
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="gap-2"
        >
          {isSubmitting && (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current"
              aria-hidden="true"
            />
          )}
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

// Success message component
export function FormSuccessMessage({ 
  message, 
  onDismiss 
}: { 
  message: string
  onDismiss?: () => void 
}) {
  const { announceToScreenReader } = useAccessibility()
  const successId = useId()

  // Announce success immediately when rendered
  React.useEffect(() => {
    announceToScreenReader(message, 'polite')
  }, [message, announceToScreenReader])

  return (
    <div
      id={successId}
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
    >
      <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-green-700 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-sm p-1"
          aria-label="Dismiss success message"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  )
}