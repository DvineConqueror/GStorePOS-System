import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AnalyticsCacheService } from '../services/AnalyticsCacheService';
import { SalesTrendService } from '../services/analytics/SalesTrendService';
import { ApiResponse } from '../types';
import { ErrorResponse } from '../utils/errorResponse';

export class AnalyticsController {
  /**
   * Get dashboard analytics
   */
  static async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30' } = req.query; // days
      const cacheKey = `dashboard:${period}d`;
      
      // Try to get cached data first
      let cachedData = AnalyticsCacheService.getCachedAnalytics(cacheKey);
      
      if (cachedData) {
        res.json({
          success: true,
          message: 'Dashboard analytics retrieved successfully (cached).',
          data: {
            ...cachedData,
            cached: true,
            lastUpdated: new Date().toISOString()
          }
        } as ApiResponse);
        return;
      }

      // If no cached data, calculate using AnalyticsService
      const analyticsData = await AnalyticsService.getDashboardAnalytics(parseInt(period as string));

      const responseData = {
        ...analyticsData,
        cached: false,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result for future requests
      AnalyticsCacheService.setCachedAnalytics(cacheKey, responseData);

      ErrorResponse.success(res, 'Dashboard analytics retrieved successfully.', responseData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving dashboard analytics.');
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate, 
        endDate, 
        groupBy = 'day' // day, week, month
      } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analyticsData = await AnalyticsService.getSalesAnalytics({
        startDate: start,
        endDate: end,
        groupBy: groupBy as 'day' | 'week' | 'month'
      });

      ErrorResponse.success(res, 'Sales analytics retrieved successfully.', analyticsData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving sales analytics.');
    }
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate, 
        endDate, 
        limit = 20 
      } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analyticsData = await AnalyticsService.getProductAnalytics({
        startDate: start,
        endDate: end,
        limit: parseInt(limit as string)
      });

      ErrorResponse.success(res, 'Product analytics retrieved successfully.', analyticsData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving product analytics.');
    }
  }

  /**
   * Get cashier performance analytics
   */
  static async getCashierAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate, 
        endDate,
        cashierId
      } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      if (!cashierId) {
        ErrorResponse.validationError(res, 'Cashier ID is required for cashier analytics.');
        return;
      }

      const analyticsData = await AnalyticsService.getCashierAnalytics({
        startDate: start,
        endDate: end,
        cashierId: cashierId as string
      });

      ErrorResponse.success(res, 'Cashier analytics retrieved successfully.', analyticsData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving cashier analytics.');
    }
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analyticsData = await AnalyticsService.getInventoryAnalytics();

      ErrorResponse.success(res, 'Inventory analytics retrieved successfully.', analyticsData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving inventory analytics.');
    }
  }

  /**
   * Get sales trends (weekly, monthly, annual)
   */
  static async getSalesTrends(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'weekly', cashierId } = req.query;

      // Validate period
      if (!['weekly', 'monthly', 'annual'].includes(period as string)) {
        ErrorResponse.validationError(res, 'Invalid period. Must be weekly, monthly, or annual.');
        return;
      }

      // Get trends based on user role and cashierId
      let trendsData;
      if (cashierId) {
        trendsData = await SalesTrendService.getCashierSalesTrends(
          cashierId as string,
          period as 'weekly' | 'monthly' | 'annual'
        );
      } else {
        trendsData = await SalesTrendService.getManagerSalesTrends(
          period as 'weekly' | 'monthly' | 'annual'
        );
      }

      ErrorResponse.success(res, 'Sales trends retrieved successfully.', trendsData);
    } catch (error) {
      ErrorResponse.send(res, error, 'Server error while retrieving sales trends.');
    }
  }
}
