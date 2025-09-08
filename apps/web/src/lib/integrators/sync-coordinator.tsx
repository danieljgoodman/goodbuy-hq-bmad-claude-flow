import type { UnifiedDashboard } from '@/types/unified-dashboard';

export interface SyncEvent {
  type: 'data_update' | 'component_refresh' | 'error' | 'status_change';
  component?: string;
  data?: any;
  timestamp: Date;
  businessId: string;
}

export class SyncCoordinator {
  private static instance: SyncCoordinator;
  private subscribers: Map<string, Function[]> = new Map();
  private syncQueue: SyncEvent[] = [];
  private isProcessing = false;

  static getInstance(): SyncCoordinator {
    if (!SyncCoordinator.instance) {
      SyncCoordinator.instance = new SyncCoordinator();
    }
    return SyncCoordinator.instance;
  }

  // Subscribe to sync events for a specific business
  subscribe(businessId: string, callback: (event: SyncEvent) => void) {
    const subscribers = this.subscribers.get(businessId) || [];
    subscribers.push(callback);
    this.subscribers.set(businessId, subscribers);

    // Return unsubscribe function
    return () => {
      const updatedSubscribers = this.subscribers.get(businessId) || [];
      const index = updatedSubscribers.indexOf(callback);
      if (index > -1) {
        updatedSubscribers.splice(index, 1);
        this.subscribers.set(businessId, updatedSubscribers);
      }
    };
  }

  // Emit sync event to all subscribers
  emit(event: SyncEvent) {
    const subscribers = this.subscribers.get(event.businessId) || [];
    subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Sync event callback error:', error);
      }
    });

    // Add to processing queue
    this.syncQueue.push(event);
    this.processQueue();
  }

  // Process queued sync events
  private async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.syncQueue.length > 0) {
        const event = this.syncQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Sync queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: SyncEvent) {
    switch (event.type) {
      case 'data_update':
        await this.handleDataUpdate(event);
        break;
      case 'component_refresh':
        await this.handleComponentRefresh(event);
        break;
      case 'error':
        await this.handleError(event);
        break;
      case 'status_change':
        await this.handleStatusChange(event);
        break;
    }
  }

  private async handleDataUpdate(event: SyncEvent) {
    // Validate data consistency across components
    if (event.component && event.data) {
      await this.validateDataConsistency(event.businessId, event.component, event.data);
    }
  }

  private async handleComponentRefresh(event: SyncEvent) {
    // Coordinate component refresh to avoid conflicts
    if (event.component) {
      this.emit({
        type: 'status_change',
        component: event.component,
        data: { status: 'refreshing' },
        timestamp: new Date(),
        businessId: event.businessId
      });
    }
  }

  private async handleError(event: SyncEvent) {
    // Handle sync errors and retry logic
    console.error(`Sync error for ${event.businessId}:`, event.data);
    
    // Implement retry logic for transient errors
    if (this.shouldRetry(event)) {
      setTimeout(() => {
        this.retryOperation(event);
      }, this.getRetryDelay(event));
    }
  }

  private async handleStatusChange(event: SyncEvent) {
    // Update component status and notify UI
    console.log(`Status change for ${event.component}: ${event.data?.status}`);
  }

  private async validateDataConsistency(businessId: string, component: string, data: any): Promise<boolean> {
    try {
      // Perform consistency checks between related components
      const validationRules = {
        valuation: ['healthScore', 'opportunities'],
        healthScore: ['valuation', 'opportunities'],
        documentIntelligence: ['valuation', 'healthScore'],
        opportunities: ['valuation', 'healthScore']
      };

      const relatedComponents = validationRules[component as keyof typeof validationRules] || [];
      
      // Check for data conflicts or inconsistencies
      for (const relatedComponent of relatedComponents) {
        const isConsistent = await this.checkComponentConsistency(
          businessId, 
          component, 
          relatedComponent, 
          data
        );
        
        if (!isConsistent) {
          this.emit({
            type: 'error',
            component,
            data: { error: `Data inconsistency with ${relatedComponent}` },
            timestamp: new Date(),
            businessId
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Data validation error:', error);
      return false;
    }
  }

  private async checkComponentConsistency(
    businessId: string,
    component1: string,
    component2: string,
    newData: any
  ): Promise<boolean> {
    // Implement specific consistency checks between components
    // This would check things like:
    // - Valuation aligns with health score
    // - Opportunities are reflected in growth projections
    // - Document analysis supports valuation assumptions
    
    return true; // Simplified implementation
  }

  private shouldRetry(event: SyncEvent): boolean {
    // Determine if error is retryable
    const retryableErrors = ['network_error', 'timeout', 'rate_limit'];
    return retryableErrors.includes(event.data?.errorType);
  }

  private getRetryDelay(event: SyncEvent): number {
    // Exponential backoff with jitter
    const attempt = event.data?.attempt || 1;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    
    return delay + jitter;
  }

  private async retryOperation(event: SyncEvent) {
    // Retry the failed operation
    const retryEvent = {
      ...event,
      data: {
        ...event.data,
        attempt: (event.data?.attempt || 1) + 1
      }
    };

    if (retryEvent.data.attempt <= 3) { // Max 3 retries
      this.emit(retryEvent);
    } else {
      console.error(`Max retries exceeded for ${event.component} sync`);
    }
  }

  // Real-time sync coordination
  startRealTimeSync(businessId: string): () => void {
    // Set up WebSocket or Server-Sent Events for real-time updates
    const eventSource = new EventSource(`/api/dashboard/sync-events/${businessId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const syncEvent: SyncEvent = JSON.parse(event.data);
        this.emit(syncEvent);
      } catch (error) {
        console.error('Failed to parse sync event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Sync event stream error:', error);
      this.emit({
        type: 'error',
        data: { error: 'Real-time sync connection lost' },
        timestamp: new Date(),
        businessId
      });
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  // Manual sync trigger
  async triggerSync(businessId: string, component?: string): Promise<void> {
    this.emit({
      type: 'component_refresh',
      component,
      data: { manual: true },
      timestamp: new Date(),
      businessId
    });

    // Trigger actual sync via API
    try {
      const response = await fetch(`/api/dashboard/sync/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, timestamp: new Date() })
      });

      if (!response.ok) {
        throw new Error('Sync trigger failed');
      }
    } catch (error) {
      this.emit({
        type: 'error',
        data: { error: (error as Error).message },
        timestamp: new Date(),
        businessId
      });
    }
  }

  // Get sync status for monitoring
  getSyncStatus(businessId: string): {
    isConnected: boolean;
    lastSync: Date | null;
    queueSize: number;
    errors: number;
  } {
    const businessEvents = this.syncQueue.filter(e => e.businessId === businessId);
    const errors = businessEvents.filter(e => e.type === 'error').length;
    const lastSyncEvent = businessEvents
      .filter(e => e.type === 'data_update')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      isConnected: this.subscribers.has(businessId),
      lastSync: lastSyncEvent?.timestamp || null,
      queueSize: businessEvents.length,
      errors
    };
  }
}