import { Request, Response } from 'express';
import { DatabaseIndexService } from '../services/DatabaseIndexService';
import { ApiResponse } from '../types';

export class DatabaseController {
  /**
   * Get database index information
   */
  static async getIndexInfo(req: Request, res: Response): Promise<void> {
    try {
      const indexInfo = await DatabaseIndexService.getIndexInfo();
      
      res.json({
        success: true,
        data: indexInfo
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting index info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get index information'
      } as ApiResponse);
    }
  }

  /**
   * Get database statistics and index usage
   */
  static async getIndexStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await DatabaseIndexService.getDatabaseStats();
      
      res.json({
        success: true,
        data: stats
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting database stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get database statistics'
      } as ApiResponse);
    }
  }

  /**
   * Get query execution plans for common queries
   */
  static async explainCommonQueries(req: Request, res: Response): Promise<void> {
    try {
      const explanations = await DatabaseIndexService.checkMissingIndexes();
      
      res.json({
        success: true,
        data: explanations
      } as ApiResponse);
    } catch (error) {
      console.error('Error explaining queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to explain queries'
      } as ApiResponse);
    }
  }

  /**
   * Ensure all indexes are created
   */
  static async ensureIndexes(req: Request, res: Response): Promise<void> {
    try {
      await DatabaseIndexService.createEssentialIndexes();
      
      res.json({
        success: true,
        message: 'All indexes ensured successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error ensuring indexes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ensure indexes'
      } as ApiResponse);
    }
  }

  /**
   * Optimize database performance
   */
  static async optimizeDatabase(req: Request, res: Response): Promise<void> {
    try {
      const results = await DatabaseIndexService.optimizeIndexes();
      
      res.json({
        success: true,
        message: 'Database optimization completed',
        data: results
      } as ApiResponse);
    } catch (error) {
      console.error('Error optimizing database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize database'
      } as ApiResponse);
    }
  }

  /**
   * Get slow query analysis
   */
  static async getSlowQueries(req: Request, res: Response): Promise<void> {
    try {
      const slowQueries = await DatabaseIndexService.validateIndexPerformance();
      
      res.json({
        success: true,
        data: slowQueries
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting slow queries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get slow query analysis'
      } as ApiResponse);
    }
  }

  /**
   * Get database health check
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await DatabaseIndexService.performHealthCheck();
      
      res.json({
        success: true,
        data: health
      } as ApiResponse);
    } catch (error) {
      console.error('Error in database health check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform health check'
      } as ApiResponse);
    }
  }

  /**
   * Create database indexes
   */
  static async createIndexes(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseIndexService.createEssentialIndexes();
      
      res.json({
        success: true,
        message: 'Database indexes created successfully',
        data: result
      } as ApiResponse);
    } catch (error) {
      console.error('Error creating indexes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create database indexes'
      } as ApiResponse);
    }
  }

  /**
   * Validate database indexes
   */
  static async validateIndexes(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseIndexService.validateIndexPerformance();
      
      res.json({
        success: true,
        message: 'Database indexes validated successfully',
        data: result
      } as ApiResponse);
    } catch (error) {
      console.error('Error validating indexes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate database indexes'
      } as ApiResponse);
    }
  }

  /**
   * Maintain database indexes
   */
  static async maintainIndexes(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseIndexService.cleanupUnusedIndexes();
      
      res.json({
        success: true,
        message: 'Database indexes maintained successfully',
        data: result
      } as ApiResponse);
    } catch (error) {
      console.error('Error maintaining indexes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to maintain database indexes'
      } as ApiResponse);
    }
  }
}
