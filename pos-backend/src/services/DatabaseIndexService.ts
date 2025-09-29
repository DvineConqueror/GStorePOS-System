import mongoose from 'mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';

interface IndexInfo {
  [collectionName: string]: any[];
}

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

interface OptimizationResults {
  [key: string]: string;
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

export class DatabaseIndexService {
  /**
   * Get index information for all collections
   */
  static async getIndexInfo(): Promise<IndexInfo> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      const collections = ['users', 'products', 'transactions'];
      const indexInfo: IndexInfo = {};

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        indexInfo[collectionName] = indexes;
      }

      return indexInfo;
    } catch (error) {
      console.error('Error getting index information:', error);
      throw error;
    }
  }

  /**
   * Analyze index usage statistics
   */
  static async getIndexStats(): Promise<DatabaseStats> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      const collections = ['users', 'products', 'transactions'];
      const stats: DatabaseStats = {};

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        
        // Get collection stats
        const collStats = await db.command({ collStats: collectionName });
        
        // Get index stats
        const indexStats = await collection.aggregate([
          { $indexStats: {} }
        ]).toArray();

        stats[collectionName] = {
          collectionStats: {
            count: collStats.count || 0,
            size: collStats.size || 0,
            avgObjSize: collStats.avgObjSize || 0,
            storageSize: collStats.storageSize || 0,
            totalIndexSize: collStats.totalIndexSize || 0
          },
          indexStats: indexStats
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }

  /**
   * Explain query performance for common queries
   */
  static async explainCommonQueries(): Promise<any> {
    try {
      const explanations: any = {};

      // User queries
      explanations.users = {
        findByCredentials: await User.find({ 
          email: 'test@example.com', 
          status: 'active', 
          isApproved: true 
        }).explain('executionStats'),
        
        findByRole: await User.find({ 
          role: 'cashier', 
          status: 'active' 
        }).explain('executionStats'),
        
        adminUserList: await User.find({ 
          role: { $in: ['manager', 'cashier'] }, 
          status: 'active', 
          isApproved: true 
        }).sort({ createdAt: -1 }).explain('executionStats')
      };

      // Product queries
      explanations.products = {
        productListing: await Product.find({ 
          isActive: true, 
          category: 'Electronics' 
        }).sort({ name: 1 }).explain('executionStats'),
        
        lowStockProducts: await Product.find({
          $expr: { $lte: ['$stock', '$minStock'] },
          isActive: true
        }).explain('executionStats'),
        
        priceRangeFilter: await Product.find({
          isActive: true,
          price: { $gte: 10, $lte: 100 },
          category: 'Electronics'
        }).explain('executionStats'),
        
        searchProducts: await Product.find({
          $text: { $search: 'laptop' },
          isActive: true
        }).explain('executionStats')
      };

      // Transaction queries
      explanations.transactions = {
        recentTransactions: await Transaction.find({ 
          status: 'completed' 
        }).sort({ createdAt: -1 }).limit(50).explain('executionStats'),
        
        cashierSales: await Transaction.find({
          cashierId: 'cashier123',
          status: 'completed',
          createdAt: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          }
        }).explain('executionStats'),
        
        paymentMethodAnalytics: await Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: '$paymentMethod',
              total: { $sum: '$total' },
              count: { $sum: 1 }
            }
          }
        ]).explain('executionStats')
      };

      return explanations;
    } catch (error) {
      console.error('Error explaining queries:', error);
      throw error;
    }
  }

  /**
   * Create missing indexes if they don't exist
   */
  static async ensureIndexes() {
    try {
      console.log('Ensuring database indexes...');
      
      // This will create indexes defined in the schemas
      await User.createIndexes();
      await Product.createIndexes();
      await Transaction.createIndexes();
      
      console.log('All indexes created successfully');
      return true;
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * Optimize database performance
   */
  static async optimizeDatabase(): Promise<OptimizationResults> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      const results: OptimizationResults = {};

      // Reindex collections
      const collections = ['users', 'products', 'transactions'];
      
      for (const collectionName of collections) {
        console.log(`Reindexing ${collectionName}...`);
        await db.command({ reIndex: collectionName });
        results[collectionName] = 'reindexed';
      }

      // Compact collections to reclaim space
      for (const collectionName of collections) {
        try {
          console.log(`Compacting ${collectionName}...`);
          await db.command({ compact: collectionName });
          results[`${collectionName}_compact`] = 'completed';
        } catch (error) {
          // Compact may not be available in all MongoDB deployments
          console.log(`Compact not available for ${collectionName}`);
          results[`${collectionName}_compact`] = 'not_available';
        }
      }

      return results;
    } catch (error) {
      console.error('Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Get slow query analysis
   */
  static async getSlowQueries(): Promise<any[]> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      // Enable profiling for slow queries (>100ms)
      await db.command({ profile: 2, slowms: 100 });
      
      // Get profiling data
      const profilingData = await db.collection('system.profile')
        .find({})
        .sort({ ts: -1 })
        .limit(50)
        .toArray();

      // Disable profiling to avoid performance impact
      await db.command({ profile: 0 });

      return profilingData;
    } catch (error) {
      console.error('Error getting slow queries:', error);
      throw error;
    }
  }

  /**
   * Health check for database indexes
   */
  static async healthCheck(): Promise<HealthCheckResult | { status: string; error: string }> {
    try {
      const indexInfo = await this.getIndexInfo();
      const stats = await this.getIndexStats();
      
      const health: HealthCheckResult = {
        status: 'healthy',
        collections: {},
        recommendations: []
      };

      // Analyze each collection
      for (const [collectionName, indexes] of Object.entries(indexInfo)) {
        const collectionStats = stats[collectionName];
        
        health.collections[collectionName] = {
          indexCount: Array.isArray(indexes) ? indexes.length : 0,
          documentCount: collectionStats?.collectionStats?.count || 0,
          totalIndexSize: collectionStats?.collectionStats?.totalIndexSize || 0,
          avgDocumentSize: collectionStats?.collectionStats?.avgObjSize || 0
        };

        // Recommendations based on collection size and index usage
        if (collectionStats?.collectionStats?.count > 10000 && Array.isArray(indexes) && indexes.length < 5) {
          health.recommendations.push(`Consider adding more indexes to ${collectionName} for better query performance`);
        }

        if (collectionStats?.collectionStats?.totalIndexSize > collectionStats?.collectionStats?.storageSize) {
          health.recommendations.push(`Index size is larger than data size in ${collectionName}. Consider reviewing index usage.`);
        }
      }

      return health;
    } catch (error) {
      console.error('Error in database health check:', error);
      const err = error as Error;
      return {
        status: 'error',
        error: err.message
      };
    }
  }
}