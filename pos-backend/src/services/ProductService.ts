import { ProductQueryService } from './product/ProductQueryService';
import { ProductManagementService } from './product/ProductManagementService';

/**
 * ProductService - Facade Pattern
 * 
 * This service acts as a Facade that provides a simplified, unified interface
 * to the complex subsystem of product-related operations.
 * 
 * Architecture:
 * - This class delegates to specialized services for different concerns
 * - Controllers should only interact with this facade, not the underlying services
 * 
 * Delegates to:
 * - ProductQueryService: Handles all data retrieval operations (queries, searches, filters)
 * - ProductManagementService: Handles CRUD operations and business logic
 * - ProductValidationService: Handles business rules validation (used internally by management)
 * 
 * Benefits:
 * - Single entry point for product operations
 * - Decouples controllers from implementation details
 * - Makes it easier to refactor internal services without affecting controllers
 * - Provides consistent interface across the application
 */
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