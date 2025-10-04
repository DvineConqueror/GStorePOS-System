# Database Management Scripts

This directory contains scripts for managing the Grocery POS System database.

## Available Scripts

### 1. Account Creation Scripts

#### Create Superadmin Account
```bash
npm run create-superadmin
```
Creates the initial superadmin account with full system access.

#### Create Admin/Manager Account
```bash
npm run create-admin
```
Creates manager accounts that can manage cashiers and access admin features.

### 2. Database Index Management

#### Initialize Indexes
```bash
npm run init-indexes
```
Creates all database indexes for optimal query performance.

#### Reset Indexes
```bash
npm run reset-indexes
```
Drops and recreates all database indexes (use when updating indexing strategy).

### 3. Database Clear Script

#### Clear All Data
```bash
npm run clear-database
```
** WARNING: This permanently deletes ALL data from the database!**

This script will:
- Remove all user accounts (including superadmin)
- Delete all products and inventory data
- Clear all transaction history
- Reset the database for fresh data import

## Usage Examples

### Setting Up a Fresh Database

1. **Clear existing data** (if needed):
   ```bash
   npm run clear-database
   ```

2. **Create superadmin account**:
   ```bash
   npm run create-superadmin
   ```

3. **Initialize database indexes**:
   ```bash
   npm run init-indexes
   ```

4. **Create manager accounts** (optional):
   ```bash
   npm run create-admin
   ```

### Database Maintenance

#### Performance Optimization
```bash
# Reset indexes for better performance
npm run reset-indexes

# Reinitialize indexes
npm run init-indexes
```

#### Data Migration
```bash
# Clear old data
npm run clear-database

# Import new data via your preferred method
# Then create new admin accounts
npm run create-superadmin
npm run create-admin
```

## Safety Features

### Clear Database Script Safety

The `clear-database` script includes multiple safety measures:

1. **Data Count Display**: Shows current record counts before deletion
2. **Double Confirmation**: Requires typing "DELETE" and "YES" to proceed
3. **Empty Database Check**: Skips operation if database is already empty
4. **Verification**: Confirms all data was successfully deleted
5. **Graceful Interruption**: Handles Ctrl+C interruption safely

### Example Clear Database Output

```
🗑️  Grocery POS - Database Clear Script
==========================================

Connecting to MongoDB...
   URI: mongodb://127.0.0.1:27017/grocery-pos
 Connected to MongoDB successfully!

 Current database status:
   Users: 15
   Products: 250
   Transactions: 1,250
   Total records: 1,515

  WARNING: This operation will permanently delete ALL data!
   - All user accounts (including superadmin)
   - All products and inventory
   - All transaction history
   - All analytics data

Are you sure you want to proceed? (type "DELETE" to confirm): DELETE

This is your last chance. Type "YES" to permanently delete all data: YES

🗑️  Clearing collections...
  Clearing transactions...
     Deleted 1,250 transactions
  Clearing products...
     Deleted 250 products
  Clearing users...
     Deleted 15 users

🔄 Resetting counters...
   Transaction number counters will reset automatically
   All indexes remain intact

 Database cleared successfully!
 Deletion summary:
   Users deleted: 15
   Products deleted: 250
   Transactions deleted: 1,250
   Total records deleted: 1,515

🔍 Verifying database is empty...
   Users: 0
   Products: 0
   Transactions: 0
 Database is now completely empty and ready for fresh data!

 Next steps:
   1. Run "npm run create-superadmin" to create a new superadmin account
   2. Import your new product data
   3. Create new user accounts as needed
   4. Start using the system with fresh data

Disconnected from MongoDB
👋 Goodbye!
```

## Requirements

- MongoDB must be running
- `.env` file must be configured with `MONGODB_URI`
- Node.js and npm must be installed
- Backend must be built (`npm run build`) before running scripts

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running on the specified URI
- Check `.env` file configuration
- Verify network connectivity

### Permission Issues
- Ensure the database user has read/write permissions
- Check MongoDB authentication settings

### Script Interruption
- Press `Ctrl+C` to safely exit any running script
- Scripts handle interruption gracefully and close connections

## Best Practices

1. **Backup Before Clearing**: Always backup important data before running clear-database
2. **Test Environment**: Test scripts in development environment first
3. **Index Management**: Run init-indexes after any schema changes
4. **Account Security**: Use strong passwords for admin accounts
5. **Documentation**: Keep track of admin accounts and their purposes

## Security Considerations

- All scripts require proper MongoDB authentication
- Clear database script includes multiple confirmation steps
- Admin account creation scripts validate input and check for duplicates
- Index scripts only create/update indexes, never delete data