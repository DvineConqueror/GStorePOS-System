import { userAPI } from '@/lib/api';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class UserService {
  /**
   * Get all users with filters
   */
  static async getUsers(filters: UserFilters = {}) {
    const response = await userAPI.getAll(filters);
    return response;
  }

  /**
   * Get single user by ID
   */
  static async getUser(id: string) {
    const response = await userAPI.getById(id);
    return response;
  }

  /**
   * Update user
   */
  static async updateUser(id: string, userData: Partial<User>) {
    const response = await userAPI.update(id, userData);
    return response;
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  static async toggleUserStatus(id: string) {
    const response = await userAPI.toggleStatus(id);
    return response;
  }

  /**
   * Reset user password
   */
  static async resetPassword(id: string) {
    const response = await userAPI.resetPassword(id);
    return response;
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const response = await userAPI.getStats();
    return response;
  }
}
