'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoginHistory } from '@/types'
import { Monitor, Smartphone, Tablet, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface LoginHistoryTableProps {
  userId: string
}

export function LoginHistoryTable({ userId }: LoginHistoryTableProps) {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoginHistory()
  }, [userId])

  const loadLoginHistory = async () => {
    setLoading(true)
    try {
      // Mock data for demo - would fetch from API
      const mockHistory: LoginHistory[] = [
        {
          id: '1',
          userId,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
          location: 'San Francisco, CA, US',
          successful: true,
          sessionId: 'sess_abc123',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: '2',
          userId,
          ipAddress: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
          location: 'San Francisco, CA, US',
          successful: true,
          sessionId: 'sess_def456',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          id: '3',
          userId,
          ipAddress: '203.0.113.10',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0',
          location: 'New York, NY, US',
          successful: false,
          failureReason: 'Invalid password',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          id: '4',
          userId,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0',
          location: 'San Francisco, CA, US',
          successful: true,
          sessionId: 'sess_ghi789',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
        }
      ]
      
      setLoginHistory(mockHistory)
    } catch (error) {
      console.error('Failed to load login history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-4 w-4 text-blue-600" />
    }
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      return <Tablet className="h-4 w-4 text-green-600" />
    }
    return <Monitor className="h-4 w-4 text-gray-600" />
  }

  const getDeviceInfo = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome Browser'
    if (userAgent.includes('Firefox')) return 'Firefox Browser'
    if (userAgent.includes('Safari')) return 'Safari Browser'
    if (userAgent.includes('Edge')) return 'Edge Browser'
    return 'Unknown Browser'
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    return `${Math.floor(diffInWeeks / 4)}mo ago`
  }

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/account/security/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Update the login history to show session as revoked
        setLoginHistory(prev => prev.map(login => 
          login.sessionId === sessionId 
            ? { ...login, sessionId: undefined }
            : login
        ))
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5 text-purple-600" />
            Login History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadLoginHistory}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No login history available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loginHistory.map((login) => (
              <div key={login.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getDeviceIcon(login.userAgent)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {getDeviceInfo(login.userAgent)}
                      </span>
                      {login.successful ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{login.location || 'Unknown location'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{getTimeAgo(login.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">IP: </span>
                        <span className="font-mono">{login.ipAddress}</span>
                      </div>
                      {!login.successful && login.failureReason && (
                        <div className="text-red-600">
                          Reason: {login.failureReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {login.successful && login.sessionId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => revokeSession(login.sessionId!)}
                      className="text-xs"
                    >
                      Revoke Session
                    </Button>
                  )}
                  
                  {!login.successful && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-red-600"
                    >
                      Report Suspicious
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Show suspicious activity warning if there are failed logins */}
            {loginHistory.some(login => !login.successful) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h5 className="font-medium text-amber-900">Suspicious Activity Detected</h5>
                </div>
                <p className="text-sm text-amber-800 mt-1">
                  We've detected failed login attempts on your account. If this wasn't you, 
                  please change your password immediately and enable two-factor authentication.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    Change Password
                  </Button>
                  <Button size="sm" variant="outline">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}