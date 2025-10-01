import { Request, Response, NextFunction } from 'express';

// Simple request metrics
let requestCount = 0;
let lastResetTime = Date.now();
const RESET_INTERVAL = 60 * 1000; // Reset every minute

export const requestMetrics = (req: Request, res: Response, next: NextFunction): void => {
  requestCount++;
  
  // Reset counter every minute
  const now = Date.now();
  if (now - lastResetTime > RESET_INTERVAL) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  next();
};

export const getRequestMetrics = () => ({
  requestCount,
  lastResetTime,
});