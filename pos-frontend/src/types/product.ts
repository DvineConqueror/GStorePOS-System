export interface Product {
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
  status: 'available' | 'unavailable' | 'deleted';
  displayStatus?: string; // Virtual field: 'out of stock' when stock is 0, otherwise status
  supplier?: string;
  isDiscountable: boolean; // Eligible for Senior/PWD 20% discount
  isVatExemptable: boolean; // Eligible for VAT exemption for Senior/PWD
  createdAt: string;
  updatedAt: string;
}

export interface NewProduct {
  name: string;
  price: string;
  category: string;
  stock: string;
  unit: string;
  image: File | null;
  imagePreview: string;
  isDiscountable: boolean;
  isVatExemptable: boolean;
}

export interface Category {
  _id: string;
  name: string;
  group: string;
  description?: string;
  isActive: boolean;
}

export interface CategoryGroup {
  _id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface ProductFilters {
  search: string;
  category: string;
  status: string;
}

export interface ProductStats {
  total: number;
  available: number;
  unavailable: number;
  outOfStock: number;
  lowStock: number;
}
