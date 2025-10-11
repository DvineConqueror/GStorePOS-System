import mongoose from 'mongoose';

interface OptimizationResults {
  [key: string]: string;
}

export class IndexMaintenanceService {
  /**
   * Optimize database indexes
   */
  static async optimizeIndexes(): Promise<OptimizationResults> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const results: OptimizationResults = {};
      const collections = ['users', 'products', 'transactions'];

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          // Rebuild indexes
          await collection.reIndex();
          results[collectionName] = 'Indexes rebuilt successfully';
          
          console.log(`Optimized indexes for ${collectionName}`);
        } catch (error) {
          results[collectionName] = `Failed to optimize: ${error}`;
          console.error(`Error optimizing ${collectionName}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error optimizing indexes:', error);
      return { error: `Optimization failed: ${error}` };
    }
  }

  /**
   * Clean up unused indexes
   */
  static async cleanupUnusedIndexes(): Promise<{
    success: boolean;
    removedIndexes: string[];
    message: string;
  }> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const removedIndexes: string[] = [];
      const collections = ['users', 'products', 'transactions'];

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          const indexes = await collection.indexes();
          
          for (const index of indexes) {
            // Skip default _id index
            if (index.name === '_id_') continue;
            
            // Check if index is unused (this is a simplified check)
            // In production, you'd want to use MongoDB's index usage statistics
            const indexUsage = await collection.aggregate([
              { $indexStats: {} }
            ]).toArray();
            
            const usage = indexUsage.find(stat => stat.name === index.name);
            
            if (usage && usage.accesses && usage.accesses.ops === 0) {
              try {
                await collection.dropIndex(index.name);
                removedIndexes.push(`${collectionName}.${index.name}`);
                console.log(`Removed unused index: ${collectionName}.${index.name}`);
              } catch (dropError) {
                console.log(`Could not drop index ${index.name}: ${dropError}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error cleaning up indexes for ${collectionName}:`, error);
        }
      }

      return {
        success: true,
        removedIndexes,
        message: `Cleaned up ${removedIndexes.length} unused indexes`
      };
    } catch (error) {
      console.error('Error cleaning up unused indexes:', error);
      return {
        success: false,
        removedIndexes: [],
        message: `Cleanup failed: ${error}`
      };
    }
  }

  /**
   * Monitor index performance
   */
  static async monitorIndexPerformance(): Promise<{
    success: boolean;
    performance: any[];
    summary: any;
  }> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const performance: any[] = [];
      const collections = ['users', 'products', 'transactions'];
      let totalIndexes = 0;
      let totalSize = 0;

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          // Get index statistics
          const indexStats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          for (const stat of indexStats) {
            const indexInfo = {
              collection: collectionName,
              name: stat.name,
              accesses: stat.accesses || { ops: 0 },
              since: stat.since,
              size: stat.size || 0
            };

            performance.push(indexInfo);
            totalIndexes++;
            totalSize += indexInfo.size;
          }
        } catch (error) {
          console.error(`Error monitoring ${collectionName}:`, error);
        }
      }

      const summary = {
        totalIndexes,
        totalSize,
        averageSize: totalIndexes > 0 ? totalSize / totalIndexes : 0,
        collections: collections.length
      };

      return {
        success: true,
        performance,
        summary
      };
    } catch (error) {
      console.error('Error monitoring index performance:', error);
      return {
        success: false,
        performance: [],
        summary: {}
      };
    }
  }

  /**
   * Get index usage statistics
   */
  static async getIndexUsageStats(): Promise<{
    success: boolean;
    usage: any[];
    recommendations: string[];
  }> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const usage: any[] = [];
      const recommendations: string[] = [];
      const collections = ['users', 'products', 'transactions'];

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          const indexStats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          for (const stat of indexStats) {
            const usageInfo = {
              collection: collectionName,
              indexName: stat.name,
              operations: stat.accesses?.ops || 0,
              since: stat.since,
              size: stat.size || 0,
              efficiency: 0
            };

            // Calculate efficiency (simplified)
            if (usageInfo.operations > 0) {
              usageInfo.efficiency = usageInfo.operations / (Date.now() - new Date(usageInfo.since).getTime()) * 1000;
            }

            usage.push(usageInfo);

            // Generate recommendations
            if (usageInfo.operations === 0 && usageInfo.size > 1024 * 1024) { // 1MB
              recommendations.push(`${collectionName}.${stat.name}: Unused large index (${(usageInfo.size / 1024).toFixed(1)}KB) - consider removing`);
            }

            if (usageInfo.efficiency < 0.01 && usageInfo.operations > 100) {
              recommendations.push(`${collectionName}.${stat.name}: Low efficiency index - review usage patterns`);
            }
          }
        } catch (error) {
          console.error(`Error getting usage stats for ${collectionName}:`, error);
        }
      }

      return {
        success: true,
        usage,
        recommendations
      };
    } catch (error) {
      console.error('Error getting index usage statistics:', error);
      return {
        success: false,
        usage: [],
        recommendations: [`Failed to get usage stats: ${error}`]
      };
    }
  }

  /**
   * Schedule index maintenance
   */
  static scheduleMaintenance(): void {
    // Schedule regular index maintenance
    setInterval(async () => {
      try {
        console.log('Running scheduled index maintenance...');
        
        const healthCheck = await this.monitorIndexPerformance();
        if (healthCheck.success) {
          console.log('Index maintenance completed successfully');
        } else {
          console.error('Index maintenance failed');
        }
      } catch (error) {
        console.error('Scheduled index maintenance error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily

    console.log('Index maintenance scheduled to run daily');
  }
}
