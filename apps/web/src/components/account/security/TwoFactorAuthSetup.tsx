'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SecuritySettings } from '@/types'
import { Shield, Smartphone, Key, Check, X, Copy } from 'lucide-react'

interface TwoFactorAuthSetupProps {
  userId: string
  securitySettings: SecuritySettings | null
  onUpdate: (settings: SecuritySettings) => void
}

export function TwoFactorAuthSetup({ userId, securitySettings, onUpdate }: TwoFactorAuthSetupProps) {
  const [isEnabled, setIsEnabled] = useState(securitySettings?.twoFactorEnabled || false)
  const [setupStep, setSetupStep] = useState<'initial' | 'setup' | 'verify'>('initial')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnableTwoFactor = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/security/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setSetupStep('setup')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to setup 2FA')
      }
    } catch (error) {
      setError('Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          verificationCode,
          secret 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backupCodes)
        setIsEnabled(true)
        setSetupStep('verify')
        onUpdate(data.securitySettings)
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify 2FA code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/security/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        setIsEnabled(false)
        setSetupStep('initial')
        onUpdate(data.securitySettings)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      setError('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isEnabled && setupStep === 'initial') {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
            <Badge className="bg-green-100 text-green-800">Enabled</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">2FA is Active</p>
              <p className="text-sm text-green-700">Your account is protected with two-factor authentication</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup Codes</span>
              <Button variant="outline" size="sm">
                View Backup Codes
              </Button>
            </div>
          </div>

          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDisableTwoFactor}
            disabled={loading}
          >
            Disable 2FA
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {setupStep === 'initial' && (
          <>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account by requiring a verification code 
                from your mobile device when logging in.
              </p>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Recommended</p>
                  <p className="text-sm text-blue-700">Significantly improves account security</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleEnableTwoFactor}
              disabled={loading}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Setup Two-Factor Authentication
            </Button>
          </>
        )}

        {setupStep === 'setup' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Step 1: Install Authenticator App</h4>
              <p className="text-sm text-gray-600 mb-3">
                Download and install an authenticator app like Google Authenticator, Authy, or 1Password.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Step 2: Scan QR Code</h4>
              <div className="bg-white p-4 border rounded-lg text-center">
                {/* In a real implementation, generate actual QR code */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <p className="text-xs text-gray-500">QR Code Placeholder</p>
                </div>
                <p className="text-xs text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{secret}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Step 3: Enter Verification Code</h4>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">6-Digit Code from App</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setSetupStep('initial')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        )}

        {setupStep === 'verify' && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Two-factor authentication has been enabled successfully!
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Save Your Backup Codes</h4>
              <p className="text-sm text-gray-600 mb-3">
                Save these backup codes in a secure location. You can use them to access your account 
                if you lose access to your authenticator app.
              </p>
              
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Codes
                </Button>
              </div>
            </div>

            <Button 
              onClick={() => setSetupStep('initial')}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}