import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // Increased to 30 seconds for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if it's a server connection error vs actual auth failure
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        // Server is down, don't logout - just show error
        console.warn('Server connection failed, keeping user logged in');
        return Promise.reject(error);
      }
      
      // Check if it's a token expiration error
      const isTokenExpired = error.response?.data?.message?.includes('expired') || 
                            error.response?.data?.message?.includes('Token');
      
      if (isTokenExpired) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the token
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
              refreshToken
            });
            
            if (response.data.success) {
              // Update tokens
              Cookies.set('auth_token', response.data.data.accessToken, { expires: 7 });
              Cookies.set('refresh_token', response.data.data.refreshToken, { expires: 7 });
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
        
        // If refresh fails, logout user
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setup: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/setup', userData);
    return response.data;
  },

  login: async (emailOrUsername: string, password: string) => {
    const response = await api.post('/auth/login', {
      emailOrUsername,
      password,
    });
    return response.data;
  },

  registerCashier: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register-cashier', userData);
    return response.data;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  logout: async (sessionId?: string) => {
    const response = await api.post('/auth/logout', { sessionId });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
    return response.data;
  },

  verifyResetToken: async (token: string) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isActive?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    // Check if productData is FormData (has image)
    if (productData instanceof FormData) {
      const response = await api.post('/products/with-image', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await api.post('/products', productData);
      return response.data;
    }
  },

  updateProduct: async (id: string, productData: any) => {
    // Check if productData is FormData (has image)
    if (productData instanceof FormData) {
      const response = await api.put(`/products/${id}/with-image`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    }
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  toggleProductStatus: async (id: string) => {
    const response = await api.patch(`/products/${id}/toggle-status`);
    return response.data;
  },

  updateStock: async (id: string, stockData: {
    stock: number;
    operation?: 'set' | 'add' | 'subtract';
  }) => {
    const response = await api.patch(`/products/${id}/stock`, stockData);
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get('/products/alerts/low-stock');
    return response.data;
  },

  getOutOfStockProducts: async () => {
    const response = await api.get('/products/alerts/out-of-stock');
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getBrands: async () => {
    const response = await api.get('/products/brands');
    return response.data;
  },
};

// Categories API - using Product.categories endpoint for single category system
export const categoriesAPI = {
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },
  createCategory: async (categoryData: { category: string }) => {
    const response = await api.post('/products/categories', categoryData);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAllNotifications: async () => {
    const response = await api.get('/notifications/all');
    return response.data;
  },

  getPendingCount: async () => {
    const response = await api.get('/notifications/pending-count');
    return response.data;
  },

  getPendingUsers: async (limit: number = 5) => {
    const response = await api.get(`/notifications/pending-users?limit=${limit}`);
    return response.data;
  },

  getLowStockAlerts: async () => {
    const response = await api.get('/notifications/low-stock');
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getTransaction: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transactionData: {
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice?: number;
      discount?: number;
    }>;
    paymentMethod: 'cash' | 'card' | 'digital';
    customerId?: string;
    customerName?: string;
    notes?: string;
    discount?: number;
    tax?: number;
  }) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  refundTransaction: async (id: string, reason?: string) => {
    const response = await api.post(`/transactions/${id}/refund`, { reason });
    return response.data;
  },


  getDailySales: async (date?: string) => {
    const response = await api.get('/transactions/sales/daily', {
      params: { date },
    });
    return response.data;
  },

  getSalesByCashier: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/transactions/sales/by-cashier', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTopProducts: async (startDate?: string, endDate?: string, limit?: number) => {
    const response = await api.get('/transactions/sales/top-products', {
      params: { startDate, endDate, limit },
    });
    return response.data;
  },
};

// Users API (Admin only)
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: {
    username?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const response = await api.post(`/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

// Analytics API (Admin only)
export const analyticsAPI = {
  getDashboard: async (period?: string) => {
    const response = await api.get('/analytics/dashboard', {
      params: { period },
    });
    return response.data;
  },

  getSalesAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const response = await api.get('/analytics/sales', { params });
    return response.data;
  },

  getProductAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const response = await api.get('/analytics/products', { params });
    return response.data;
  },

  getCashierAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/analytics/cashiers', { params });
    return response.data;
  },

  getInventoryAnalytics: async () => {
    const response = await api.get('/analytics/inventory');
    return response.data;
  },
};

// System Settings API
export const systemSettingsAPI = {
  // Get system settings
  getSettings: async () => api.get('/system-settings'),
  
  // Update system settings
  updateSettings: async (settings: any) => api.put('/system-settings', settings),
  
  // Get maintenance status (public)
  getMaintenanceStatus: async () => api.get('/system-settings/maintenance'),
  
  // Toggle maintenance mode
  toggleMaintenanceMode: async (enabled: boolean, message?: string) => 
    api.post('/system-settings/maintenance/toggle', { enabled, message }),
};

// Superadmin API
export const superadminAPI = {
  getSystemStats: async () => {
    const response = await api.get('/superadmin/stats');
    return response.data;
  },

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    isApproved?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/superadmin/users', { params });
    return response.data;
  },

  getPendingApprovals: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
  }) => {
    const response = await api.get('/superadmin/approvals', { params });
    return response.data;
  },

  approveUser: async (userId: string, approved: boolean, reason?: string) => {
    const response = await api.post(`/superadmin/approve/${userId}`, {
      approved,
      reason,
    });
    return response.data;
  },

  bulkApproveUsers: async (userIds: string[], approved: boolean, reason?: string) => {
    const response = await api.post('/superadmin/bulk-approve', {
      userIds,
      approved,
      reason,
    });
    return response.data;
  },

  createManager: async (managerData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/superadmin/create-manager', managerData);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/superadmin/users/${userId}`);
    return response.data;
  },

  bulkDeleteUsers: async (userIds: string[]) => {
    const response = await api.post('/superadmin/bulk-delete', {
      userIds,
    });
    return response.data;
  },
};

// Image API functions
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getImageUrl = (imageId: string) => {
  return `${import.meta.env.VITE_API_URL}/images/${imageId}`;
};

export const deleteImage = async (imageId: string) => {
  const response = await api.delete(`/images/${imageId}`);
  return response.data;
};

export const getAllImages = async () => {
  const response = await api.get('/images');
  return response.data;
};

export const cleanupOrphanedImages = async () => {
  const response = await api.post('/images/cleanup');
  return response.data;
};

export const imageAPI = {
  uploadImage,
  getImageUrl,
  deleteImage,
  getAllImages,
  cleanupOrphanedImages,
};

export default api;
