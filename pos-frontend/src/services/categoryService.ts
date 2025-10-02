import api from '@/lib/api';

export interface Category {
  _id: string;
  name: string;
  group: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  group: string;
  description?: string;
}

export const categoryAPI = {
  /**
   * Get all categories
   */
  getAll: async (includeInactive: boolean = false): Promise<Category[]> => {
    const response = await api.get('/categories', {
      params: { includeInactive }
    });
    return response.data.data;
  },

  /**
   * Get grouped categories
   */
  getGrouped: async (): Promise<Record<string, Category[]>> => {
    const response = await api.get('/categories/grouped');
    return response.data.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  /**
   * Create new category
   */
  create: async (data: CategoryInput): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data.data;
  },

  /**
   * Update category
   */
  update: async (id: string, data: Partial<CategoryInput & { isActive: boolean }>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete category
   */
  delete: async (id: string): Promise<Category> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data.data;
  },

  /**
   * Initialize default categories
   */
  initialize: async (): Promise<void> => {
    await api.post('/categories/initialize', {});
  }
};

