import { Product } from '../models/Product';

/**
 * Utility function to fix product status based on stock levels
 * This should be run once to update existing products in the database
 */
export async function fixProductStatusBasedOnStock() {
  try {
    console.log('Starting product status fix...');

    // Find all products that are not deleted
    const products = await Product.find({ status: { $ne: 'deleted' } });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const oldStatus = product.status;
      
      // Apply the same logic as pre-save hook
      if (product.stock === 0 && product.status !== 'unavailable') {
        product.status = 'unavailable';
        await product.save();
        updatedCount++;
        console.log(`✓ Updated ${product.name} (SKU: ${product.sku}): ${oldStatus} → unavailable (stock: 0)`);
      } else if (product.stock > 0 && product.status === 'unavailable') {
        product.status = 'available';
        await product.save();
        updatedCount++;
        console.log(`✓ Updated ${product.name} (SKU: ${product.sku}): ${oldStatus} → available (stock: ${product.stock})`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n=== Product Status Fix Complete ===');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products skipped (already correct): ${skippedCount}`);

    return {
      success: true,
      totalChecked: products.length,
      updated: updatedCount,
      skipped: skippedCount
    };
  } catch (error) {
    console.error('Error fixing product status:', error);
    throw error;
  }
}

