import { Document, Model } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'deleted';
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Product Types
export interface IProduct extends Document {
  _id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  barcode?: string;
  sku: string;
  category: string;
  brand?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  image?: string;
  isActive: boolean;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModel extends Model<IProduct> {
  findLowStock(): Promise<IProduct[]>;
  findOutOfStock(): Promise<IProduct[]>;
  searchProducts(query: string, filters?: any): Promise<IProduct[]>;
}

export interface ITransactionModel extends Model<ITransaction> {
  getDailySales(date: Date): Promise<any[]>;
  getSalesByCashier(startDate: Date, endDate: Date): Promise<any[]>;
  getTopProducts(startDate: Date, endDate: Date, limit: number): Promise<any[]>;
}

// Transaction Types
export interface ITransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface ITransaction extends Document {
  _id: string;
  transactionNumber: string;
  items: ITransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  status: 'completed' | 'refunded' | 'voided';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface ICustomer extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  loyaltyPoints: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Types
export interface ISupplier extends Document {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface ISalesAnalytics {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  salesByHour: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  salesByDay: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    transactions: number;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  sessionId: string;
  tokenType: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Refresh Token Payload
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenType: 'refresh';
  iat: number;
  exp: number;
}

// Session Management
export interface ISession {
  sessionId: string;
  userId: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    platform?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

// Token Pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Pagination Types
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Filter Types
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  cashierId?: string;
  paymentMethod?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Store Configuration Types
export interface IStoreConfig extends Document {
  _id: string;
  storeName: string;
  currency: string;
  taxRate: number;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  settings: {
    allowNegativeStock: boolean;
    requireCustomerForTransaction: boolean;
    autoPrintReceipt: boolean;
    loyaltyProgramEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
