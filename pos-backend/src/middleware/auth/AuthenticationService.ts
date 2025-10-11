import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { SessionService } from '../../services/auth/SessionService';
import { UserCacheService } from './UserCacheService';
import { IUser } from '../../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export class AuthenticationService {
  /**
   * Authenticate user middleware
   */
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
        });
        return;
      }

      // Verify token using AuthService
      const decoded = AuthService.verifyAccessToken(token);
      
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
        });
        return;
      }

      // Try to get user from cache first
      let user = UserCacheService.getCachedUser(decoded.userId);
      
      if (!user) {
        // If not in cache, fetch from database
        user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          res.status(401).json({
            success: false,
            message: 'Invalid token. User not found.',
          });
          return;
        }
        
        // Cache the user for future requests
        UserCacheService.setCachedUser(decoded.userId, user);
      }

      // Validate user status
      if (!AuthenticationService.validateUserStatus(user, res)) {
        return;
      }

      // Update session activity
      SessionService.updateSessionActivity(decoded.sessionId);

      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication.',
      });
    }
  }

  /**
   * Validate user status
   */
  private static validateUserStatus(user: IUser, res: Response): boolean {
    if (user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
      return false;
    }

    // Check if user is approved (handle legacy users without isApproved field)
    if (user.isApproved === false) {
      res.status(401).json({
        success: false,
        message: 'Account is not approved. Please wait for approval.',
      });
      return false;
    }

    return true;
  }
}
