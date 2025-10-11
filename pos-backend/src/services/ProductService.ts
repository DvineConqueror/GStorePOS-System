import { ProductQueryService } from './product/ProductQueryService';
import { ProductManagementService } from './product/ProductManagementService';

export class ProductService {
  /**
   * Get all products with filtering and pagination
   */
  static async getProducts(filters: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isActive?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    return ProductQueryService.getProducts(filters);
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id: string) {
    return ProductQueryService.getProductById(id);
  }

  /**
   * Create new product
   */
  static async createProduct(productData: any) {
    return ProductManagementService.createProduct(productData);
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, productData: any) {
    return ProductManagementService.updateProduct(productId, productData);
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(productId: string) {
    return ProductManagementService.deleteProduct(productId);
  }

  /**
   * Update product stock
   */
  static async updateStock(productId: string, stockData: {
    stock: number;
    operation?: 'set' | 'add' | 'subtract';
  }) {
    return ProductManagementService.updateStock(productId, stockData);
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts() {
    return ProductQueryService.getLowStockProducts();
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts() {
    return ProductQueryService.getOutOfStockProducts();
  }

  /**
   * Get product categories
   */
  static async getCategories() {
    return ProductQueryService.getCategories();
  }

  /**
   * Get product brands
   */
  static async getBrands() {
    return ProductQueryService.getBrands();
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, filters: any = {}) {
    return ProductQueryService.searchProducts(query, filters);
  }
}