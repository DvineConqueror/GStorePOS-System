import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AnalyticsCacheService } from '../services/AnalyticsCacheService';
import { ApiResponse } from '../types';

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

      res.json({
        success: true,
        message: 'Dashboard analytics retrieved successfully.',
        data: responseData
      } as ApiResponse);
    } catch (error) {
      console.error('Get dashboard analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving dashboard analytics.',
      } as ApiResponse);
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

      res.json({
        success: true,
        message: 'Sales analytics retrieved successfully.',
        data: analyticsData
      } as ApiResponse);
    } catch (error) {
      console.error('Get sales analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving sales analytics.',
      } as ApiResponse);
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

      res.json({
        success: true,
        message: 'Product analytics retrieved successfully.',
        data: analyticsData
      } as ApiResponse);
    } catch (error) {
      console.error('Get product analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving product analytics.',
      } as ApiResponse);
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
        res.status(400).json({
          success: false,
          message: 'Cashier ID is required for cashier analytics.',
        } as ApiResponse);
        return;
      }

      const analyticsData = await AnalyticsService.getCashierAnalytics({
        startDate: start,
        endDate: end,
        cashierId: cashierId as string
      });

      res.json({
        success: true,
        message: 'Cashier analytics retrieved successfully.',
        data: analyticsData
      } as ApiResponse);
    } catch (error) {
      console.error('Get cashier analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving cashier analytics.',
      } as ApiResponse);
    }
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analyticsData = await AnalyticsService.getInventoryAnalytics();

      res.json({
        success: true,
        message: 'Inventory analytics retrieved successfully.',
        data: analyticsData
      } as ApiResponse);
    } catch (error) {
      console.error('Get inventory analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving inventory analytics.',
      } as ApiResponse);
    }
  }
}
