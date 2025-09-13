# Admin Account Creation Script

This directory contains scripts for managing admin accounts in the Grocery POS System.

## Creating Admin Accounts

### Using the Script

To create a new admin account, run the following command from the `pos-backend` directory:

```bash
npm run create-admin
```

Or directly with Node.js:

```bash
node scripts/create-admin.js
```

### What the Script Does

1. **Connects to MongoDB** - Uses the connection string from your `.env` file
2. **Prompts for Admin Details**:
   - Username (must be unique)
   - Email (must be unique)
   - First Name
   - Last Name
   - Password (hidden input)
   - Password Confirmation
3. **Validates Input** - Checks for duplicate usernames/emails and password match
4. **Creates Admin Account** - Hashes password and saves to database
5. **Confirms Success** - Shows account details and login instructions

### Security Features

- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **Input Validation**: Checks for duplicates and required fields
- **Hidden Password Input**: Password is not visible while typing
- **Secure Connection**: Uses MongoDB connection from environment variables

### Example Usage

```bash
$ npm run create-admin

🔧 Grocery POS - Admin Account Creation Script
==============================================

📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully!

👤 Please provide admin account details:
----------------------------------------
Username: admin_john
Email: john@store.com
First Name: John
Last Name: Smith
Password: ********
Confirm Password: ********

🔄 Creating admin account...
✅ Admin account created successfully!
📋 Account Details:
   Username: admin_john
   Email: john@store.com
   Name: John Smith
   Role: Admin
   Status: Active & Approved

🎉 The admin can now login using the Admin Mode on the login page.

👋 Goodbye!
```

### Requirements

- MongoDB must be running
- `.env` file must be configured with `MONGODB_URI`
- Node.js and npm must be installed

### Troubleshooting

**Connection Error**: Make sure MongoDB is running and the connection string in `.env` is correct.

**Duplicate Username/Email**: Choose a different username or email address.

**Script Interrupted**: Press `Ctrl+C` to safely exit the script.

### Multiple Admin Accounts

You can create multiple admin accounts by running the script multiple times. Each admin will have full access to:

- Admin Dashboard
- User Management
- Product Management
- All Analytics
- System Settings
- Both Admin and Cashier POS access

### Best Practices

1. **Use Strong Passwords**: Choose passwords with at least 8 characters, including numbers and special characters
2. **Unique Usernames**: Use descriptive usernames like `admin_john`, `manager_sarah`
3. **Valid Email Addresses**: Use real email addresses for password recovery and notifications
4. **Document Admins**: Keep a record of all admin accounts and their purposes
