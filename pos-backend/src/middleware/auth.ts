import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from './auth/AuthenticationService';
import { AuthorizationService } from './auth/AuthorizationService';
import { UserCacheService } from './auth/UserCacheService';

// Main authentication middleware
export const authenticate = AuthenticationService.authenticate;

// Authorization middleware
export const authorize = AuthorizationService.authorize;

// Pre-configured authorization middleware
export const requireManager = AuthorizationService.requireManager;
export const requireAdmin = AuthorizationService.requireAdmin;
export const requireCashier = AuthorizationService.requireCashier;

// Cache management functions
export const invalidateUserCache = UserCacheService.invalidateUserCache;
export const clearUserCache = UserCacheService.clearUserCache;