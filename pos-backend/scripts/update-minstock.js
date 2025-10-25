/**
 * Migration Script: Update minStock to 10 for all products
 * 
 * This script updates all products with minStock of 0 or undefined to 10
 * to ensure proper low stock notifications.
 * 
 * Usage: node scripts/update-minstock.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function updateMinStock() {
  try {
    console.log('Starting minStock update...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_pos';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Get the Product model
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    // Find all products with minStock <= 0 or undefined
    const productsToUpdate = await Product.find({
      $or: [
        { minStock: { $exists: false } },
        { minStock: { $lte: 0 } }
      ]
    });

    console.log(`Found ${productsToUpdate.length} products to update\n`);

    if (productsToUpdate.length === 0) {
      console.log('No products need updating. All products already have minStock > 0.\n');
      await mongoose.disconnect();
      return;
    }

    // Update all products to have minStock of 10
    const result = await Product.updateMany(
      {
        $or: [
          { minStock: { $exists: false } },
          { minStock: { $lte: 0 } }
        ]
      },
      {
        $set: { minStock: 10 }
      }
    );

    console.log('Update Summary:');
    console.log(`  Successfully updated: ${result.modifiedCount} products`);
    console.log(`  Matched: ${result.matchedCount} products`);
    console.log(`  Total processed: ${productsToUpdate.length} products\n`);

    // Verify the update
    const remainingWithZero = await Product.countDocuments({
      $or: [
        { minStock: { $exists: false } },
        { minStock: { $lte: 0 } }
      ]
    });

    if (remainingWithZero === 0) {
      console.log('Migration completed successfully! All products now have minStock of 10 or higher.\n');
    } else {
      console.log(`Warning: ${remainingWithZero} products still have minStock <= 0.\n`);
    }

    // Show some examples of updated products
    const sampleProducts = await Product.find()
      .select('name stock minStock')
      .limit(5);

    console.log('Sample of updated products:');
    sampleProducts.forEach(p => {
      console.log(`  - ${p.name}: stock=${p.stock}, minStock=${p.minStock}`);
    });
    console.log('');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
updateMinStock()
  .then(() => {
    console.log('Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

