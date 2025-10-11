import mongoose from 'mongoose';

interface CollectionStats {
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  totalIndexSize: number;
}

interface DatabaseStats {
  [collectionName: string]: {
    collectionStats: CollectionStats;
    indexStats: any[];
  };
}

interface HealthCheckResult {
  status: string;
  collections: {
    [collectionName: string]: {
      indexCount: number;
      documentCount: number;
      totalIndexSize: number;
      avgDocumentSize: number;
    };
  };
  recommendations: string[];
}

export class IndexValidationService {
  /**
   * Get database statistics including collection and index information
   */
  static async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const collections = ['users', 'products', 'transactions'];
      const stats: DatabaseStats = {};

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          // Get collection stats using dbStats
          const dbStats = await db.stats();
          const collectionStats = {
            count: await collection.countDocuments(),
            size: dbStats.dataSize || 0,
            avgObjSize: dbStats.avgObjSize || 0,
            storageSize: dbStats.storageSize || 0,
            totalIndexSize: dbStats.indexSize || 0
          };
          
          // Get index stats
          const indexStats = await collection.indexes();

          stats[collectionName] = {
            collectionStats: {
              count: collectionStats.count || 0,
              size: collectionStats.size || 0,
              avgObjSize: collectionStats.avgObjSize || 0,
              storageSize: collectionStats.storageSize || 0,
              totalIndexSize: collectionStats.totalIndexSize || 0
            },
            indexStats
          };
        } catch (error) {
          console.error(`Error getting stats for ${collectionName}:`, error);
          stats[collectionName] = {
            collectionStats: {
              count: 0,
              size: 0,
              avgObjSize: 0,
              storageSize: 0,
              totalIndexSize: 0
            },
            indexStats: []
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting database statistics:', error);
      throw error;
    }
  }

  /**
   * Perform health check on database indexes
   */
  static async performHealthCheck(): Promise<HealthCheckResult> {
    try {
      const stats = await this.getDatabaseStats();
      const recommendations: string[] = [];
      let overallStatus = 'healthy';

      const collections: any = {};

      for (const [collectionName, collectionData] of Object.entries(stats)) {
        const { collectionStats, indexStats } = collectionData;
        
        collections[collectionName] = {
          indexCount: indexStats.length,
          documentCount: collectionStats.count,
          totalIndexSize: collectionStats.totalIndexSize,
          avgDocumentSize: collectionStats.avgObjSize
        };

        // Check for potential issues
        if (collectionStats.count > 0) {
          const indexToDataRatio = collectionStats.totalIndexSize / collectionStats.size;
          
          if (indexToDataRatio > 0.5) {
            recommendations.push(`${collectionName}: Index size is ${(indexToDataRatio * 100).toFixed(1)}% of data size - consider optimizing indexes`);
            overallStatus = 'warning';
          }

          if (indexStats.length > 10) {
            recommendations.push(`${collectionName}: Has ${indexStats.length} indexes - consider consolidating`);
            overallStatus = 'warning';
          }

          if (collectionStats.avgObjSize > 1024 * 1024) { // 1MB
            recommendations.push(`${collectionName}: Average document size is ${(collectionStats.avgObjSize / 1024).toFixed(1)}KB - consider document optimization`);
            overallStatus = 'warning';
          }
        }
      }

      if (recommendations.length === 0) {
        recommendations.push('Database indexes are optimized and healthy');
      }

      return {
        status: overallStatus,
        collections,
        recommendations
      };
    } catch (error) {
      console.error('Error performing health check:', error);
      return {
        status: 'error',
        collections: {},
        recommendations: [`Health check failed: ${error}`]
      };
    }
  }

  /**
   * Validate index performance
   */
  static async validateIndexPerformance(): Promise<{
    success: boolean;
    results: any[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getDatabaseStats();
      const results: any[] = [];
      const recommendations: string[] = [];

      for (const [collectionName, collectionData] of Object.entries(stats)) {
        const { collectionStats, indexStats } = collectionData;
        
        // Analyze each index
        for (const index of indexStats) {
          const indexAnalysis = {
            collection: collectionName,
            indexName: index.name,
            key: index.key,
            size: index.size || 0,
            usage: index.usage || 0,
            efficiency: 0
          };

          // Calculate efficiency based on usage and size
          if (collectionStats.count > 0) {
            indexAnalysis.efficiency = (index.usage || 0) / collectionStats.count;
          }

          results.push(indexAnalysis);

          // Generate recommendations
          if (indexAnalysis.efficiency < 0.1 && collectionStats.count > 100) {
            recommendations.push(`${collectionName}.${index.name}: Low usage efficiency (${(indexAnalysis.efficiency * 100).toFixed(1)}%) - consider removing`);
          }

          if (index.size > collectionStats.size * 0.3) {
            recommendations.push(`${collectionName}.${index.name}: Large index size - consider optimization`);
          }
        }
      }

      return {
        success: true,
        results,
        recommendations
      };
    } catch (error) {
      console.error('Error validating index performance:', error);
      return {
        success: false,
        results: [],
        recommendations: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Check for missing indexes based on query patterns
   */
  static async checkMissingIndexes(): Promise<{
    success: boolean;
    missingIndexes: any[];
    recommendations: string[];
  }> {
    try {
      const missingIndexes: any[] = [];
      const recommendations: string[] = [];

      // Common query patterns that might need indexes
      const commonPatterns = [
        {
          collection: 'users',
          pattern: { role: 1, status: 1 },
          description: 'Users by role and status'
        },
        {
          collection: 'products',
          pattern: { category: 1, price: 1 },
          description: 'Products by category and price range'
        },
        {
          collection: 'transactions',
          pattern: { createdAt: -1, status: 1 },
          description: 'Recent transactions by status'
        },
        {
          collection: 'transactions',
          pattern: { cashierId: 1, createdAt: -1, status: 1 },
          description: 'Cashier transactions by date and status'
        }
      ];

      const stats = await this.getDatabaseStats();

      for (const pattern of commonPatterns) {
        const collectionStats = stats[pattern.collection];
        if (collectionStats) {
          const hasMatchingIndex = collectionStats.indexStats.some(index => {
            const indexKeys = Object.keys(index.key);
            const patternKeys = Object.keys(pattern.pattern);
            
            return patternKeys.every(key => indexKeys.includes(key));
          });

          if (!hasMatchingIndex) {
            missingIndexes.push(pattern);
            recommendations.push(`Consider adding index for ${pattern.description} in ${pattern.collection}`);
          }
        }
      }

      return {
        success: true,
        missingIndexes,
        recommendations
      };
    } catch (error) {
      console.error('Error checking missing indexes:', error);
      return {
        success: false,
        missingIndexes: [],
        recommendations: [`Check failed: ${error}`]
      };
    }
  }
}
