require('dotenv').config();
const mongoose = require('mongoose');

async function migrateProductStatus() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grocery-pos';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get Product model (use flexible schema)
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    // Update products with old status values
    console.log('Starting product status migration...');

    // Update 'active' to 'available'
    const activeResult = await Product.updateMany(
      { status: 'active' },
      { $set: { status: 'available' } }
    );
    console.log(`✅ Updated ${activeResult.modifiedCount} products from 'active' to 'available'`);

    // Update 'inactive' to 'unavailable'
    const inactiveResult = await Product.updateMany(
      { status: 'inactive' },
      { $set: { status: 'unavailable' } }
    );
    console.log(`✅ Updated ${inactiveResult.modifiedCount} products from 'inactive' to 'unavailable'`);

    // Count products by status
    const statusCounts = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Product Status Summary:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} products`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrateProductStatus();


