'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SecurityEvent,
  SecurityAlert,
  SecurityMetrics,
  SecuritySeverity,
  SecurityEventType,
  SecurityDashboardData,
  SecurityIncident
} from '@/types/security';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/security/dashboard?timeRange=${selectedTimeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch security dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/resolve`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: SecuritySeverity): string => {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return 'destructive';
      case SecuritySeverity.HIGH: return 'destructive';
      case SecuritySeverity.MEDIUM: return 'default';
      case SecuritySeverity.LOW: return 'secondary';
      default: return 'outline';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.RATE_LIMIT_VIOLATION: return <Activity className="h-4 w-4" />;
      case SecurityEventType.TIER_BYPASS_ATTEMPT: return <Shield className="h-4 w-4" />;
      case SecurityEventType.GEOGRAPHIC_ANOMALY: return <Globe className="h-4 w-4" />;
      case SecurityEventType.BRUTE_FORCE_ATTACK: return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { metrics, recentEvents, activeAlerts, activeIncidents, threatMap, systemHealth } = dashboardData;

  // Chart data preparation
  const severityChartData = Object.entries(metrics.eventsBySeverity).map(([severity, count]) => ({
    name: severity,
    value: count,
    color: severity === 'critical' ? '#dc2626' : severity === 'high' ? '#ea580c' : severity === 'medium' ? '#ca8a04' : '#16a34a'
  }));

  const eventTypeChartData = Object.entries(metrics.eventsByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time security monitoring and threat analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {(['1h', '24h', '7d', '30d'] as const).map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* System Health Alert */}
      {systemHealth.status !== 'healthy' && (
        <Alert variant={systemHealth.status === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health: {systemHealth.status}. Issues: {systemHealth.issues.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: {metrics.lastUpdated.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.activeThreats}</div>
            <p className="text-xs text-muted-foreground">
              Unresolved security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">
              Automatically blocked addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.suspendedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users temporarily suspended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="threats">Threat Map</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Events by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Severity</CardTitle>
                <CardDescription>Distribution of security events by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
                <CardDescription>Breakdown of security event types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={eventTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Security Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Security Trends</CardTitle>
              <CardDescription>Hourly security event trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.trends.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getEventTypeIcon(alert.type)}
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {alert.timestamp.toLocaleString()}
                        </Badge>
                        <div className="flex space-x-1">
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{alert.message}</p>
                    {alert.acknowledged && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Acknowledged by {alert.acknowledgedBy} at {alert.acknowledgedAt?.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security events in chronological order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getEventTypeIcon(event.type)}
                      <div>
                        <p className="font-medium">{event.type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.ipAddress} • {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      {event.resolved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          {activeIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No active incidents</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                    </div>
                    <CardDescription>{incident.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Impact</p>
                        <p>Users affected: {incident.impact.usersAffected}</p>
                        <p>Business impact: {incident.impact.businessImpact}</p>
                      </div>
                      <div>
                        <p className="font-medium">Timeline</p>
                        <p>Created: {incident.createdAt.toLocaleString()}</p>
                        <p>Updated: {incident.updatedAt.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence</CardTitle>
              <CardDescription>Known malicious IP addresses and threat actors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatMap.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No threat intelligence data available
                  </div>
                ) : (
                  threatMap.map((threat) => (
                    <div key={threat.ipAddress} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{threat.ipAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          Last seen: {threat.lastSeen.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sources: {threat.sources.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            threat.threatLevel === 'critical' ? 'destructive' :
                            threat.threatLevel === 'high' ? 'destructive' :
                            threat.threatLevel === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {threat.threatLevel}
                        </Badge>
                        {threat.blocked && (
                          <Badge variant="outline">Blocked</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}