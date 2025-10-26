require('dotenv').config();
const mongoose = require('mongoose');

async function migrateProductDiscountFields() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery-pos';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get Product model (use flexible schema)
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    console.log('\n📦 Starting product discount fields migration...\n');

    // Find products that don't have the discount fields
    const productsToUpdate = await Product.find({
      $or: [
        { isDiscountable: { $exists: false } },
        { isVatExemptable: { $exists: false } }
      ]
    });

    console.log(`Found ${productsToUpdate.length} products to update`);

    if (productsToUpdate.length === 0) {
      console.log('\n✅ All products already have discount fields!');
      return;
    }

    // Update products with default values (true for both)
    const result = await Product.updateMany(
      {
        $or: [
          { isDiscountable: { $exists: false } },
          { isVatExemptable: { $exists: false } }
        ]
      },
      {
        $set: {
          isDiscountable: true,
          isVatExemptable: true
        }
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} products`);
    console.log(`   - Set isDiscountable: true`);
    console.log(`   - Set isVatExemptable: true`);

    // Verify the updates
    const sampleProducts = await Product.find({}).limit(5).select('name isDiscountable isVatExemptable');
    
    console.log('\n📊 Sample of updated products:');
    sampleProducts.forEach(product => {
      console.log(`   - ${product.name}`);
      console.log(`     Discountable: ${product.isDiscountable}`);
      console.log(`     VAT Exemptable: ${product.isVatExemptable}`);
    });

    // Count total products with discount fields
    const totalWithFields = await Product.countDocuments({
      isDiscountable: { $exists: true },
      isVatExemptable: { $exists: true }
    });

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Total products with discount fields: ${totalWithFields}`);
    console.log(`\n💡 Note: All products are now eligible for Senior/PWD discounts by default.`);
    console.log(`   You can update individual products via the Product Management page.`);

  } catch (error) {
    console.error('\n❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
migrateProductDiscountFields();

