import { productsAPI } from '@/lib/api';

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
  isActive: boolean;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewProduct {
  name: string;
  price: string;
  category: string;
  stock: string;
  minStock: string;
  unit: string;
  description?: string;
  barcode?: string;
  sku: string;
  brand?: string;
  supplier?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class ProductService {
  /**
   * Get all products with filters
   */
  static async getProducts(filters: ProductFilters = {}) {
    const response = await productsAPI.getAll(filters);
    return response;
  }

  /**
   * Get single product by ID
   */
  static async getProduct(id: string) {
    const response = await productsAPI.getById(id);
    return response;
  }

  /**
   * Create new product
   */
  static async createProduct(productData: NewProduct) {
    const response = await productsAPI.create(productData);
    return response;
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, productData: Partial<NewProduct>) {
    const response = await productsAPI.update(id, productData);
    return response;
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: string) {
    const response = await productsAPI.delete(id);
    return response;
  }

  /**
   * Get product statistics
   */
  static async getProductStats() {
    const response = await productsAPI.getStats();
    return response;
  }
}
