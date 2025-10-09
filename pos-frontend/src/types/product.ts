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
  status: 'active' | 'inactive' | 'deleted';
  supplier?: string;
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
  active: number;
  inactive: number;
  lowStock: number;
}
