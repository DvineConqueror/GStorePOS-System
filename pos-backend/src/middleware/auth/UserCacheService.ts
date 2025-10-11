import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { IUser } from '../../types';

// Simple in-memory cache for user data (expires after 5 minutes)
const userCache = new Map<string, { user: IUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class UserCacheService {
  /**
   * Get cached user data
   */
  static getCachedUser(userId: string): IUser | null {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.user;
    }
    if (cached) {
      userCache.delete(userId); // Remove expired cache
    }
    return null;
  }

  /**
   * Set cached user data
   */
  static setCachedUser(userId: string, user: IUser): void {
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
  }

  /**
   * Invalidate user cache
   */
  static invalidateUserCache(userId: string): void {
    userCache.delete(userId);
  }

  /**
   * Clear all user cache
   */
  static clearUserCache(): void {
    userCache.clear();
  }
}
