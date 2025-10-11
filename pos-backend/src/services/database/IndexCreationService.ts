import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Transaction } from '../../models/Transaction';

interface IndexInfo {
  [collectionName: string]: any[];
}

export class IndexCreationService {
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
        try {
          const collection = db.collection(collectionName);
          const indexes = await collection.indexes();
          indexInfo[collectionName] = indexes;
        } catch (error) {
          console.error(`Error getting indexes for ${collectionName}:`, error);
          indexInfo[collectionName] = [];
        }
      }

      return indexInfo;
    } catch (error) {
      console.error('Error getting index information:', error);
      throw error;
    }
  }

  /**
   * Create essential indexes for optimal performance
   */
  static async createEssentialIndexes(): Promise<{ success: boolean; message: string; createdIndexes: string[] }> {
    try {
      const createdIndexes: string[] = [];

      // User indexes
      try {
        await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
        createdIndexes.push('users.email');
      } catch (error) {
        console.log('Email index may already exist:', error);
      }

      try {
        await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
        createdIndexes.push('users.username');
      } catch (error) {
        console.log('Username index may already exist:', error);
      }

      await User.collection.createIndex({ role: 1 });
      createdIndexes.push('users.role');

      await User.collection.createIndex({ status: 1 });
      createdIndexes.push('users.status');

      await User.collection.createIndex({ isApproved: 1 });
      createdIndexes.push('users.isApproved');

      await User.collection.createIndex({ createdAt: -1 });
      createdIndexes.push('users.createdAt');

      // Product indexes
      try {
        await Product.collection.createIndex({ sku: 1 }, { unique: true, sparse: true });
        createdIndexes.push('products.sku');
      } catch (error) {
        console.log('SKU index may already exist:', error);
      }

      try {
        await Product.collection.createIndex({ barcode: 1 }, { unique: true, sparse: true });
        createdIndexes.push('products.barcode');
      } catch (error) {
        console.log('Barcode index may already exist:', error);
      }

      await Product.collection.createIndex({ name: 1 });
      createdIndexes.push('products.name');

      await Product.collection.createIndex({ category: 1 });
      createdIndexes.push('products.category');

      await Product.collection.createIndex({ brand: 1 });
      createdIndexes.push('products.brand');

      await Product.collection.createIndex({ price: 1 });
      createdIndexes.push('products.price');

      await Product.collection.createIndex({ stock: 1 });
      createdIndexes.push('products.stock');

      await Product.collection.createIndex({ isActive: 1 });
      createdIndexes.push('products.isActive');

      await Product.collection.createIndex({ createdAt: -1 });
      createdIndexes.push('products.createdAt');

      // Transaction indexes
      try {
        await Transaction.collection.createIndex({ transactionNumber: 1 }, { unique: true });
        createdIndexes.push('transactions.transactionNumber');
      } catch (error) {
        console.log('Transaction number index may already exist:', error);
      }

      await Transaction.collection.createIndex({ cashierId: 1 });
      createdIndexes.push('transactions.cashierId');

      await Transaction.collection.createIndex({ status: 1 });
      createdIndexes.push('transactions.status');

      await Transaction.collection.createIndex({ paymentMethod: 1 });
      createdIndexes.push('transactions.paymentMethod');

      await Transaction.collection.createIndex({ total: 1 });
      createdIndexes.push('transactions.total');

      await Transaction.collection.createIndex({ createdAt: -1 });
      createdIndexes.push('transactions.createdAt');

      // Compound indexes for common queries
      await Transaction.collection.createIndex({ cashierId: 1, createdAt: -1 });
      createdIndexes.push('transactions.cashierId_createdAt');

      await Transaction.collection.createIndex({ status: 1, createdAt: -1 });
      createdIndexes.push('transactions.status_createdAt');

      await Product.collection.createIndex({ category: 1, isActive: 1 });
      createdIndexes.push('products.category_isActive');

      await Product.collection.createIndex({ stock: 1, isActive: 1 });
      createdIndexes.push('products.stock_isActive');

      return {
        success: true,
        message: `Successfully created ${createdIndexes.length} indexes`,
        createdIndexes
      };
    } catch (error) {
      console.error('Error creating essential indexes:', error);
      return {
        success: false,
        message: `Failed to create indexes: ${error}`,
        createdIndexes: []
      };
    }
  }

  /**
   * Create text search indexes for better search performance
   */
  static async createTextSearchIndexes(): Promise<{ success: boolean; message: string; createdIndexes: string[] }> {
    try {
      const createdIndexes: string[] = [];

      // Text search indexes
      await User.collection.createIndex({
        firstName: 'text',
        lastName: 'text',
        username: 'text',
        email: 'text'
      });
      createdIndexes.push('users.text_search');

      await Product.collection.createIndex({
        name: 'text',
        description: 'text',
        category: 'text',
        brand: 'text'
      });
      createdIndexes.push('products.text_search');

      return {
        success: true,
        message: `Successfully created ${createdIndexes.length} text search indexes`,
        createdIndexes
      };
    } catch (error) {
      console.error('Error creating text search indexes:', error);
      return {
        success: false,
        message: `Failed to create text search indexes: ${error}`,
        createdIndexes: []
      };
    }
  }
}
