/**
 * Standalone script to fix product status based on stock levels
 * Run this once to update existing products in the database
 * 
 * Usage: node fix-product-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Define Product Schema (matching the TypeScript model)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, min: 0 },
  barcode: { type: String, unique: true, sparse: true, trim: true },
  sku: { type: String, unique: true, trim: true, uppercase: true },
  category: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  minStock: { type: Number, min: 0, default: 10 },
  maxStock: { type: Number, min: 0 },
  unit: { type: String, required: true, trim: true, default: 'piece' },
  image: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['available', 'unavailable', 'deleted'], 
    default: 'available', 
    required: true 
  },
  supplier: { type: String, trim: true },
  isDiscountable: { type: Boolean, default: true, required: true },
  isVatExemptable: { type: Boolean, default: true, required: true },
}, {
  timestamps: true,
});

async function fixProductStatus() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery_pos');
    console.log('✓ Connected to MongoDB\n');

    // Register Product model
    const Product = mongoose.model('Product', productSchema);

    console.log('Starting product status fix...\n');

    // Find all products that are not deleted
    const products = await Product.find({ status: { $ne: 'deleted' } });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const oldStatus = product.status;
      const oldStock = product.stock;
      
      // Apply the same logic as pre-save hook
      if (product.stock === 0 && product.status !== 'unavailable') {
        product.status = 'unavailable';
        await product.save();
        updatedCount++;
        console.log(`✓ Updated "${product.name}" (SKU: ${product.sku}): ${oldStatus} → unavailable (stock: 0)`);
      } else if (product.stock > 0 && product.status === 'unavailable') {
        product.status = 'available';
        await product.save();
        updatedCount++;
        console.log(`✓ Updated "${product.name}" (SKU: ${product.sku}): ${oldStatus} → available (stock: ${product.stock})`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n=== Product Status Fix Complete ===');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products skipped (already correct): ${skippedCount}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error fixing product status:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
fixProductStatus();

