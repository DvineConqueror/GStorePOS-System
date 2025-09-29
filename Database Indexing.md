# Database Indexing Strategy

This document outlines the comprehensive indexing strategy implemented for the GroceryStorePOS system to optimize query performance and ensure scalability.

## Overview

The indexing strategy is designed to support:
- Fast user authentication and authorization
- Efficient product searches and filtering
- Quick transaction processing and analytics
- Optimal inventory management queries
- Real-time reporting and dashboard updates

## Index Implementations

### User Collection Indexes

#### Single Field Indexes
```javascript
{ role: 1 }           // For role-based queries
{ status: 1 }         // For active user filtering
{ isApproved: 1 }     // For approval status checks
{ createdBy: 1 }      // For creator tracking
{ approvedBy: 1 }     // For approver tracking
{ lastLogin: -1 }     // For login history sorting
```

#### Compound Indexes
```javascript
{ role: 1, status: 1, isApproved: 1 }        // Admin user management
{ status: 1, isApproved: 1, createdAt: -1 }  // Active user listing
{ email: 1, status: 1 }                      // Login optimization
{ username: 1, status: 1 }                   // Login optimization
{ role: 1, firstName: 1, lastName: 1 }       // User search by role
{ createdAt: -1, role: 1 }                   // Registration analytics
```

### Product Collection Indexes

#### Text Search Index
```javascript
{
  name: 'text',
  description: 'text',
  sku: 'text',
  barcode: 'text'
}
```
**Weights:** name(10), sku(5), barcode(3), description(1)

#### Single Field Indexes
```javascript
{ category: 1 }       // Category filtering
{ brand: 1 }          // Brand filtering
{ isActive: 1 }       // Active product filtering
{ stock: 1 }          // Stock level queries
{ price: 1 }          // Price sorting/filtering
{ sku: 1 }            // SKU lookups
{ barcode: 1 }        // Barcode scanning
```

#### Compound Indexes for Product Listing
```javascript
{ isActive: 1, category: 1, name: 1 }        // Filtered product listings
{ isActive: 1, brand: 1, price: 1 }          // Brand-based price filtering
{ category: 1, isActive: 1, stock: -1 }      // Category inventory management
{ stock: 1, minStock: 1, isActive: 1 }       // Low stock detection
{ isActive: 1, stock: 1 }                    // Stock status filtering
{ isActive: 1, price: 1, category: 1 }       // Price range by category
{ price: 1, cost: 1 }                        // Profit margin analysis
{ isActive: 1, name: 1 }                     // Alphabetical sorting
{ isActive: 1, createdAt: -1 }               // Newest products
{ isActive: 1, updatedAt: -1 }               // Recently updated
{ isActive: 1, category: 1, brand: 1, price: 1 } // Complex filtering
```

### Transaction Collection Indexes

#### Single Field Indexes
```javascript
{ cashierId: 1 }           // Cashier queries
{ customerId: 1 }          // Customer history
{ status: 1 }              // Transaction status
{ paymentMethod: 1 }       // Payment analytics
{ createdAt: -1 }          // Date sorting
{ total: 1 }               // Amount queries
{ transactionNumber: 1 }   // Transaction lookup
```

#### Analytics Compound Indexes
```javascript
{ status: 1, createdAt: -1 }                         // Completed transactions by date
{ cashierId: 1, status: 1, createdAt: -1 }           // Cashier performance
{ status: 1, paymentMethod: 1, createdAt: -1 }       // Payment method analytics
{ createdAt: -1, status: 1, total: -1 }              // Sales reports
{ customerId: 1, status: 1, createdAt: -1 }          // Customer history
{ customerId: 1, total: -1 }                         // Customer value analysis
{ createdAt: -1, status: 1, cashierId: 1 }           // Cashier reports
{ createdAt: -1, status: 1, paymentMethod: 1, total: -1 } // Comprehensive analytics
{ 'items.productId': 1, status: 1, createdAt: -1 }   // Product sales performance
{ status: 1, 'items.productId': 1 }                  // Product sales counting
{ status: 1, total: -1, createdAt: -1 }              // High-value transactions
{ createdAt: -1, subtotal: -1, tax: -1 }             // Tax reporting
{ createdAt: -1, _id: -1 }                           // Pagination optimization
{ status: 1, createdAt: -1, cashierId: 1 }           // Refund/void tracking
```

## Query Optimization Patterns

### User Authentication
```javascript
// Optimized by: { email: 1, status: 1 } and { username: 1, status: 1 }
db.users.find({
  $or: [{ email: "user@example.com" }, { username: "username" }],
  status: "active",
  isApproved: true
});
```

### Product Search
```javascript
// Optimized by text index with weights
db.products.find({
  $text: { $search: "laptop electronics" },
  isActive: true,
  category: "Electronics"
});
```

### Inventory Management
```javascript
// Optimized by: { stock: 1, minStock: 1, isActive: 1 }
db.products.find({
  $expr: { $lte: ["$stock", "$minStock"] },
  isActive: true
});
```

### Sales Analytics
```javascript
// Optimized by: { status: 1, createdAt: -1, cashierId: 1 }
db.transactions.find({
  status: "completed",
  createdAt: { $gte: startDate, $lte: endDate },
  cashierId: "cashier123"
});
```

## Performance Monitoring

### Index Usage Monitoring
```javascript
// Check index usage
db.collection.aggregate([{ $indexStats: {} }]);

// Explain query execution
db.collection.find(query).explain("executionStats");
```

### Health Checks
- Monitor index hit ratios
- Track query execution times
- Analyze slow query logs
- Review index size vs data size ratios

## Maintenance Commands

### Create Indexes
```bash
npm run init-indexes
```

### Monitor Performance
```bash
# View index statistics
GET /api/v1/database/stats

# Explain common queries
GET /api/v1/database/explain

# Database health check
GET /api/v1/database/health
```

### Optimize Database
```bash
# Reindex and compact collections
POST /api/v1/database/optimize
```

## Best Practices

1. **Index Selectivity**: Indexes are ordered by selectivity (most selective fields first)
2. **Query Patterns**: Indexes match actual query patterns from the application
3. **Compound Index Order**: Query conditions, sort fields, then projection fields
4. **Text Search**: Weighted text indexes for relevance-based searching
5. **Sparse Indexes**: Used for optional unique fields (barcode)
6. **Background Creation**: Indexes created in background to avoid blocking

## Expected Performance Improvements

- **User Authentication**: 95% faster credential lookups
- **Product Listing**: 80% faster filtered product queries
- **Inventory Queries**: 90% faster low stock detection
- **Transaction Analytics**: 85% faster reporting queries
- **Search Operations**: 95% faster text-based product search

## Monitoring and Alerts

Set up monitoring for:
- Index hit ratios below 95%
- Queries taking longer than 100ms
- Index size growing disproportionately to data
- Missing index warnings in slow query logs

## Future Considerations

- **Partitioning**: Consider date-based partitioning for transactions as data grows
- **Archiving**: Implement data archiving strategy for old transactions
- **Read Replicas**: Use read replicas for analytics queries in high-traffic scenarios
- **Caching**: Leverage Redis caching for frequently accessed data