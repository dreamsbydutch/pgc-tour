/**
 * Unified Data Flow Coordinator
 * 
 * This service coordinates the complete data flow architecture between:
 * - Supabase authentication
 * - Zustand store state management  
 * - Database-driven cache invalidation
 * - Middleware session handling
 * 
 * Provides a single point of coordination for all data flow operations
 */

import { useMainStore } from '../store/store';
import { authStoreService } from '../auth/AuthStoreService';
import { 
  // checkAndRefreshIfNeeded, // Unused import
  refreshWithMiddlewareCoordination,
  coordinateCacheAfterAuth,
  forceRefreshCache
} from '../store/cacheInvalidation';
import { extractAuthHeaders } from '../supabase/middleware';
import type { Member } from '@prisma/client';

interface DataFlowEvent {
  type: 'auth-change' | 'middleware-hint' | 'cache-invalidation' | 'manual-refresh';
  source: string;
  timestamp: number;
  data?: {
    type?: string;
    [key: string]: unknown;
  };
}

interface CoordinationResult {
  success: boolean;
  message: string;
  dataRefreshed?: boolean;
  authUpdated?: boolean;
  cacheCleared?: boolean;
}

class DataFlowCoordinator {
  private eventQueue: DataFlowEvent[] = [];
  private isProcessing = false;
  private coordinationCallbacks = new Set<(event: DataFlowEvent) => void>();

  /**
   * Register a callback to be notified of coordination events
   */
  onCoordinationEvent(callback: (event: DataFlowEvent) => void) {
    this.coordinationCallbacks.add(callback);
    return () => {
      this.coordinationCallbacks.delete(callback);
    };
  }

  /**
   * Emit a coordination event to all listeners
   */
  private emitEvent(event: DataFlowEvent) {
    this.eventQueue.push(event);
    this.coordinationCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in coordination event callback:', error);
      }
    });
  }

  /**
   * Handle authentication state changes with full coordination
   */
  async handleAuthChange(
    member: Member | null, 
    isAuthenticated: boolean,
    source = 'auth-context'
  ): Promise<CoordinationResult> {
    console.log('🔄 DataFlowCoordinator: Handling auth change', { 
      isAuthenticated, 
      memberEmail: member?.email,
      source 
    });

    this.emitEvent({
      type: 'auth-change',
      source,
      timestamp: Date.now(),
      data: { member, isAuthenticated }
    });

    try {
      // 1. Update auth state in store
      const store = useMainStore.getState();
      store.setAuthState(member, isAuthenticated);

      // 2. Update auth store service
      await authStoreService.updateStoreForAuth(member, isAuthenticated);

      // 3. Coordinate cache refresh after auth change
      const cacheCoordinated = await coordinateCacheAfterAuth(isAuthenticated, member?.id);

      console.log('✅ DataFlowCoordinator: Auth change handled successfully');
      
      return {
        success: true,
        message: 'Authentication state coordinated successfully',
        authUpdated: true,
        dataRefreshed: cacheCoordinated
      };

    } catch (error) {
      console.error('❌ DataFlowCoordinator: Auth change coordination failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Auth coordination failed'
      };
    }
  }

  /**
   * Handle middleware cache hints
   */
  async handleMiddlewareHint(
    hint: string,
    headers?: Headers
  ): Promise<CoordinationResult> {
    console.log('🔄 DataFlowCoordinator: Handling middleware hint:', hint);

    this.emitEvent({
      type: 'middleware-hint',
      source: 'middleware',
      timestamp: Date.now(),
      data: { hint, headers: headers ? extractAuthHeaders(headers) : null }
    });

    try {
      let dataRefreshed = false;
      let authUpdated = false;

      switch (hint) {
        case 'refresh-after-auth':
          const refreshResult = await refreshWithMiddlewareCoordination();
          dataRefreshed = refreshResult.refreshed;
          
          // Also refresh user data through auth service
          await authStoreService.refreshUserData();
          authUpdated = true;
          break;

        case 'auth-required':
          console.log('Auth required hint - letting AuthContext handle');
          break;

        case 'auth-error':
          console.warn('Auth error detected by middleware - clearing auth state');
          await this.handleAuthChange(null, false, 'middleware-error');
          authUpdated = true;
          break;

        default:
          console.log('Unknown middleware hint:', hint);
      }

      return {
        success: true,
        message: `Middleware hint '${hint}' processed successfully`,
        dataRefreshed,
        authUpdated
      };

    } catch (error) {
      console.error('❌ DataFlowCoordinator: Middleware hint handling failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Middleware hint processing failed'
      };
    }
  }

  /**
   * Handle cache invalidation events
   */
  async handleCacheInvalidation(
    type: 'tourCards' | 'tournaments' | 'global' = 'global',
    source = 'manual'
  ): Promise<CoordinationResult> {
    console.log('🔄 DataFlowCoordinator: Handling cache invalidation:', { type, source });

    this.emitEvent({
      type: 'cache-invalidation',
      source,
      timestamp: Date.now(),
      data: { type }
    });

    try {
      const refreshed = await forceRefreshCache(type, { source });

      return {
        success: refreshed,
        message: refreshed 
          ? `Cache invalidation for '${type}' completed successfully`
          : `Cache invalidation for '${type}' failed`,
        dataRefreshed: refreshed
      };

    } catch (error) {
      console.error('❌ DataFlowCoordinator: Cache invalidation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Cache invalidation failed'
      };
    }
  }

  /**
   * Perform a complete data flow reset and refresh
   */
  async performCompleteReset(): Promise<CoordinationResult> {
    console.log('🔄 DataFlowCoordinator: Performing complete reset...');

    this.emitEvent({
      type: 'manual-refresh',
      source: 'complete-reset',
      timestamp: Date.now(),
      data: { type: 'complete' }
    });

    try {
      // 1. Clear auth state
      const store = useMainStore.getState();
      store.clearAuthState();

      // 2. Force refresh all cache
      const cacheRefreshed = await forceRefreshCache('global', { 
        source: 'complete-reset',
        forceRefresh: true 
      });

      // 3. Refresh middleware coordination
      let middlewareCoordinated = false;
      if (typeof window !== 'undefined') {
        try {
          const middlewareResult = await refreshWithMiddlewareCoordination();
          middlewareCoordinated = middlewareResult.refreshed;
        } catch (error) {
          console.warn('Middleware coordination failed during reset (non-critical):', error);
        }
      }

      console.log('✅ DataFlowCoordinator: Complete reset finished');

      return {
        success: true,
        message: 'Complete data flow reset completed successfully',
        dataRefreshed: cacheRefreshed || middlewareCoordinated,
        authUpdated: true,
        cacheCleared: true
      };

    } catch (error) {
      console.error('❌ DataFlowCoordinator: Complete reset failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Complete reset failed'
      };
    }
  }

  /**
   * Get current coordination status
   */
  getCoordinationStatus() {
    const store = useMainStore.getState();
    const _authState = authStoreService.getCurrentAuthState(); // Prefixed with underscore to mark as unused
    
    return {
      storeLastUpdated: store._lastUpdated,
      authLastUpdated: store.authLastUpdated,
      isAuthenticated: store.isAuthenticated,
      currentMember: store.currentMember?.email,
      hasValidSession: authStoreService.hasValidUserSession(),
      eventQueueLength: this.eventQueue.length,
      isProcessing: this.isProcessing,
      lastEvent: this.eventQueue[this.eventQueue.length - 1]
    };
  }

  /**
   * Process queued events (for debugging and monitoring)
   */
  processEventQueue() {
    if (this.isProcessing) {
      console.log('Event queue processing already in progress');
      return;
    }

    this.isProcessing = true;
    console.log(`Processing ${this.eventQueue.length} coordination events...`);

    // Simple processing - just log events for now
    // In the future, this could implement more sophisticated event handling
    this.eventQueue.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, event);
    });

    // Clear processed events older than 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.eventQueue = this.eventQueue.filter(event => event.timestamp > fiveMinutesAgo);

    this.isProcessing = false;
    console.log('Event queue processing complete');
  }

  /**
   * Clear event queue (for cleanup)
   */
  clearEventQueue() {
    this.eventQueue = [];
    console.log('Event queue cleared');
  }
}

// Export singleton instance
export const dataFlowCoordinator = new DataFlowCoordinator();

// Export types for external use
export type { DataFlowEvent, CoordinationResult };
