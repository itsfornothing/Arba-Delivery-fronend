/**
 * Loading State Management System
 * Provides centralized loading state management across the application
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface LoadingState {
  [key: string]: boolean;
}

export interface LoadingStore {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAll: () => void;
  getLoadingKeys: () => string[];
}

export const useLoadingStore = create<LoadingStore>()(
  subscribeWithSelector((set, get) => ({
    loadingStates: {},
    
    setLoading: (key: string, loading: boolean) => {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [key]: loading,
        },
      }));
    },
    
    isLoading: (key: string) => {
      return get().loadingStates[key] || false;
    },
    
    isAnyLoading: () => {
      const states = get().loadingStates;
      return Object.values(states).some(loading => loading);
    },
    
    clearAll: () => {
      set({ loadingStates: {} });
    },
    
    getLoadingKeys: () => {
      const states = get().loadingStates;
      return Object.keys(states).filter(key => states[key]);
    },
  }))
);

// Hook for managing loading state of a specific operation
export const useLoading = (key: string) => {
  const { setLoading, isLoading } = useLoadingStore();
  
  const startLoading = () => setLoading(key, true);
  const stopLoading = () => setLoading(key, false);
  const loading = isLoading(key);
  
  return {
    loading,
    startLoading,
    stopLoading,
    setLoading: (loading: boolean) => setLoading(key, loading),
  };
};

// Hook for managing async operations with automatic loading states
export const useAsyncOperation = <T extends any[], R>(
  key: string,
  operation: (...args: T) => Promise<R>
) => {
  const { loading, startLoading, stopLoading } = useLoading(key);
  
  const execute = async (...args: T): Promise<R> => {
    try {
      startLoading();
      const result = await operation(...args);
      return result;
    } finally {
      stopLoading();
    }
  };
  
  return {
    loading,
    execute,
  };
};

// Loading state keys for common operations
export const LoadingKeys = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',
  
  // Orders
  CREATE_ORDER: 'orders.create',
  FETCH_ORDERS: 'orders.fetch',
  UPDATE_ORDER: 'orders.update',
  DELETE_ORDER: 'orders.delete',
  
  // User Management
  FETCH_PROFILE: 'user.profile',
  UPDATE_PROFILE: 'user.update',
  UPLOAD_AVATAR: 'user.avatar',
  
  // Dashboard
  FETCH_STATS: 'dashboard.stats',
  FETCH_ANALYTICS: 'dashboard.analytics',
  
  // Courier
  FETCH_AVAILABLE_ORDERS: 'courier.available',
  ACCEPT_ORDER: 'courier.accept',
  UPDATE_STATUS: 'courier.status',
  
  // Admin
  FETCH_USERS: 'admin.users',
  FETCH_REPORTS: 'admin.reports',
  SYSTEM_SETTINGS: 'admin.settings',
  
  // File Operations
  UPLOAD_FILE: 'file.upload',
  DELETE_FILE: 'file.delete',
  
  // Page Loading
  PAGE_LOAD: 'page.load',
  COMPONENT_LOAD: 'component.load',
} as const;

// Type for loading keys
export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys] | string;

// Utility function to create scoped loading keys
export const createLoadingKey = (scope: string, operation: string, id?: string | number) => {
  return id ? `${scope}.${operation}.${id}` : `${scope}.${operation}`;
};

// Hook for page-level loading management
export const usePageLoading = (pageName: string) => {
  const key = createLoadingKey('page', pageName);
  return useLoading(key);
};

// Hook for component-level loading management
export const useComponentLoading = (componentName: string, instanceId?: string) => {
  const key = instanceId 
    ? createLoadingKey('component', componentName, instanceId)
    : createLoadingKey('component', componentName);
  return useLoading(key);
};