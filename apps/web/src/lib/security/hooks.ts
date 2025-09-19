import { useEffect, useState } from 'react';
import {
  SecurityEvent,
  SecurityAlert,
  SecurityMetrics,
  SecurityDashboardData
} from '@/types/security';

/**
 * Hook for real-time security dashboard data
 */
export function useSecurityDashboard(refreshInterval: number = 30000) {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/security/dashboard');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Hook for managing security alerts
 */
export function useSecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const acknowledgeAlert = async (alertId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
          : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/resolve`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, resolved: true, resolvedAt: new Date() }
          : alert
      ));
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    alerts,
    loading,
    acknowledgeAlert,
    resolveAlert,
    setAlerts
  };
}

/**
 * Hook for security event monitoring
 */
export function useSecurityEvents(limit: number = 50) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/security/events?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [limit]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents
  };
}

/**
 * Hook for security metrics
 */
export function useSecurityMetrics(timeRange: string = '24h') {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/security/metrics?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metricsData = await response.json();
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  };
}

/**
 * Hook for real-time security monitoring with WebSocket support
 */
export function useRealtimeSecurityMonitoring() {
  const [isConnected, setIsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<SecurityEvent | null>(null);
  const [latestAlert, setLatestAlert] = useState<SecurityAlert | null>(null);

  useEffect(() => {
    // TODO: Implement WebSocket connection for real-time updates
    // This would connect to a WebSocket endpoint that streams security events

    const connectWebSocket = () => {
      try {
        // Example WebSocket connection (implement when WebSocket endpoint is available)
        // const ws = new WebSocket('ws://localhost:3000/api/security/stream');

        // ws.onopen = () => {
        //   setIsConnected(true);
        // };

        // ws.onmessage = (event) => {
        //   const data = JSON.parse(event.data);
        //   if (data.type === 'security_event') {
        //     setLatestEvent(data.event);
        //   } else if (data.type === 'security_alert') {
        //     setLatestAlert(data.alert);
        //   }
        // };

        // ws.onclose = () => {
        //   setIsConnected(false);
        //   // Attempt to reconnect after 5 seconds
        //   setTimeout(connectWebSocket, 5000);
        // };

        // ws.onerror = (error) => {
        //   console.error('WebSocket error:', error);
        //   setIsConnected(false);
        // };

        // return ws;
      } catch (error) {
        console.error('Failed to connect to security monitoring WebSocket:', error);
      }
    };

    // const ws = connectWebSocket();

    // return () => {
    //   if (ws) {
    //     ws.close();
    //   }
    // };
  }, []);

  return {
    isConnected,
    latestEvent,
    latestAlert
  };
}

/**
 * Hook for security configuration management
 */
export function useSecurityConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateConfig = async (newConfig: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to update security configuration');
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating security config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security/config');

      if (!response.ok) {
        throw new Error('Failed to fetch security configuration');
      }

      const configData = await response.json();
      setConfig(configData);
    } catch (error) {
      console.error('Error fetching security config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    updateConfig,
    refresh: fetchConfig
  };
}