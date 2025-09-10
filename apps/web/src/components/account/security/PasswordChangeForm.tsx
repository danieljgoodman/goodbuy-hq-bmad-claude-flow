'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, Check, X, Eye, EyeOff } from 'lucide-react'

interface PasswordChangeFormProps {
  userId: string
}

export function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordRequirements = [
    { text: 'At least 8 characters long', met: passwords.new.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(passwords.new) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(passwords.new) },
    { text: 'Contains a number', met: /\d/.test(passwords.new) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.new) }
  ]

  const allRequirementsMet = passwordRequirements.every(req => req.met)
  const passwordsMatch = passwords.new === passwords.confirm && passwords.confirm.length > 0

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess(false)
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!allRequirementsMet) {
      setError('Please meet all password requirements')
      return
    }

    if (!passwordsMatch) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/account/security/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })

      if (response.ok) {
        setSuccess(true)
        setPasswords({ current: '', new: '', confirm: '' })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setError('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = passwords.current && passwords.new && passwordsMatch && allRequirementsMet

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Change Password
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password changed successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handlePasswordChange('current', e.target.value)}
                placeholder="Enter your current password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => handlePasswordChange('new', e.target.value)}
                placeholder="Enter your new password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password Requirements */}
            {passwords.new && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <div className="grid grid-cols-1 gap-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-red-600'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                placeholder="Confirm your new password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {passwords.confirm && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <><Check className="h-4 w-4 text-green-600" /><span className="text-green-700">Passwords match</span></>
                ) : (
                  <><X className="h-4 w-4 text-red-500" /><span className="text-red-600">Passwords do not match</span></>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={!canSubmit || saving}
            className="w-full"
          >
            {saving ? 'Changing Password...' : 'Change Password'}
          </Button>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>Security tip:</strong> Use a unique password that you haven't used elsewhere. 
              Consider using a password manager to generate and store strong passwords.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}