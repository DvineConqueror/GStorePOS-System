
export interface Product {
  _id: string;
  id?: string; // For backward compatibility
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
  status: 'active' | 'inactive' | 'deleted';
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  _id: string;
  id?: string; // For backward compatibility
  transactionNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  status: 'completed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  cashReceived?: number;
  change?: number;
  timestamp?: string;
}

export interface SalesByCategory {
  category: string;
  amount: number;
}

export interface SalesByDate {
  date: string;
  amount: number;
}
