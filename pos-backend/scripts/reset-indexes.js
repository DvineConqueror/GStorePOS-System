/**
 * Database Index Reset Script
 * 
 * This script drops all existing indexes and recreates them based on the current schema.
 * Use this when there are index conflicts or when updating the indexing strategy.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function resetIndexes() {
  try {
    console.log('🚀 Starting database index reset...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery-pos';
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = ['users', 'products', 'transactions'];

    // Drop all existing indexes except _id
    console.log('🗑️  Dropping existing indexes...');
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        
        for (const index of indexes) {
          if (index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`  Dropped index: ${collectionName}.${index.name}`);
            } catch (error) {
              console.log(`  Could not drop index: ${collectionName}.${index.name} (${error.message})`);
            }
          }
        }
      } catch (error) {
        console.log(`  Collection ${collectionName} may not exist yet`);
      }
    }

    // Import models to ensure schemas are loaded
    console.log('📚 Loading models...');
    require('../dist/models/User');
    require('../dist/models/Product');
    require('../dist/models/Transaction');

    // Get all models
    const User = mongoose.model('User');
    const Product = mongoose.model('Product'); 
    const Transaction = mongoose.model('Transaction');

    // Create new indexes
    console.log('🔧 Creating new indexes...');
    await User.createIndexes();
    console.log('  ✅ User indexes created');
    
    await Product.createIndexes();
    console.log('  ✅ Product indexes created');
    
    await Transaction.createIndexes();
    console.log('  ✅ Transaction indexes created');

    // Get final index information
    console.log('📊 Final index summary:');
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        console.log(`  ${collectionName}: ${indexes.length} indexes`);
        indexes.forEach(index => {
          const keyString = Object.keys(index.key).map(key => 
            `${key}:${index.key[key]}`
          ).join(', ');
          console.log(`    - ${index.name}: {${keyString}}`);
        });
      } catch (error) {
        console.log(`  ${collectionName}: Collection not found`);
      }
    }

    console.log('\n🎉 Database index reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting database indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  resetIndexes();
}

module.exports = { resetIndexes };