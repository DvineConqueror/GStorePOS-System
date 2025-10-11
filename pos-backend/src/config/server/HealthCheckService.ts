import express from 'express';
import mongoose from 'mongoose';

export class HealthCheckService {
  /**
   * Configure health check endpoint
   */
  static configureHealthCheck(app: express.Application): void {
    app.get('/health', async (req, res) => {
      const memUsage = process.memoryUsage();
      const { requestCount } = require('../../middleware/metrics').getRequestMetrics();
      
      // Get cache health
      let cacheHealth = { status: 'unknown', type: 'unknown' };
      try {
        const { getCacheHealth } = require('../cache');
        cacheHealth = await getCacheHealth();
      } catch (error) {
        cacheHealth = { status: 'error', type: 'unknown' };
      }
      
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
        },
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          host: mongoose.connection.host || 'unknown',
          name: mongoose.connection.name || 'unknown',
        },
        cache: cacheHealth,
        requests: {
          currentMinute: requestCount
        }
      });
    });
  }

  /**
   * Start periodic health monitoring
   */
  static startHealthMonitoring(): NodeJS.Timeout {
    return setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (heapUsedMB > 500) { // Alert if memory usage exceeds 500MB
        console.warn(`High memory usage: ${heapUsedMB} MB`);
      }
      
      // Log periodic health status (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Health Check - Memory: ${heapUsedMB}MB, Uptime: ${Math.round(process.uptime())}s, DB: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}
