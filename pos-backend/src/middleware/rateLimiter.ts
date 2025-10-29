import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

console.log('RATE LIMITER MODULE: Loaded with NODE_ENV =', process.env.NODE_ENV);

// Rate limiting for authentication endpoints
const authRateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('RATE LIMITER: Bypassing auth rate limit in development mode');
    return next();
  }
  return authRateLimitConfig(req, res, next);
};

// Rate limiting specifically for password reset (more lenient)
const passwordResetRateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Allow 3 password reset attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many password reset attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('RATE LIMITER: Bypassing password reset rate limit in development mode');
    return next();
  }
  return passwordResetRateLimitConfig(req, res, next);
};

// Rate limiting for refresh token endpoint
const refreshRateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 refresh requests per windowMs
  message: {
    success: false,
    message: 'Too many token refresh attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('RATE LIMITER: Bypassing refresh rate limit in development mode');
    return next();
  }
  return refreshRateLimitConfig(req, res, next);
};

// Rate limiting for general API endpoints
const generalRateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('RATE LIMITER: Bypassing general rate limit in development mode');
    return next();
  }
  return generalRateLimitConfig(req, res, next);
};
