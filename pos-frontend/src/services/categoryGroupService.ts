import api from '@/lib/api';

export interface CategoryGroup {
  _id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryGroupInput {
  name: string;
  description?: string;
  order?: number;
}

export const categoryGroupAPI = {
  /**
   * Get all category groups
   */
  getAll: async (includeInactive: boolean = false): Promise<CategoryGroup[]> => {
    const response = await api.get('/category-groups', {
      params: { includeInactive }
    });
    return response.data.data;
  },

  /**
   * Get category group by ID
   */
  getById: async (id: string): Promise<CategoryGroup> => {
    const response = await api.get(`/category-groups/${id}`);
    return response.data.data;
  },

  /**
   * Create new category group
   */
  create: async (data: CategoryGroupInput): Promise<CategoryGroup> => {
    const response = await api.post('/category-groups', data);
    return response.data.data;
  },

  /**
   * Update category group
   */
  update: async (id: string, data: Partial<CategoryGroupInput & { isActive: boolean }>): Promise<CategoryGroup> => {
    const response = await api.put(`/category-groups/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete category group
   */
  delete: async (id: string): Promise<CategoryGroup> => {
    const response = await api.delete(`/category-groups/${id}`);
    return response.data.data;
  },

  /**
   * Initialize default category groups
   */
  initialize: async (): Promise<void> => {
    await api.post('/category-groups/initialize', {});
  }
};

