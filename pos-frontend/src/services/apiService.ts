import { productsAPI, transactionsAPI, usersAPI, categoriesAPI } from '@/lib/api';

// React Query keys for consistent caching
export const queryKeys = {
  // Products
  products: ['products'] as const,
  productsList: (filters?: any) => ['products', 'list', filters] as const,
  productById: (id: string) => ['products', id] as const,
  productStats: () => ['products', 'stats'] as const,
  
  // Categories
  categories: ['categories'] as const,
  
  // Transactions
  transactions: ['transactions'] as const,
  transactionsList: (params?: any) => ['transactions', 'list', params] as const,
  transactionById: (id: string) => ['transactions', id] as const,
  
  // Users
  users: ['users'] as const,
  usersList: (params?: any) => ['users', 'list', params] as const,
  userStats: () => ['users', 'stats'] as const,
  userById: (id: string) => ['users', id] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  analyticsDashboard: () => ['analytics', 'dashboard'] as const,
  
  // Notifications
  notifications: ['notifications'] as const,
  pendingCount: () => ['notifications', 'pending-count'] as const,
  pendingUsers: (limit?: number) => ['notifications', 'pending-users', limit] as const,
};

// API service functions with React Query integration
export const apiService = {
  // Products
  products: {
    getAll: (filters?: any) => productsAPI.getProducts(filters),
    getById: (id: string) => productsAPI.getProduct(id),
    create: (productData: any) => productsAPI.createProduct(productData),
    update: (id: string, productData: any) => productsAPI.updateProduct(id, productData),
    delete: (id: string) => productsAPI.deleteProduct(id),
    toggleStatus: (id: string) => productsAPI.toggleProductStatus(id),
  },
  
  // Categories
  categories: {
    getAll: () => categoriesAPI.getCategories(),
    create: (name: string) => categoriesAPI.createCategory({ category: name }),
  },
  
  // Transactions
  transactions: {
    getAll: (params?: any) => transactionsAPI.getTransactions(params),
    getById: (id: string) => transactionsAPI.getTransaction(id),
    create: (transactionData: any) => transactionsAPI.createTransaction(transactionData),
    refund: (id: string, refundData: any) => transactionsAPI.refundTransaction(id, refundData),
  },
  
  // Users
  users: {
    getAll: (params?: any) => usersAPI.getUsers(params),
    getStats: () => usersAPI.getUserStats(),
    getById: (id: string) => usersAPI.getUser(id),
    update: (id: string, userData: any) => usersAPI.updateUser(id, userData),
    toggleStatus: (id: string) => usersAPI.toggleStatus(id),
    resetPassword: (id: string, newPassword: string) => usersAPI.resetPassword(id, newPassword),
  },
  
  // Analytics
  analytics: {
    getDashboard: () => {
      // This would need to be implemented in the API
      return Promise.resolve({ success: true, data: null });
    },
  },
  
  // Notifications
  notifications: {
    getPendingCount: () => {
      // This would need to be implemented in the API
      return Promise.resolve({ success: true, data: 0 });
    },
    getPendingUsers: (limit?: number) => {
      // This would need to be implemented in the API
      return Promise.resolve({ success: true, data: [] });
    },
  },
};
