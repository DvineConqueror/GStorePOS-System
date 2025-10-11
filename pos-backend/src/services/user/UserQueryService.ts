import { User } from '../../models/User';
import { IUser } from '../../types';

export class UserQueryService {
  /**
   * Get all users for superadmin (includes all roles except superadmin)
   */
  static async getAllUsersForSuperadmin(filters: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    isApproved?: string;
    search?: string;
    sort: string;
    order: 'asc' | 'desc';
  }) {
    const queryFilters: any = {
      role: { $ne: 'superadmin' } // Exclude superadmin from all users list
    };

    if (filters.role && filters.role !== 'all') {
      queryFilters.role = filters.role;
    }
    if (filters.status && filters.status !== 'all') {
      queryFilters.status = filters.status;
    }
    if (filters.isApproved !== undefined) {
      queryFilters.isApproved = filters.isApproved === 'true';
    }
    if (filters.search) {
      queryFilters.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const sortOrder = filters.order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[filters.sort] = sortOrder;

    const skip = (filters.page - 1) * filters.limit;

    const users = await User.find(queryFilters)
      .populate('createdBy', 'username firstName lastName')
      .populate('approvedBy', 'username firstName lastName')
      .sort(sortObj)
      .skip(skip)
      .limit(filters.limit);

    const total = await User.countDocuments(queryFilters);

    return {
      users,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * Get all users with filtering and pagination
   */
  static async getUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = filters;

    const query: any = {
      role: { $in: ['cashier', 'manager'] } // Return both cashiers and managers, exclude superadmins
    };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort] = sortOrder;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single user by ID
   */
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string, includeInactive: boolean = false) {
    const query: any = { role };
    
    if (!includeInactive) {
      query.status = 'active';
    }

    return await User.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(filters: {
    role?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const {
      role,
      page = 1,
      limit = 20
    } = filters;

    const query: any = { isApproved: false };

    if (role && role !== 'all') {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }
}
