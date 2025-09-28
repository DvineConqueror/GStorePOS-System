const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model from compiled JavaScript
const { User } = require('../dist/models/User');

const createSuperadmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-pos');
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.log('Superadmin already exists:', existingSuperadmin.username);
      process.exit(0);
    }

    // Get user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    console.log('\n=== Create Superadmin Account ===\n');

    const username = await question('Enter username: ');
    const email = await question('Enter email: ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    const password = await question('Enter password: ');

    // Validate input
    if (!username || !email || !firstName || !lastName || !password) {
      console.log('All fields are required!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('Password must be at least 6 characters long!');
      rl.close();
      process.exit(1);
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      console.log('Username or email already exists!');
      rl.close();
      process.exit(1);
    }

    // Create superadmin user
    const superadmin = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'superadmin',
      isActive: true,
      isApproved: true, // Superadmin is auto-approved
      approvedBy: null, // No one approves superadmin
      approvedAt: new Date(),
      createdBy: null, // System-created
    });

    await superadmin.save();

    console.log('\nSuperadmin account created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: superadmin`);
    console.log('\nYou can now login at: http://localhost:8080/superadmin');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('Error creating superadmin:', error.message);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nOperation cancelled.');
  process.exit(0);
});

createSuperadmin();
