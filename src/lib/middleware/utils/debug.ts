/**
 * Middleware Debug Utilities
 * 
 * Development-only debugging tools for the middleware system
 */

import { middlewareManager } from '../core/manager';

export interface MiddlewareDebugInfo {
  timestamp: string;
  pathname: string;
  duration: number;
  middlewares: {
    name: string;
    executed: boolean;
    duration?: number;
    error?: string;
  }[];
  headers: Record<string, string>;
  finalStatus: number;
}

class MiddlewareDebugger {
  private executionHistory: MiddlewareDebugInfo[] = [];
  private maxHistorySize = 100;

  /**
   * Get current middleware status
   */
  getMiddlewareStatus() {
    return middlewareManager.getStatus();
  }

  /**
   * Enable/disable a specific middleware
   */
  toggleMiddleware(name: string, enabled?: boolean) {
    const currentStatus = middlewareManager.getStatus();
    const middleware = currentStatus.find(m => m.name === name);
    
    if (!middleware) {
      console.error(`Middleware '${name}' not found. Available middlewares:`, 
        currentStatus.map(m => m.name));
      return false;
    }
    
    const newState = enabled ?? !middleware.enabled;
    middlewareManager.setEnabled(name, newState);
    
    console.log(`Middleware '${name}' ${newState ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get recent execution history
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
    console.log('Middleware execution history cleared');
  }

  /**
   * Record execution info (called internally)
   */
  recordExecution(info: MiddlewareDebugInfo) {
    this.executionHistory.push(info);
    
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Print detailed status report
   */
  printStatus() {
    const status = this.getMiddlewareStatus();
    const recentHistory = this.getExecutionHistory(5);
    
    console.group('🔧 Middleware Debug Status');
    
    console.group('📋 Registered Middlewares');
    status.forEach(m => {
      console.log(`${m.enabled ? '✅' : '❌'} ${m.name} (priority: ${m.priority})`);
    });
    console.groupEnd();
    
    if (recentHistory.length > 0) {
      console.group('📊 Recent Executions');
      recentHistory.forEach((exec, i) => {
        console.log(`${i + 1}. ${exec.pathname} (${exec.duration}ms) - Status: ${exec.finalStatus}`);
        exec.middlewares.forEach(m => {
          const status = m.executed ? (m.error ? '❌' : '✅') : '⏭️';
          const time = m.duration ? ` (${m.duration}ms)` : '';
          console.log(`   ${status} ${m.name}${time}${m.error ? ` - Error: ${m.error}` : ''}`);
        });
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Monitor middleware performance
   */
  monitorPerformance(enable = true) {
    if (enable) {
      console.log('🔍 Middleware performance monitoring enabled');
    } else {
      console.log('🔍 Middleware performance monitoring disabled');
    }
  }
}

export const middlewareDebugger = new MiddlewareDebugger();

// Browser console interface for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).middlewareDebug = {
    status: () => middlewareDebugger.printStatus(),
    toggle: (name: string, enabled?: boolean) => middlewareDebugger.toggleMiddleware(name, enabled),
    history: (limit?: number) => middlewareDebugger.getExecutionHistory(limit),
    clear: () => middlewareDebugger.clearHistory(),
    monitor: (enable?: boolean) => middlewareDebugger.monitorPerformance(enable),
    
    // Quick access functions
    enableAll: () => {
      const status = middlewareDebugger.getMiddlewareStatus();
      status.forEach(m => middlewareDebugger.toggleMiddleware(m.name, true));
      console.log('All middlewares enabled');
    },
    disableAll: () => {
      const status = middlewareDebugger.getMiddlewareStatus();
      status.forEach(m => middlewareDebugger.toggleMiddleware(m.name, false));
      console.log('All middlewares disabled');
    },
    onlyAuth: () => {
      const status = middlewareDebugger.getMiddlewareStatus();
      status.forEach(m => {
        middlewareDebugger.toggleMiddleware(m.name, m.name === 'auth');
      });
      console.log('Only auth middleware enabled');
    }
  };
  
  console.log('🔧 Middleware Debug Commands Available:');
  console.log('- middlewareDebug.status() - Show current status');
  console.log('- middlewareDebug.toggle(name, enabled?) - Toggle middleware');
  console.log('- middlewareDebug.history(limit?) - Show execution history');
  console.log('- middlewareDebug.clear() - Clear history');
  console.log('- middlewareDebug.onlyAuth() - Enable only auth middleware');
  console.log('- middlewareDebug.enableAll() / disableAll() - Control all at once');
}
