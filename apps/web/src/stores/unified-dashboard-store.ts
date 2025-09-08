import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UnifiedDashboard } from '@/types/unified-dashboard';
import type { ExportProgress } from '@/types/export-types';
import { DataAggregator } from '@/lib/integrators/data-aggregator';

interface UnifiedDashboardState {
  // Dashboard data
  dashboard: UnifiedDashboard | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;

  // Component-specific loading states
  componentLoading: {
    valuation: boolean;
    healthScore: boolean;
    documentIntelligence: boolean;
    opportunities: boolean;
  };

  // Export state
  exportProgress: Map<string, ExportProgress>;
  activeExports: string[];

  // Premium state
  premiumAccess: boolean;
  trialDaysRemaining: number | null;
  upgradePromptVisible: boolean;
  currentUpgradePrompt: any | null;

  // UI state
  selectedComponent: 'overview' | 'valuation' | 'healthScore' | 'documentIntelligence' | 'opportunities' | null;
  drillDownVisible: boolean;
  drillDownComponent: string | null;
  sidebarCollapsed: boolean;

  // Actions
  loadDashboard: (userId: string, businessId: string, forceRefresh?: boolean) => Promise<void>;
  refreshComponent: (component: string, businessId: string) => Promise<void>;
  refreshAll: (userId: string, businessId: string) => Promise<void>;
  
  // Export actions
  startExport: (config: any) => Promise<string>;
  trackExportProgress: (exportId: string) => void;
  updateExportProgress: (exportId: string, progress: ExportProgress) => void;
  
  // Premium actions
  checkPremiumAccess: (userId: string) => Promise<void>;
  showUpgradePrompt: (prompt: any) => void;
  hideUpgradePrompt: () => void;
  trackUpgradeInteraction: (action: string, promptId: string) => void;
  
  // UI actions
  setSelectedComponent: (component: string) => void;
  toggleDrillDown: (component?: string) => void;
  toggleSidebar: () => void;
  
  // Data synchronization
  subscribeToUpdates: (businessId: string) => void;
  unsubscribeFromUpdates: (businessId: string) => void;
  
  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

export const useUnifiedDashboardStore = create<UnifiedDashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    dashboard: null,
    isLoading: false,
    error: null,
    lastRefresh: null,
    
    componentLoading: {
      valuation: false,
      healthScore: false,
      documentIntelligence: false,
      opportunities: false,
    },
    
    exportProgress: new Map(),
    activeExports: [],
    
    premiumAccess: false,
    trialDaysRemaining: null,
    upgradePromptVisible: false,
    currentUpgradePrompt: null,
    
    selectedComponent: 'overview',
    drillDownVisible: false,
    drillDownComponent: null,
    sidebarCollapsed: false,

    // Dashboard loading
    loadDashboard: async (userId: string, businessId: string, forceRefresh = false) => {
      const { dashboard } = get();
      
      // Use cached data if available and not forcing refresh
      if (dashboard && !forceRefresh) {
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const aggregator = DataAggregator.getInstance();
        
        // Clear cache if forcing refresh
        if (forceRefresh) {
          aggregator.clearCache(businessId);
        }

        const unifiedDashboard = await aggregator.aggregateUnifiedDashboard(userId, businessId);
        
        set({ 
          dashboard: unifiedDashboard,
          isLoading: false,
          lastRefresh: new Date(),
          error: null
        });

        // Check premium access
        get().checkPremiumAccess(userId);

      } catch (error) {
        console.error('Failed to load dashboard:', error);
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load dashboard'
        });
      }
    },

    // Component-specific refresh
    refreshComponent: async (component: string, businessId: string) => {
      set(state => ({
        componentLoading: {
          ...state.componentLoading,
          [component]: true
        }
      }));

      try {
        // Refresh specific component data
        const response = await fetch(`/api/dashboard/refresh/${component}/${businessId}`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh ${component}`);
        }

        // Reload entire dashboard to maintain consistency
        const { dashboard } = get();
        if (dashboard) {
          await get().loadDashboard(dashboard.userId, businessId, true);
        }

      } catch (error) {
        console.error(`Failed to refresh ${component}:`, error);
        set({ error: `Failed to refresh ${component}` });
      } finally {
        set(state => ({
          componentLoading: {
            ...state.componentLoading,
            [component]: false
          }
        }));
      }
    },

    // Refresh all components
    refreshAll: async (userId: string, businessId: string) => {
      await get().loadDashboard(userId, businessId, true);
    },

    // Export management (disabled - APIs removed)
    startExport: async (config: any): Promise<string> => {
      console.log('Export functionality disabled - APIs removed');
      throw new Error('Export functionality not available');
    },

    trackExportProgress: (exportId: string) => {
      console.log('Export progress tracking disabled - APIs removed');
    },

    updateExportProgress: (exportId: string, progress: ExportProgress) => {
      set(state => ({
        exportProgress: new Map(state.exportProgress.set(exportId, progress))
      }));
    },

    // Premium access management (disabled - APIs removed)
    checkPremiumAccess: async (userId: string) => {
      // Default to no premium access since API was removed
      set({ 
        premiumAccess: false,
        trialDaysRemaining: null 
      });
    },

    showUpgradePrompt: (prompt: any) => {
      set({ 
        upgradePromptVisible: true,
        currentUpgradePrompt: prompt 
      });

      // Track impression
      get().trackUpgradeInteraction('view', prompt.id);
    },

    hideUpgradePrompt: () => {
      set({ 
        upgradePromptVisible: false,
        currentUpgradePrompt: null 
      });
    },

    trackUpgradeInteraction: async (action: string, promptId: string) => {
      try {
        await fetch('/api/premium/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, promptId, timestamp: new Date() })
        });
      } catch (error) {
        console.error('Upgrade interaction tracking failed:', error);
      }
    },

    // UI state management
    setSelectedComponent: (component: string) => {
      set({ selectedComponent: component as any });
    },

    toggleDrillDown: (component?: string) => {
      set(state => ({
        drillDownVisible: !state.drillDownVisible,
        drillDownComponent: component || state.drillDownComponent
      }));
    },

    toggleSidebar: () => {
      set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    // Real-time updates
    subscribeToUpdates: (businessId: string) => {
      const aggregator = DataAggregator.getInstance();
      aggregator.subscribeToRefresh(businessId, (data: UnifiedDashboard) => {
        set({ 
          dashboard: data,
          lastRefresh: new Date()
        });
      });
    },

    unsubscribeFromUpdates: (businessId: string) => {
      // Implementation would depend on the specific subscription system
    },

    // Error handling
    clearError: () => set({ error: null }),
    setError: (error: string) => set({ error })
  }))
);

// Selector hooks for optimized component updates
export const useDashboardData = () => useUnifiedDashboardStore(state => state.dashboard);
export const useDashboardLoading = () => useUnifiedDashboardStore(state => state.isLoading);
export const useDashboardError = () => useUnifiedDashboardStore(state => state.error);
export const useComponentLoading = () => useUnifiedDashboardStore(state => state.componentLoading);
export const useExportProgress = () => useUnifiedDashboardStore(state => state.exportProgress);
export const usePremiumAccess = () => useUnifiedDashboardStore(state => ({
  hasAccess: state.premiumAccess,
  trialDaysRemaining: state.trialDaysRemaining
}));
export const useUpgradePrompt = () => useUnifiedDashboardStore(state => ({
  visible: state.upgradePromptVisible,
  prompt: state.currentUpgradePrompt
}));