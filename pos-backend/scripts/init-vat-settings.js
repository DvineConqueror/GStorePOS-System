/**
 * Script to Initialize VAT Rate in System Settings
 * 
 * This script ensures the system settings have a VAT rate configured.
 * Default: 12% (Philippine VAT)
 * 
 * Usage: node scripts/init-vat-settings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function initVATSettings() {
  try {
    console.log(' Initializing VAT settings...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery_pos';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Get the SystemSettings model
    const SystemSettings = mongoose.model('SystemSettings', new mongoose.Schema({}, { strict: false }));

    // Check if system settings exist
    let settings = await SystemSettings.findOne();

    if (!settings) {
      console.log('  No system settings found. Creating default settings...\n');
      
      settings = await SystemSettings.create({
        maintenanceMode: false,
        systemName: 'SmartGrocery POS',
        systemVersion: '1.0.0',
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 6,
        requireStrongPasswords: false,
        emailNotifications: true,
        lowStockAlerts: true,
        systemAlerts: true,
        autoBackup: false,
        backupFrequency: 'daily',
        retentionDays: 30,
        storeName: 'SmartGrocery Store',
        storeAddress: 'Philippines',
        storePhone: '',
        storeEmail: '',
        currency: '₱',
        taxRate: 12, // Philippine VAT
      });

      console.log('Created default system settings with 12% VAT rate\n');
    } else if (settings.taxRate === undefined || settings.taxRate === null) {
      // Update existing settings with VAT rate
      settings.taxRate = 12;
      await settings.save();
      console.log('Updated existing system settings with 12% VAT rate\n');
    } else {
      console.log(`  System settings already have VAT rate configured: ${settings.taxRate}%\n`);
    }

    console.log(' Current VAT Settings:');
    console.log(`   VAT Rate: ${settings.taxRate}%`);
    console.log(`   Currency: ${settings.currency}`);
    console.log(`   Store Name: ${settings.storeName}\n`);

    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB\n');
    console.log('VAT settings initialization completed successfully!\n');
  } catch (error) {
    console.error(' Failed to initialize VAT settings:', error);
    process.exit(1);
  }
}

// Run initialization
initVATSettings()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(' Script failed:', error);
    process.exit(1);
  });

