export const apiClient = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  setAuthToken: jest.fn(),
  createOrder: jest.fn(),
  getOrders: jest.fn(),
  getOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  getOrderTracking: jest.fn(),
  getRealTimeUpdates: jest.fn(),
  getNotifications: jest.fn(),
  getUnreadNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
};

export const realTimeTracker = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

export const formatTimestamp = jest.fn();
export const timeAgo = jest.fn();