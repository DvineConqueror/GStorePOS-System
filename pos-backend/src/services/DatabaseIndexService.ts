import { IndexCreationService } from './database/IndexCreationService';
import { IndexValidationService } from './database/IndexValidationService';
import { IndexMaintenanceService } from './database/IndexMaintenanceService';

// Force TypeScript refresh

export class DatabaseIndexService {
  /**
   * Get index information for all collections
   */
  static async getIndexInfo() {
    return IndexCreationService.getIndexInfo();
  }

  /**
   * Create essential indexes for optimal performance
   */
  static async createEssentialIndexes() {
    return IndexCreationService.createEssentialIndexes();
  }

  /**
   * Create text search indexes for better search performance
   */
  static async createTextSearchIndexes() {
    return IndexCreationService.createTextSearchIndexes();
  }

  /**
   * Get database statistics including collection and index information
   */
  static async getDatabaseStats() {
    return IndexValidationService.getDatabaseStats();
  }

  /**
   * Perform health check on database indexes
   */
  static async performHealthCheck() {
    return IndexValidationService.performHealthCheck();
  }

  /**
   * Validate index performance
   */
  static async validateIndexPerformance() {
    return IndexValidationService.validateIndexPerformance();
  }

  /**
   * Check for missing indexes based on query patterns
   */
  static async checkMissingIndexes() {
    return IndexValidationService.checkMissingIndexes();
  }

  /**
   * Optimize database indexes
   */
  static async optimizeIndexes() {
    return IndexMaintenanceService.optimizeIndexes();
  }

  /**
   * Clean up unused indexes
   */
  static async cleanupUnusedIndexes() {
    return IndexMaintenanceService.cleanupUnusedIndexes();
  }

  /**
   * Monitor index performance
   */
  static async monitorIndexPerformance() {
    return IndexMaintenanceService.monitorIndexPerformance();
  }

  /**
   * Get index usage statistics
   */
  static async getIndexUsageStats() {
    return IndexMaintenanceService.getIndexUsageStats();
  }

  /**
   * Schedule index maintenance
   */
  static scheduleMaintenance() {
    return IndexMaintenanceService.scheduleMaintenance();
  }
}
