/**
 * Database Index Initialization Script
 * 
 * This script ensures all database indexes are created properly.
 * Run this after any schema changes or during deployment.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models to ensure schemas are loaded
require('../dist/models/User');
require('../dist/models/Product');
require('../dist/models/Transaction');

// Load environment variables
dotenv.config();

async function initializeIndexes() {
  try {
    console.log('Starting database index initialization...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery-pos';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB');

    // Get all models
    const User = mongoose.model('User');
    const Product = mongoose.model('Product'); 
    const Transaction = mongoose.model('Transaction');

    // Ensure all indexes are created
    console.log(' Creating database indexes...');
    await User.createIndexes();
    await Product.createIndexes();
    await Transaction.createIndexes();
    console.log(' All indexes created successfully');

    // Get index information manually
    console.log(' Getting index information...');
    const db = mongoose.connection.db;
    const collections = ['users', 'products', 'transactions'];
    
    console.log('\n Index Summary:');
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`  ${collectionName}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        const keyString = Object.keys(index.key).map(key => 
          `${key}:${index.key[key]}`
        ).join(', ');
        console.log(`    - ${index.name}: {${keyString}}`);
      });
    }

    console.log('\n Database index initialization completed successfully!');
    
  } catch (error) {
    console.error(' Error initializing database indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  initializeIndexes();
}

module.exports = { initializeIndexes };