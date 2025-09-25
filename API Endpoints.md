# Grocery Store POS API Documentation

## Overview
This document provides comprehensive API documentation for the Grocery Store POS system. All endpoints are RESTful and return JSON responses.

**Base URL:** `http://localhost:5000/api/v1`

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

## User Roles
- **superadmin**: Full system access
- **manager**: Can manage cashiers and view analytics
- **cashier**: Can process transactions and view own data

---

## Authentication Endpoints

### 1. Initial Setup (First User)
**POST** `/auth/setup`
- **Access**: Public (only works if no users exist)
- **Description**: Create the first admin user for initial system setup

**Request Body:**
```json
{
  "username": "admin",
  "email": "admin@store.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Initial admin user created successfully.",
  "data": {
    "user": {
      "id": "user_id",
      "username": "admin",
      "email": "admin@store.com",
      "role": "manager",
      "firstName": "Admin",
      "lastName": "User",
      "isActive": true
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Register Cashier
**POST** `/auth/register-cashier`
- **Access**: Public
- **Description**: Register a new cashier (requires admin approval)

**Request Body:**
```json
{
  "username": "cashier1",
  "email": "cashier@store.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 3. Register User (Admin Only)
**POST** `/auth/register`
- **Access**: Private (Manager/Superadmin)
- **Description**: Create new users (managers can create cashiers, superadmin can create managers)

**Request Body:**
```json
{
  "username": "manager1",
  "email": "manager@store.com",
  "password": "password123",
  "role": "manager",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### 4. Login
**POST** `/auth/login`
- **Access**: Public
- **Description**: Authenticate user and get JWT token

**Request Body:**
```json
{
  "emailOrUsername": "admin@store.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user_id",
      "username": "admin",
      "email": "admin@store.com",
      "role": "manager",
      "firstName": "Admin",
      "lastName": "User",
      "isActive": true,
      "isApproved": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 5. Get Current User Profile
**GET** `/auth/me`
- **Access**: Private
- **Description**: Get current authenticated user's profile

### 6. Update Profile
**PUT** `/auth/profile`
- **Access**: Private
- **Description**: Update current user's profile

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@store.com"
}
```

### 7. Change Password
**PUT** `/auth/change-password`
- **Access**: Private
- **Description**: Change current user's password

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 8. Logout
**POST** `/auth/logout`
- **Access**: Private
- **Description**: Logout user (client-side token removal)

---

## User Management Endpoints

### 1. Get All Users
**GET** `/users`
- **Access**: Private (Manager/Superadmin)
- **Description**: Get paginated list of users

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status
- `search` (string): Search in username, email, firstName, lastName
- `sort` (string): Sort field (default: 'createdAt')
- `order` (string): Sort order 'asc' or 'desc' (default: 'desc')

**Example:**
```
GET /users?page=1&limit=10&role=cashier&isActive=true&search=john
```

### 2. Get User Statistics
**GET** `/users/stats`
- **Access**: Private (Manager/Superadmin)
- **Description**: Get user statistics

### 3. Get User by ID
**GET** `/users/:id`
- **Access**: Private (Manager/Superadmin)
- **Description**: Get specific user details

### 4. Update User
**PUT** `/users/:id`
- **Access**: Private (Manager/Superadmin)
- **Description**: Update user information

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@store.com",
  "role": "cashier",
  "firstName": "New",
  "lastName": "Name",
  "isActive": true
}
```

### 5. Toggle User Status
**DELETE** `/users/:id`
- **Access**: Private (Manager/Superadmin)
- **Description**: Deactivate user

**PATCH** `/users/:id/reactivate`
- **Access**: Private (Manager/Superadmin)
- **Description**: Reactivate user

### 6. Reset User Password
**POST** `/users/:id/reset-password`
- **Access**: Private (Manager/Superadmin)
- **Description**: Reset user's password

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

---

## Product Management Endpoints

### 1. Get All Products
**GET** `/products`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get paginated list of products

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `inStock` (boolean): Filter in-stock products
- `isActive` (boolean): Filter active products
- `search` (string): Search in name, description, SKU, barcode
- `sort` (string): Sort field (default: 'name')
- `order` (string): Sort order 'asc' or 'desc' (default: 'asc')

**Example:**
```
GET /products?category=groceries&inStock=true&search=milk&sort=price&order=asc
```

### 2. Get Product by ID
**GET** `/products/:id`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get specific product details

### 3. Create Product
**POST** `/products`
- **Access**: Private (Manager, Superadmin)
- **Description**: Create new product

**Request Body:**
```json
{
  "name": "Milk 1L",
  "description": "Fresh whole milk",
  "price": 3.99,
  "cost": 2.50,
  "barcode": "1234567890123",
  "sku": "MILK001",
  "category": "Dairy",
  "brand": "Farm Fresh",
  "stock": 50,
  "minStock": 10,
  "maxStock": 100,
  "unit": "piece",
  "supplier": "Dairy Co"
}
```

### 4. Update Product
**PUT** `/products/:id`
- **Access**: Private (Manager, Superadmin)
- **Description**: Update product information

### 5. Delete Product (Soft Delete)
**DELETE** `/products/:id`
- **Access**: Private (Manager, Superadmin)
- **Description**: Soft delete product (sets isActive to false)

### 6. Update Product Stock
**PATCH** `/products/:id/stock`
- **Access**: Private (Manager, Superadmin)
- **Description**: Update product stock

**Request Body:**
```json
{
  "stock": 75,
  "operation": "set"
}
```

**Operations:**
- `set`: Set stock to exact value
- `add`: Add to current stock
- `subtract`: Subtract from current stock

### 7. Get Low Stock Products
**GET** `/products/alerts/low-stock`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get products with low stock

### 8. Get Out of Stock Products
**GET** `/products/alerts/out-of-stock`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get out of stock products

### 9. Get Product Categories
**GET** `/products/categories`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get list of all product categories

### 10. Get Product Brands
**GET** `/products/brands`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get list of all product brands

---

## Transaction Endpoints

### 1. Get All Transactions
**GET** `/transactions`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get paginated list of transactions

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `startDate` (string): Start date filter (ISO format)
- `endDate` (string): End date filter (ISO format)
- `cashierId` (string): Filter by cashier ID
- `paymentMethod` (string): Filter by payment method (cash, card, digital)
- `status` (string): Filter by status (completed, refunded, voided)
- `minAmount` (number): Minimum transaction amount
- `maxAmount` (number): Maximum transaction amount
- `sort` (string): Sort field (default: 'createdAt')
- `order` (string): Sort order 'asc' or 'desc' (default: 'desc')

**Example:**
```
GET /transactions?startDate=2024-01-01&endDate=2024-01-31&paymentMethod=cash&status=completed
```

### 2. Get Transaction by ID
**GET** `/transactions/:id`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Get specific transaction details

### 3. Create Transaction
**POST** `/transactions`
- **Access**: Private (Cashier, Manager, Superadmin)
- **Description**: Create new transaction

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id_1",
      "quantity": 2,
      "unitPrice": 3.99,
      "discount": 0
    },
    {
      "productId": "product_id_2",
      "quantity": 1,
      "unitPrice": 1.50,
      "discount": 0.25
    }
  ],
  "paymentMethod": "cash",
  "customerId": "customer_id_optional",
  "customerName": "John Doe",
  "notes": "Customer requested receipt",
  "discount": 0,
  "tax": 0.50
}
```

### 4. Refund Transaction
**POST** `/transactions/:id/refund`
- **Access**: Private (Manager, Superadmin)
- **Description**: Refund a completed transaction

**Request Body:**
```json
{
  "reason": "Customer returned items"
}
```

### 5. Void Transaction
**POST** `/transactions/:id/void`
- **Access**: Private (Manager, Superadmin)
- **Description**: Void a completed transaction

**Request Body:**
```json
{
  "reason": "Duplicate transaction"
}
```

### 6. Get Daily Sales
**GET** `/transactions/sales/daily`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get daily sales summary

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format (default: today)

### 7. Get Sales by Cashier
**GET** `/transactions/sales/by-cashier`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get sales performance by cashier

**Query Parameters:**
- `startDate` (string): Start date (default: 30 days ago)
- `endDate` (string): End date (default: today)

### 8. Get Top Products
**GET** `/transactions/sales/top-products`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get top selling products

**Query Parameters:**
- `startDate` (string): Start date (default: 30 days ago)
- `endDate` (string): End date (default: today)
- `limit` (number): Number of products to return (default: 10)

---

## Analytics Endpoints

### 1. Get Dashboard Analytics
**GET** `/analytics/dashboard`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get comprehensive dashboard analytics

**Query Parameters:**
- `period` (number): Period in days (default: 30)

**Response:**
```json
{
  "success": true,
  "message": "Dashboard analytics retrieved successfully.",
  "data": {
    "period": "30 days",
    "sales": {
      "totalSales": 15000.50,
      "totalTransactions": 250,
      "averageTransactionValue": 60.00
    },
    "salesByDay": [...],
    "topProducts": [...],
    "salesByCashier": [...],
    "inventory": {
      "lowStock": 5,
      "outOfStock": 2,
      "lowStockProducts": [...],
      "outOfStockProducts": [...]
    },
    "users": [...]
  }
}
```

### 2. Get Sales Analytics
**GET** `/analytics/sales`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get detailed sales analytics

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `groupBy` (string): Group by 'day', 'week', or 'month' (default: 'day')

### 3. Get Product Analytics
**GET** `/analytics/products`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get product performance analytics

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `limit` (number): Number of results (default: 20)

### 4. Get Cashier Analytics
**GET** `/analytics/cashiers`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get cashier performance analytics

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)

### 5. Get Inventory Analytics
**GET** `/analytics/inventory`
- **Access**: Private (Manager, Superadmin)
- **Description**: Get inventory analytics and alerts

---

## Superadmin Endpoints

### 1. Get System Statistics
**GET** `/superadmin/stats`
- **Access**: Private (Superadmin only)
- **Description**: Get comprehensive system statistics

**Response:**
```json
{
  "success": true,
  "message": "System statistics retrieved successfully.",
  "data": {
    "overview": {
      "totalUsers": 15,
      "activeUsers": 12,
      "approvedUsers": 10,
      "pendingApprovals": 2,
      "managerCount": 3,
      "cashierCount": 12
    },
    "roleBreakdown": [
      {
        "_id": "manager",
        "total": 3,
        "active": 3,
        "approved": 3,
        "pending": 0
      },
      {
        "_id": "cashier",
        "total": 12,
        "active": 9,
        "approved": 7,
        "pending": 2
      }
    ],
    "recentUsers": [...]
  }
}
```

### 2. Get All Users
**GET** `/superadmin/users`
- **Access**: Private (Superadmin only)
- **Description**: Get all users in the system (excluding superadmin)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status
- `isApproved` (boolean): Filter by approval status
- `search` (string): Search in username, email, firstName, lastName
- `sort` (string): Sort field (default: 'createdAt')
- `order` (string): Sort order 'asc' or 'desc' (default: 'desc')

### 3. Get Pending Approvals
**GET** `/superadmin/approvals`
- **Access**: Private (Superadmin only)
- **Description**: Get users waiting for approval

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role

### 4. Approve/Reject User
**POST** `/superadmin/approve/:userId`
- **Access**: Private (Superadmin only)
- **Description**: Approve or reject a user

**Request Body:**
```json
{
  "approved": true,
  "reason": "User meets all requirements"
}
```

### 5. Bulk Approve Users
**POST** `/superadmin/bulk-approve`
- **Access**: Private (Superadmin only)
- **Description**: Approve or reject multiple users

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "approved": true,
  "reason": "Bulk approval for new hires"
}
```

### 6. Create Manager
**POST** `/superadmin/create-manager`
- **Access**: Private (Superadmin only)
- **Description**: Create a new manager account

**Request Body:**
```json
{
  "username": "manager1",
  "email": "manager@store.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Manager"
}
```

---

## Health Check

### Health Check
**GET** `/health`
- **Access**: Public
- **Description**: Check server health status

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:

```
base_url: http://localhost:5000/api/v1
token: {{jwt_token_here}}
```

### Authentication Setup
1. Login using the `/auth/login` endpoint
2. Copy the `token` from the response
3. Set the `token` environment variable
4. Use `{{token}}` in Authorization headers for protected endpoints

### Common Headers
For all requests, include:
```
Content-Type: application/json
```

For protected endpoints, include:
```
Authorization: Bearer {{token}}
```

### Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Role-Based Access Control

### Superadmin
- Full access to all endpoints
- Can create managers
- Can approve/reject all users
- Can view all system statistics

### Manager
- Can manage cashiers
- Can view analytics
- Can manage products
- Can process transactions
- Can view all transactions

### Cashier
- Can process transactions
- Can view products
- Can view own transactions only
- Cannot access user management or analytics

---

## 📋 Testing Checklist

### Authentication Flow
- [ ] Initial setup (first user)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected endpoint without token
- [ ] Access protected endpoint with invalid token
- [ ] Access protected endpoint with valid token

### User Management
- [ ] Register new cashier
- [ ] Register new user (admin)
- [ ] Get all users
- [ ] Update user
- [ ] Toggle user status
- [ ] Reset user password

### Product Management
- [ ] Create product
- [ ] Get all products
- [ ] Update product
- [ ] Update stock
- [ ] Get low stock alerts
- [ ] Search products

### Transaction Management
- [ ] Create transaction
- [ ] Get transactions
- [ ] Refund transaction
- [ ] Void transaction
- [ ] Get sales analytics

### Superadmin Functions
- [ ] Get system stats
- [ ] Get pending approvals
- [ ] Approve user
- [ ] Bulk approve users
- [ ] Create manager

---

## Getting Started

1. **Start the server:**
   ```bash
   cd pos-backend
   npm run dev
   ```

2. **Create initial admin:**
   ```bash
   npm run create-superadmin
   ```

3. **Import Postman collection** (if available)

4. **Set up environment variables** in Postman

5. **Test authentication flow** starting with login

6. **Explore endpoints** based on your role and needs

---

## Support

For API support or questions:
- Check server logs for detailed error information
- Verify authentication tokens are valid
- Ensure proper role permissions for endpoints
- Review request/response formats match documentation

**Server Logs Location:** Check console output when running `npm run dev`
