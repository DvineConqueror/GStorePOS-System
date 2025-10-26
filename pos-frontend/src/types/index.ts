
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
  status: 'available' | 'unavailable' | 'deleted';
  displayStatus?: string; // Virtual field: 'out of stock' when stock is 0, otherwise status
  supplier?: string;
  isDiscountable: boolean; // Eligible for Senior/PWD 20% discount
  isVatExemptable: boolean; // Eligible for VAT exemption for Senior/PWD
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  vatExempt?: boolean; // If VAT exemption was applied (Senior/PWD)
  discountApplied?: boolean; // If 20% discount was applied (Senior/PWD)
  discountAmount?: number; // Amount of discount applied
  finalPrice?: number; // Final price after discount and VAT exemption
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
  vatAmount?: number; // VAT amount extracted from total
  netSales?: number; // Net sales (total - vatAmount)
  vatRate?: number; // VAT rate applied (default 12%)
  customerType?: 'regular' | 'senior' | 'pwd'; // Customer type for discount eligibility
  totalVatExempt?: number; // Total VAT exempted for Senior/PWD
  totalDiscountAmount?: number; // Total 20% discount for Senior/PWD
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
