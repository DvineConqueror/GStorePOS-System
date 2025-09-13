#!/usr/bin/env node

/**
 * Admin Account Creation Script
 * 
 * This script allows you to create admin accounts for the Grocery POS System.
 * Usage: node scripts/create-admin.js
 * 
 * The script will prompt you for admin details and create the account.
 * Multiple admin accounts can be created using this script.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

// Import the User model
const User = require('../src/models/User');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Helper function to ask for password (hidden input)
function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdmin() {
  try {
    console.log('🔧 Grocery POS - Admin Account Creation Script');
    console.log('==============================================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery_pos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully!\n');

    // Get admin details
    console.log('👤 Please provide admin account details:');
    console.log('----------------------------------------');
    
    const username = await askQuestion('Username: ');
    if (!username) {
      throw new Error('Username is required');
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error(`Username '${username}' already exists`);
    }

    const email = await askQuestion('Email: ');
    if (!email) {
      throw new Error('Email is required');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new Error(`Email '${email}' already exists`);
    }

    const firstName = await askQuestion('First Name: ');
    if (!firstName) {
      throw new Error('First name is required');
    }

    const lastName = await askQuestion('Last Name: ');
    if (!lastName) {
      throw new Error('Last name is required');
    }

    const password = await askPassword('Password: ');
    if (!password) {
      throw new Error('Password is required');
    }

    const confirmPassword = await askPassword('Confirm Password: ');
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    console.log('\n🔄 Creating admin account...');

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      isActive: true,
      approved: true,
      approvedBy: 'system',
      approvedAt: new Date()
    });

    await adminUser.save();

    console.log('✅ Admin account created successfully!');
    console.log('📋 Account Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: Admin`);
    console.log(`   Status: Active & Approved`);
    console.log('\n🎉 The admin can now login using the Admin Mode on the login page.');

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  } finally {
    // Close database connection and readline interface
    await mongoose.connection.close();
    rl.close();
    console.log('\n👋 Goodbye!');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  await mongoose.connection.close();
  rl.close();
  process.exit(0);
});

// Run the script
createAdmin();
