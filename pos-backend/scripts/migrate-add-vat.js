/**
 * Migration Script: Add VAT fields to existing transactions
 * 
 * This script adds VAT-related fields to existing transactions in the database
 * that don't have them yet (for backward compatibility).
 * 
 * Usage: node scripts/migrate-add-vat.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// VAT calculation utility
function calculateVAT(totalAmount, vatRate = 12) {
  if (totalAmount < 0) totalAmount = 0;
  if (vatRate < 0 || vatRate > 100) vatRate = 12;

  // Formula: VAT = Total * (VATRate / (100 + VATRate))
  const vatAmount = totalAmount * (vatRate / (100 + vatRate));
  const netSales = totalAmount - vatAmount;

  return {
    total: Number(totalAmount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    netSales: Number(netSales.toFixed(2)),
    vatRate: vatRate
  };
}

async function migrateTransactions() {
  try {
    console.log('Starting VAT migration...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_pos';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Get the Transaction model
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

    // Find all transactions that don't have VAT fields
    const transactionsWithoutVAT = await Transaction.find({
      $or: [
        { vatAmount: { $exists: false } },
        { netSales: { $exists: false } },
        { vatRate: { $exists: false } }
      ]
    });

    console.log(`Found ${transactionsWithoutVAT.length} transactions to migrate\n`);

    if (transactionsWithoutVAT.length === 0) {
      console.log('No transactions need migration. All transactions already have VAT fields.\n');
      await mongoose.disconnect();
      return;
    }

    // Migrate each transaction
    let migratedCount = 0;
    let errorCount = 0;

    for (const transaction of transactionsWithoutVAT) {
      try {
        const total = transaction.total || 0;
        const vatBreakdown = calculateVAT(total);

        await Transaction.updateOne(
          { _id: transaction._id },
          {
            $set: {
              vatAmount: vatBreakdown.vatAmount,
              netSales: vatBreakdown.netSales,
              vatRate: vatBreakdown.vatRate
            }
          }
        );

        migratedCount++;
        
        // Progress indicator
        if (migratedCount % 100 === 0) {
          console.log(`   Migrated ${migratedCount} transactions...`);
        }
      } catch (error) {
        console.error(`Error migrating transaction ${transaction._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Successfully migrated: ${migratedCount} transactions`);
    if (errorCount > 0) {
      console.log(`Failed to migrate: ${errorCount} transactions`);
    }
    console.log(`Total processed: ${transactionsWithoutVAT.length} transactions\n`);

    // Verify migration
    const remainingWithoutVAT = await Transaction.countDocuments({
      $or: [
        { vatAmount: { $exists: false } },
        { netSales: { $exists: false } },
        { vatRate: { $exists: false } }
      ]
    });

    if (remainingWithoutVAT === 0) {
      console.log('Migration completed successfully! All transactions now have VAT fields.\n');
    } else {
      console.log(`Warning: ${remainingWithoutVAT} transactions still missing VAT fields.\n`);
    }

    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB\n');
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTransactions()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error(' Migration script failed:', error);
    process.exit(1);
  });

