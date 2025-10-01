import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';
import { IUser, JWTPayload } from '../types';

// Simple in-memory cache for user data (expires after 5 minutes)
const userCache = new Map<string, { user: IUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId: string): IUser | null => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.user;
  }
  if (cached) {
    userCache.delete(userId); // Remove expired cache
  }
  return null;
};

const setCachedUser = (userId: string, user: IUser): void => {
  userCache.set(userId, { user, timestamp: Date.now() });
  
  // Clean up cache periodically (prevent memory leaks)
  if (userCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        userCache.delete(key);
      }
    }
  }
};

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    let user = getCachedUser(decoded.userId);
    
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
      setCachedUser(decoded.userId, user);
    }

    if (user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
      return;
    }

    // Check if user is approved (handle legacy users without isApproved field)
    if (user.isApproved === false) {
      res.status(401).json({
        success: false,
        message: 'Account is not approved. Please wait for approval.',
      });
      return;
    }

    // Update session activity
    AuthService.updateSessionActivity(decoded.sessionId);

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

export const requireManager = authorize('manager', 'superadmin');
export const requireAdmin = authorize('manager', 'superadmin'); // Keep for backward compatibility
export const requireCashier = authorize('cashier', 'manager', 'superadmin');

// Export cache management functions for manual cache invalidation
export const invalidateUserCache = (userId: string): void => {
  userCache.delete(userId);
};

export const clearUserCache = (): void => {
  userCache.clear();
};
