import { Product } from '../../models/Product';

// Product validation service for business rules
export class ProductValidationService {
  /**
   * Validate product data
   */
  static async validateProductData(productData: any): Promise<void> {
    // Required fields validation
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (!productData.price || productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    if (productData.stock !== undefined && productData.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }

    if (productData.minStock !== undefined && productData.minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }

    // Category validation
    if (!productData.category || productData.category.trim() === '') {
      throw new Error('Product category is required');
    }

    // SKU validation
    if (productData.sku && productData.sku.trim() === '') {
      throw new Error('SKU cannot be empty if provided');
    }

    // Barcode validation
    if (productData.barcode && productData.barcode.trim() === '') {
      throw new Error('Barcode cannot be empty if provided');
    }

    // Price validation
    if (productData.cost !== undefined && productData.cost < 0) {
      throw new Error('Product cost cannot be negative');
    }

    // Unit validation
    if (productData.unit && productData.unit.trim() === '') {
      throw new Error('Unit cannot be empty if provided');
    }
  }

  /**
   * Validate unique SKU
   */
  static async validateUniqueSku(sku: string, excludeProductId?: string): Promise<void> {
    if (!sku) return;

    const query: any = { sku };
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }

    const existingProduct = await Product.findOne(query);
    if (existingProduct) {
      throw new Error('Product with this SKU already exists');
    }
  }

  /**
   * Validate unique barcode
   */
  static async validateUniqueBarcode(barcode: string, excludeProductId?: string): Promise<void> {
    if (!barcode) return;

    const query: any = { barcode };
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }

    const existingBarcode = await Product.findOne(query);
    if (existingBarcode) {
      throw new Error('Product with this barcode already exists');
    }
  }

  /**
   * Validate stock data
   */
  static validateStockData(stock: number, operation: string): void {
    if (typeof stock !== 'number') {
      throw new Error('Stock must be a number');
    }

    if (stock < 0) {
      throw new Error('Stock value cannot be negative');
    }

    if (!['set', 'add', 'subtract'].includes(operation)) {
      throw new Error('Invalid operation. Use "set", "add", or "subtract"');
    }
  }

  /**
   * Validate product exists
   */
  static async validateProductExists(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
  }

  /**
   * Validate product is active
   */
  static async validateProductIsActive(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.status !== 'active') {
      throw new Error('Product is not active');
    }
  }

  /**
   * Validate product has sufficient stock
   */
  static async validateSufficientStock(productId: string, requiredQuantity: number): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < requiredQuantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Required: ${requiredQuantity}`);
    }
  }

  /**
   * Validate price range
   */
  static validatePriceRange(minPrice: number, maxPrice: number): void {
    if (minPrice < 0) {
      throw new Error('Minimum price cannot be negative');
    }

    if (maxPrice < 0) {
      throw new Error('Maximum price cannot be negative');
    }

    if (minPrice > maxPrice) {
      throw new Error('Minimum price cannot be greater than maximum price');
    }
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): void {
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }

    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }
  }
}
