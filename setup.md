# Quick Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Environment Setup

### Backend Environment
1. Navigate to `pos-backend` directory
2. The `.env` file has been created from `env.example`
3. Update the following variables in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/grocery-pos
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   ```

### Frontend Environment
1. Navigate to `pos-frontend` directory
2. The `.env` file has been created from `env.example`
3. The default API URL is already set to `http://localhost:5000/api/v1`

## Running the Application

### Start Backend (Terminal 1)
```bash
cd pos-backend
npm run dev
```
Backend will run on `http://localhost:5000`

### Start Frontend (Terminal 2)
```bash
cd pos-frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

## First Time Setup

1. Make sure MongoDB is running
2. Start the backend server
3. Start the frontend server
4. Open `http://localhost:5173` in your browser
5. Register a new admin account or use existing credentials

## Project Structure
```
GroceryStorePOS/
├── pos-backend/          # Express.js + MongoDB backend
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth & error handling
│   │   └── types/        # TypeScript types
│   └── package.json
├── pos-frontend/         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── lib/          # API client
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Available
- ✅ User Authentication (JWT)
- ✅ Role-based Access Control (Admin/Cashier)
- ✅ Product Management
- ✅ Transaction Processing
- ✅ User Management (Admin)
- ✅ Analytics Dashboard
- ✅ Responsive UI with Tailwind CSS
- ✅ TypeScript Support
- ✅ Modern React with Hooks
