# Grocery POS System - MERN Stack

A modern Point of Sale (POS) system built with the MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript support.

## Features

### Core POS Features
- **Product Management**: Add, edit, delete products with inventory tracking
- **Transaction Processing**: Complete sales with multiple payment methods
- **Real-time Inventory**: Automatic stock updates after transactions
- **Receipt Generation**: Print or email receipts
- **Transaction History**: View and search past transactions

### User Management & Authentication
- **Role-based Access Control**: Admin and Cashier roles
- **JWT Authentication**: Secure token-based authentication
- **User Management**: Admins can manage user accounts
- **Session Management**: Secure session handling

### Analytics & Reporting
- **Sales Analytics**: Daily, weekly, monthly sales reports
- **Product Performance**: Top-selling products and categories
- **Cashier Performance**: Individual cashier sales tracking
- **Inventory Analytics**: Stock levels and low-stock alerts

### Admin Features
- **User Management**: Create, edit, deactivate user accounts
- **System Configuration**: Store settings and preferences
- **Analytics Dashboard**: Comprehensive business insights
- **Transaction Management**: Refund and void transactions

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **TypeScript** for type safety
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Joi** for data validation
- **Helmet** for security
- **CORS** for cross-origin requests

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **Recharts** for data visualization

## Project Structure

```
GroceryStorePOS/
├── pos-backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/             # Database configuration
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, error handling
│   │   ├── models/             # MongoDB models
│   │   ├── routes/             # API routes
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── pos-frontend/               # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # API client and utilities
│   │   ├── pages/              # Page components
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd pos-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/grocery-pos
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

5. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd pos-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Grocery POS System
VITE_STORE_NAME=Grocery Store
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration (Admin only)
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - User logout

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)
- `PATCH /api/v1/products/:id/stock` - Update stock (Admin only)

### Transactions
- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/:id` - Get single transaction
- `POST /api/v1/transactions` - Create transaction
- `POST /api/v1/transactions/:id/refund` - Refund transaction (Admin only)
- `POST /api/v1/transactions/:id/void` - Void transaction (Admin only)

### Users (Admin only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get single user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user
- `PATCH /api/v1/users/:id/reactivate` - Reactivate user

### Analytics (Admin only)
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/sales` - Sales analytics
- `GET /api/v1/analytics/products` - Product analytics
- `GET /api/v1/analytics/cashiers` - Cashier analytics
- `GET /api/v1/analytics/inventory` - Inventory analytics

## User Roles

### Admin Role
- Full system access
- User management
- Product management
- Transaction management (refund/void)
- Analytics and reporting
- System configuration

### Cashier Role
- Process transactions
- View products
- View own transaction history
- Limited product visibility

## Development

### Backend Development
```bash
cd pos-backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Frontend Development
```bash
cd pos-frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.