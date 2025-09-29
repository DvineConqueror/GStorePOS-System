import { authAPI } from '@/lib/api';

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  isApproved: boolean;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    session: {
      sessionId: string;
      deviceInfo: any;
      createdAt: string;
    };
  };
}

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials) {
    const response = await authAPI.login(credentials.emailOrUsername, credentials.password);
    return response;
  }

  /**
   * Register cashier
   */
  static async registerCashier(userData: RegisterData) {
    const response = await authAPI.registerCashier(userData);
    return response;
  }

  /**
   * Register user (for managers/superadmins)
   */
  static async register(userData: RegisterData & { role: string }) {
    const response = await authAPI.register(userData);
    return response;
  }

  /**
   * Setup initial manager account
   */
  static async setup(userData: RegisterData) {
    const response = await authAPI.setup(userData);
    return response;
  }

  /**
   * Get current user profile
   */
  static async getProfile() {
    const response = await authAPI.getProfile();
    return response;
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    const response = await authAPI.updateProfile(profileData);
    return response;
  }

  /**
   * Change password
   */
  static async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    const response = await authAPI.changePassword(passwordData);
    return response;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    const response = await authAPI.refreshToken(refreshToken);
    return response;
  }

  /**
   * Logout user
   */
  static async logout(sessionId: string) {
    const response = await authAPI.logout(sessionId);
    return response;
  }

  /**
   * Logout from all devices
   */
  static async logoutAll() {
    const response = await authAPI.logoutAll();
    return response;
  }

  /**
   * Get active sessions
   */
  static async getSessions() {
    const response = await authAPI.getSessions();
    return response;
  }
}
