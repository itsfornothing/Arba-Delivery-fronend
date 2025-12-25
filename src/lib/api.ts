// API utility functions for the delivery platform
import { getEnvironmentConfig } from './envValidation';

// Get validated environment configuration
const getApiBaseUrl = (): string => {
  try {
    const config = getEnvironmentConfig();
    return config.NEXT_PUBLIC_API_URL;
  } catch (error) {
    // Fallback for server-side rendering or initialization errors
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface Order {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  created_at: string;
  assigned_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  customer_name: string;
  assigned_courier_name?: string;
}

export interface TrackingData {
  order: Order;
  progress_percentage: number;
  status_timeline: {
    created_at: string;
    assigned_at?: string;
    picked_up_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
  };
  estimated_delivery?: string;
  tracking_steps: Array<{
    status: string;
    label: string;
    completed: boolean;
    timestamp?: string;
    progress: number;
  }>;
  recent_notifications: Array<{
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>;
  last_updated: string;
}

export interface RealTimeUpdates {
  orders: Order[];
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>;
  timestamp: string;
  has_updates: boolean;
}

// Error types for better error handling
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  status: number;
  details?: any;
}

// Utility function to determine error type and format message
function createApiError(status: number, message: string, details?: any): ApiError {
  let type: ApiErrorType;
  let userMessage: string;

  switch (status) {
    case 0:
      type = ApiErrorType.NETWORK_ERROR;
      userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      break;
    case 401:
      type = ApiErrorType.AUTHENTICATION_ERROR;
      userMessage = 'Your session has expired. Please log in again.';
      break;
    case 403:
      type = ApiErrorType.AUTHORIZATION_ERROR;
      userMessage = 'You do not have permission to perform this action.';
      break;
    case 404:
      type = ApiErrorType.NOT_FOUND_ERROR;
      userMessage = 'The requested resource was not found.';
      break;
    case 422:
      type = ApiErrorType.VALIDATION_ERROR;
      userMessage = message || 'Please check your input and try again.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      type = ApiErrorType.SERVER_ERROR;
      userMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
      break;
    default:
      type = ApiErrorType.UNKNOWN_ERROR;
      userMessage = message || 'An unexpected error occurred. Please try again.';
  }

  return {
    type,
    message: userMessage,
    status,
    details
  };
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<T>(endpoint, options);
        
        // If successful or non-retryable error, return immediately
        if (response.data || !this.shouldRetry(response.status)) {
          return response;
        }
        
        lastError = createApiError(response.status, response.error || 'Request failed');
        
        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      } catch (error) {
        lastError = createApiError(0, 'Network error occurred');
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    return {
      error: lastError?.message || 'Request failed after multiple attempts',
      status: lastError?.status || 0,
    };
  }

  private shouldRetry(status: number): boolean {
    // Retry on network errors, server errors, and timeouts
    return status === 0 || status >= 500 || status === 408;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Create a timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, treat as server error
        return {
          error: 'Invalid response from server',
          status: response.status,
        };
      }

      if (!response.ok) {
        const apiError = createApiError(response.status, data.error || data.message || `HTTP ${response.status}`, data);
        
        // Handle authentication errors by redirecting to login
        if (apiError.type === ApiErrorType.AUTHENTICATION_ERROR) {
          this.handleAuthenticationError();
        }
        
        return {
          error: apiError.message,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: 'Request timed out. Please try again.',
            status: 408,
          };
        }
        
        return {
          error: 'Unable to connect to the server. Please check your internet connection.',
          status: 0,
        };
      }

      return {
        error: 'An unexpected error occurred',
        status: 0,
      };
    }
  }

  private handleAuthenticationError() {
    // Clear stored authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }

  // Prevent duplicate requests for the same endpoint
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const requestKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;
    
    // If the same request is already in progress, return the existing promise
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    // Create new request promise
    const requestPromise = this.requestWithRetry<T>(endpoint, options);
    
    // Store in queue
    this.requestQueue.set(requestKey, requestPromise);
    
    // Remove from queue when completed
    requestPromise.finally(() => {
      this.requestQueue.delete(requestKey);
    });

    return requestPromise;
  }

  // Order tracking methods
  async getOrderTracking(orderId: number): Promise<ApiResponse<TrackingData>> {
    return this.request<TrackingData>(`/api/orders/${orderId}/tracking_info/`);
  }

  async getRealTimeUpdates(since?: string): Promise<ApiResponse<RealTimeUpdates>> {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request<RealTimeUpdates>(`/api/orders/real_time_updates/${params}`);
  }

  // Order management methods
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/api/orders/');
  }

  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/api/orders/${orderId}/`);
  }

  async createOrder(orderData: {
    pickup_address: string;
    delivery_address: string;
    distance_km: number;
  }): Promise<ApiResponse<Order>> {
    return this.request<Order>('/api/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/api/orders/${orderId}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Notification methods
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/notifications/');
  }

  async getUnreadNotifications(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/notifications/unread/');
  }

  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.request<{ unread_count: number }>('/api/notifications/unread_count/');
  }

  async markNotificationRead(notificationId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/notifications/${notificationId}/mark_read/`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/notifications/mark_all_read/', {
      method: 'POST',
    });
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
    phone_number: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/api/auth/logout/', {
      method: 'POST',
    });
    this.authToken = null;
    return response;
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Utility functions for real-time updates
export class RealTimeTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private lastUpdate: string | null = null;
  private callbacks: Array<(updates: RealTimeUpdates) => void> = [];

  constructor(private pollInterval: number = 30000) {} // 30 seconds default

  subscribe(callback: (updates: RealTimeUpdates) => void) {
    this.callbacks.push(callback);
    
    // Start polling if this is the first subscriber
    if (this.callbacks.length === 1) {
      this.startPolling();
    }
  }

  unsubscribe(callback: (updates: RealTimeUpdates) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
    
    // Stop polling if no more subscribers
    if (this.callbacks.length === 0) {
      this.stopPolling();
    }
  }

  private async startPolling() {
    // Initial fetch
    await this.fetchUpdates();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.fetchUpdates();
    }, this.pollInterval);
  }

  private stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async fetchUpdates() {
    try {
      const response = await apiClient.getRealTimeUpdates(this.lastUpdate || undefined);
      
      if (response.data) {
        this.lastUpdate = response.data.timestamp;
        
        // Notify all subscribers if there are updates
        if (response.data.has_updates) {
          this.callbacks.forEach(callback => callback(response.data!));
        }
      }
    } catch (error) {
      console.error('Error fetching real-time updates:', error);
    }
  }
}

// Create a singleton real-time tracker
export const realTimeTracker = new RealTimeTracker();

// Utility function to format timestamps
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

// Utility function to calculate time ago
export function timeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}