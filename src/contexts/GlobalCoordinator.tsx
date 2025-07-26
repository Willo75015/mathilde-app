// 🚀 CHUNK 8: GLOBAL COORDINATOR - ORCHESTRATION CENTRALE MATHILDE APP
// Architecture basée sur patterns SWR Global State découverts via Context7 MCP
// Date: 26 Juillet 2025

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';

// 🎯 TYPES GLOBAL COORDINATION
interface GlobalState {
  // Cross-context coordination status
  isCoordinating: boolean;
  coordinationStatus: 'idle' | 'syncing' | 'error' | 'synced';
  lastSyncTimestamp: Date | null;
  
  // Performance monitoring
  performanceMetrics: {
    contextRenderCount: number;
    crossContextCalls: number;
    avgResponseTime: number;
    memoryUsage: number;
  };
  
  // Real-time synchronization state
  realTimeConnections: {
    auth: boolean;
    dashboard: boolean;
    events: boolean;
    calendar: boolean;
    clients: boolean;
    florists: boolean;
    analytics: boolean;
  };
  
  // Error handling & retry logic
  errors: GlobalError[];
  retryQueue: RetryOperation[];
  
  // Cross-context communication events
  globalEvents: GlobalEvent[];
  eventListeners: Map<string, GlobalEventListener[]>;
}

interface GlobalError {
  id: string;
  context: string;
  message: string;
  timestamp: Date;
  retryCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RetryOperation {
  id: string;
  operation: () => Promise<void>;
  maxRetries: number;
  currentRetry: number;
  delay: number;
  context: string;
}

interface GlobalEvent {
  id: string;
  type: 'EVENT_CREATED' | 'EVENT_UPDATED' | 'CLIENT_UPDATED' | 'FLORIST_ASSIGNED' | 'ANALYTICS_REFRESHED';
  sourceContext: string;
  data: any;
  timestamp: Date;
  propagatedTo: string[];
}

type GlobalEventListener = (event: GlobalEvent) => void;

// 🎯 ACTIONS GLOBAL COORDINATION
type GlobalAction = 
  | { type: 'START_COORDINATION' }
  | { type: 'SYNC_SUCCESS'; timestamp: Date }
  | { type: 'SYNC_ERROR'; error: GlobalError }  | { type: 'UPDATE_PERFORMANCE'; metrics: Partial<GlobalState['performanceMetrics']> }
  | { type: 'CONNECTION_STATUS_CHANGED'; context: string; connected: boolean }
  | { type: 'ADD_GLOBAL_EVENT'; event: GlobalEvent }
  | { type: 'REGISTER_EVENT_LISTENER'; eventType: string; listener: GlobalEventListener }
  | { type: 'ADD_RETRY_OPERATION'; operation: RetryOperation }
  | { type: 'REMOVE_RETRY_OPERATION'; operationId: string }
  | { type: 'CLEAR_OLD_EVENTS' };

// 🎯 REDUCER GLOBAL COORDINATION avec patterns SWR Global State
function globalCoordinatorReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'START_COORDINATION':
      return {
        ...state,
        isCoordinating: true,
        coordinationStatus: 'syncing',
        performanceMetrics: {
          ...state.performanceMetrics,
          contextRenderCount: state.performanceMetrics.contextRenderCount + 1
        }
      };

    case 'SYNC_SUCCESS':
      return {
        ...state,
        coordinationStatus: 'synced',
        lastSyncTimestamp: action.timestamp,
        isCoordinating: false
      };

    case 'SYNC_ERROR':
      return {
        ...state,
        coordinationStatus: 'error',
        isCoordinating: false,
        errors: [...state.errors.slice(-9), action.error] // Keep last 10 errors
      };
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          ...action.metrics
        }
      };

    case 'CONNECTION_STATUS_CHANGED':
      return {
        ...state,
        realTimeConnections: {
          ...state.realTimeConnections,
          [action.context]: action.connected
        }
      };

    case 'ADD_GLOBAL_EVENT':
      return {
        ...state,
        globalEvents: [...state.globalEvents.slice(-99), action.event] // Keep last 100 events
      };

    case 'REGISTER_EVENT_LISTENER':
      const currentListeners = state.eventListeners.get(action.eventType) || [];
      const newListeners = new Map(state.eventListeners);
      newListeners.set(action.eventType, [...currentListeners, action.listener]);
      return {
        ...state,
        eventListeners: newListeners
      };

    case 'ADD_RETRY_OPERATION':
      return {
        ...state,
        retryQueue: [...state.retryQueue, action.operation]
      };
    case 'REMOVE_RETRY_OPERATION':
      return {
        ...state,
        retryQueue: state.retryQueue.filter(op => op.id !== action.operationId)
      };

    case 'CLEAR_OLD_EVENTS':
      // Clear events older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return {
        ...state,
        globalEvents: state.globalEvents.filter(event => event.timestamp > oneHourAgo),
        errors: state.errors.filter(error => error.timestamp > oneHourAgo)
      };

    default:
      return state;
  }
}

// 🎯 INITIAL STATE avec patterns découverts
const initialGlobalState: GlobalState = {
  isCoordinating: false,
  coordinationStatus: 'idle',
  lastSyncTimestamp: null,
  performanceMetrics: {
    contextRenderCount: 0,
    crossContextCalls: 0,
    avgResponseTime: 0,
    memoryUsage: 0
  },
  realTimeConnections: {
    auth: false,
    dashboard: false,
    events: false,
    calendar: false,
    clients: false,
    florists: false,
    analytics: false
  },  errors: [],
  retryQueue: [],
  globalEvents: [],
  eventListeners: new Map()
};

// 🎯 CONTEXT INTERFACE
interface GlobalCoordinatorContextType {
  state: GlobalState;
  
  // Core coordination functions
  startGlobalSync: () => Promise<void>;
  broadcastEvent: (event: Omit<GlobalEvent, 'id' | 'timestamp' | 'propagatedTo'>) => void;
  
  // Performance monitoring
  updatePerformanceMetrics: (metrics: Partial<GlobalState['performanceMetrics']>) => void;
  getCoordinationHealth: () => {
    overall: 'excellent' | 'good' | 'warning' | 'critical';
    contexts: Record<string, boolean>;
    avgResponseTime: number;
    errorRate: number;
  };
  
  // Error handling & retry
  addRetryOperation: (operation: Omit<RetryOperation, 'id'>) => string;
  removeRetryOperation: (operationId: string) => void;
  retryFailedOperations: () => Promise<void>;
  
  // Event management
  addEventListener: (eventType: string, listener: GlobalEventListener) => () => void;
  removeEventListener: (eventType: string, listener: GlobalEventListener) => void;
  
  // Context coordination helpers
  syncWithAllContexts: () => Promise<void>;
  getContextStatus: (contextName: string) => boolean;
  setContextConnection: (contextName: string, connected: boolean) => void;
}
// 🎯 CONTEXT CREATION
const GlobalCoordinatorContext = createContext<GlobalCoordinatorContextType | null>(null);

// 🚀 GLOBAL COORDINATOR PROVIDER avec patterns SWR Global State
export const GlobalCoordinatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalCoordinatorReducer, initialGlobalState);

  // 🎯 CORE COORDINATION FUNCTIONS
  const startGlobalSync = useCallback(async () => {
    dispatch({ type: 'START_COORDINATION' });
    
    try {
      const syncStart = performance.now();
      
      // Simulate coordination process with all contexts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const syncEnd = performance.now();
      const responseTime = syncEnd - syncStart;
      
      dispatch({ 
        type: 'UPDATE_PERFORMANCE', 
        metrics: { 
          crossContextCalls: state.performanceMetrics.crossContextCalls + 1,
          avgResponseTime: (state.performanceMetrics.avgResponseTime + responseTime) / 2
        } 
      });
      
      dispatch({ type: 'SYNC_SUCCESS', timestamp: new Date() });
    } catch (error) {
      const globalError: GlobalError = {
        id: `error_${Date.now()}`,
        context: 'global_coordinator',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
        retryCount: 0,
        severity: 'high'
      };
      
      dispatch({ type: 'SYNC_ERROR', error: globalError });
    }
  }, [state.performanceMetrics]);

  // 🎯 EVENT BROADCASTING avec patterns découverts
  const broadcastEvent = useCallback((eventData: Omit<GlobalEvent, 'id' | 'timestamp' | 'propagatedTo'>) => {    const event: GlobalEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      propagatedTo: []
    };
    
    dispatch({ type: 'ADD_GLOBAL_EVENT', event });
    
    // Propagate to registered listeners
    const listeners = state.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
        event.propagatedTo.push('listener');
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }, [state.eventListeners]);

  // 🎯 PERFORMANCE MONITORING
  const updatePerformanceMetrics = useCallback((metrics: Partial<GlobalState['performanceMetrics']>) => {
    dispatch({ type: 'UPDATE_PERFORMANCE', metrics });
  }, []);

  const getCoordinationHealth = useCallback(() => {
    const connectedContexts = Object.values(state.realTimeConnections).filter(Boolean).length;
    const totalContexts = Object.keys(state.realTimeConnections).length;
    const connectionRatio = connectedContexts / totalContexts;
    const errorRate = state.errors.length / Math.max(state.performanceMetrics.crossContextCalls, 1);
    
    let overall: 'excellent' | 'good' | 'warning' | 'critical';
    if (connectionRatio >= 0.9 && errorRate < 0.05) overall = 'excellent';
    else if (connectionRatio >= 0.7 && errorRate < 0.1) overall = 'good';
    else if (connectionRatio >= 0.5 && errorRate < 0.2) overall = 'warning';
    else overall = 'critical';

    return {
      overall,
      contexts: state.realTimeConnections,
      avgResponseTime: state.performanceMetrics.avgResponseTime,
      errorRate
    };
  }, [state]);
  // 🎯 RETRY LOGIC avec patterns SWR Global State
  const addRetryOperation = useCallback((operationData: Omit<RetryOperation, 'id'>) => {
    const operation: RetryOperation = {
      ...operationData,
      id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    dispatch({ type: 'ADD_RETRY_OPERATION', operation });
    return operation.id;
  }, []);

  const removeRetryOperation = useCallback((operationId: string) => {
    dispatch({ type: 'REMOVE_RETRY_OPERATION', operationId });
  }, []);

  const retryFailedOperations = useCallback(async () => {
    for (const operation of state.retryQueue) {
      if (operation.currentRetry < operation.maxRetries) {
        try {
          await new Promise(resolve => setTimeout(resolve, operation.delay));
          await operation.operation();
          removeRetryOperation(operation.id);
        } catch (error) {
          const updatedOperation = {
            ...operation,
            currentRetry: operation.currentRetry + 1,
            delay: Math.min(operation.delay * 2, 10000) // Exponential backoff max 10s
          };
          
          removeRetryOperation(operation.id);
          
          if (updatedOperation.currentRetry < updatedOperation.maxRetries) {
            dispatch({ type: 'ADD_RETRY_OPERATION', operation: updatedOperation });
          }
        }
      }
    }
  }, [state.retryQueue, removeRetryOperation]);
  // 🎯 EVENT LISTENERS MANAGEMENT
  const addEventListener = useCallback((eventType: string, listener: GlobalEventListener) => {
    dispatch({ type: 'REGISTER_EVENT_LISTENER', eventType, listener });
    
    // Return cleanup function
    return () => {
      const currentListeners = state.eventListeners.get(eventType) || [];
      const newListeners = currentListeners.filter(l => l !== listener);
      const newMap = new Map(state.eventListeners);
      
      if (newListeners.length === 0) {
        newMap.delete(eventType);
      } else {
        newMap.set(eventType, newListeners);
      }
    };
  }, [state.eventListeners]);

  const removeEventListener = useCallback((eventType: string, listener: GlobalEventListener) => {
    const currentListeners = state.eventListeners.get(eventType) || [];
    const newListeners = currentListeners.filter(l => l !== listener);
    const newMap = new Map(state.eventListeners);
    
    if (newListeners.length === 0) {
      newMap.delete(eventType);
    } else {
      newMap.set(eventType, newListeners);
    }
  }, [state.eventListeners]);

  // 🎯 CONTEXT COORDINATION HELPERS
  const syncWithAllContexts = useCallback(async () => {
    await startGlobalSync();
    
    // Trigger sync across all connected contexts
    broadcastEvent({
      type: 'ANALYTICS_REFRESHED',
      sourceContext: 'global_coordinator',
      data: { type: 'full_sync', timestamp: new Date() }
    });
  }, [startGlobalSync, broadcastEvent]);
  const getContextStatus = useCallback((contextName: string) => {
    return state.realTimeConnections[contextName as keyof typeof state.realTimeConnections] || false;
  }, [state.realTimeConnections]);

  const setContextConnection = useCallback((contextName: string, connected: boolean) => {
    dispatch({ type: 'CONNECTION_STATUS_CHANGED', context: contextName, connected });
  }, []);

  // 🎯 AUTOMATIC CLEANUP & MAINTENANCE
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEAR_OLD_EVENTS' });
    }, 60000); // Clean every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // 🎯 AUTOMATIC RETRY PROCESSING
  useEffect(() => {
    if (state.retryQueue.length > 0) {
      const retryInterval = setInterval(() => {
        retryFailedOperations();
      }, 5000); // Retry every 5 seconds

      return () => clearInterval(retryInterval);
    }
  }, [state.retryQueue.length, retryFailedOperations]);

  // 🎯 PERFORMANCE MONITORING
  useEffect(() => {
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    updatePerformanceMetrics({ memoryUsage });
  }, [updatePerformanceMetrics]);

  // 🎯 MEMOIZED VALUE pour optimisation performance
  const value = useMemo(() => ({
    state,
    startGlobalSync,
    broadcastEvent,
    updatePerformanceMetrics,
    getCoordinationHealth,
    addRetryOperation,
    removeRetryOperation,
    retryFailedOperations,
    addEventListener,
    removeEventListener,
    syncWithAllContexts,
    getContextStatus,
    setContextConnection
  }), [    state,
    startGlobalSync,
    broadcastEvent,
    updatePerformanceMetrics,
    getCoordinationHealth,
    addRetryOperation,
    removeRetryOperation,
    retryFailedOperations,
    addEventListener,
    removeEventListener,
    syncWithAllContexts,
    getContextStatus,
    setContextConnection
  ]);

  return (
    <GlobalCoordinatorContext.Provider value={value}>
      {children}
    </GlobalCoordinatorContext.Provider>
  );
};

// 🎯 CUSTOM HOOKS avec patterns SWR Global State
export const useGlobalCoordinator = (): GlobalCoordinatorContextType => {
  const context = useContext(GlobalCoordinatorContext);
  if (!context) {
    throw new Error('useGlobalCoordinator must be used within GlobalCoordinatorProvider');
  }
  return context;
};

// 🎯 SPECIALIZED HOOKS pour domaines métier
export const useGlobalSync = () => {
  const { startGlobalSync, syncWithAllContexts, state } = useGlobalCoordinator();
  
  return {
    triggerSync: startGlobalSync,
    syncAllContexts: syncWithAllContexts,
    isCoordinating: state.isCoordinating,
    coordinationStatus: state.coordinationStatus,
    lastSync: state.lastSyncTimestamp
  };
};
export const useGlobalPerformance = () => {
  const { state, updatePerformanceMetrics, getCoordinationHealth } = useGlobalCoordinator();
  
  return {
    metrics: state.performanceMetrics,
    health: getCoordinationHealth(),
    connections: state.realTimeConnections,
    updateMetrics: updatePerformanceMetrics,
    renderCount: state.performanceMetrics.contextRenderCount,
    avgResponseTime: state.performanceMetrics.avgResponseTime
  };
};

export const useGlobalEvents = () => {
  const { broadcastEvent, addEventListener, removeEventListener, state } = useGlobalCoordinator();
  
  return {
    broadcast: broadcastEvent,
    subscribe: addEventListener,
    unsubscribe: removeEventListener,
    recentEvents: state.globalEvents.slice(-10), // Last 10 events
    eventCount: state.globalEvents.length
  };
};

export const useGlobalErrors = () => {
  const { state, addRetryOperation, retryFailedOperations } = useGlobalCoordinator();
  
  return {
    errors: state.errors,
    retryQueue: state.retryQueue,
    addRetry: addRetryOperation,
    retryAll: retryFailedOperations,
    hasErrors: state.errors.length > 0,
    criticalErrors: state.errors.filter(e => e.severity === 'critical'),
    errorRate: state.errors.length / Math.max(state.performanceMetrics.crossContextCalls, 1)
  };
};

// 🎯 CONTEXT STATUS HELPER
export const useContextConnection = (contextName: string) => {
  const { getContextStatus, setContextConnection } = useGlobalCoordinator();
  
  return {
    isConnected: getContextStatus(contextName),
    setConnected: (connected: boolean) => setContextConnection(contextName, connected)
  };
};