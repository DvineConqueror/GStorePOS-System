import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/AuthService';
import { LoginService } from '../../services/auth/LoginService';
import { ApiResponse } from '../../types';

export class AuthSessionController {
  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required.',
        } as ApiResponse);
        return;
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token.',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during token refresh.',
      } as ApiResponse);
    }
  }

  /**
   * Logout user (proper session invalidation)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.header('Authorization')?.replace('Bearer ', '');
      const { sessionId } = req.body;

      // If no sessionId provided, try to get it from cookies or just blacklist the token
      if (!sessionId) {
        console.warn('LOGOUT WARNING: No sessionId provided in request body');
        
        // Still blacklist the access token if provided
        if (accessToken) {
          AuthService.blacklistToken(accessToken);
        }
        
        res.json({
          success: true,
          message: 'Logged out successfully (token blacklisted).',
        } as ApiResponse);
        return;
      }

      const success = await LoginService.logoutUser(sessionId);

      if (!success) {
        res.status(400).json({
          success: false,
          message: 'Failed to logout. Session not found.',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Logged out successfully.',
      } as ApiResponse);
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout.',
      } as ApiResponse);
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const count = await AuthService.logoutAllDevices(req.user!._id);

      res.json({
        success: true,
        message: `Logged out from ${count} devices successfully.`,
        data: { sessionsTerminated: count }
      } as ApiResponse);
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout all.',
      } as ApiResponse);
    }
  }

  /**
   * Get active sessions
   */
  static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = AuthService.getUserSessions(req.user!._id);

      res.json({
        success: true,
        message: 'Active sessions retrieved successfully.',
        data: { sessions }
      } as ApiResponse);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving sessions.',
      } as ApiResponse);
    }
  }
}