import { Product } from '../../models/Product';
import { IProduct } from '../../types';
import { ProductValidationService } from './ProductValidationService';

export class ProductManagementService {
  /**
   * Create new product
   */
  static async createProduct(productData: any): Promise<IProduct> {
    // Validate product data
    await ProductValidationService.validateProductData(productData);
    
    // Check for duplicate barcode
    await ProductValidationService.validateUniqueBarcode(productData.barcode);

    const product = new Product(productData);
    await product.save();
    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, productData: any): Promise<IProduct> {
    // Validate product data
    await ProductValidationService.validateProductData(productData);
    
    // Check for duplicate SKU
    if (productData.sku) {
      await ProductValidationService.validateUniqueSku(productData.sku, productId);
    }
    
    // Check for duplicate barcode
    if (productData.barcode) {
      await ProductValidationService.validateUniqueBarcode(productData.barcode, productId);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(productId: string): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Restore product (undo soft delete)
   */
  static async restoreProduct(productId: string): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: true },
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Update product stock
   */
  static async updateStock(productId: string, stockData: {
    stock: number;
    operation?: 'set' | 'add' | 'subtract';
  }): Promise<IProduct> {
    const { stock, operation = 'set' } = stockData;

    // Validate stock data
    ProductValidationService.validateStockData(stock, operation);

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    let newStock = product.stock;
    switch (operation) {
      case 'set':
        newStock = stock;
        break;
      case 'add':
        newStock = product.stock + stock;
        break;
      case 'subtract':
        newStock = product.stock - stock;
        break;
      default:
        throw new Error('Invalid operation. Use "set", "add", or "subtract"');
    }

    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    product.stock = newStock;
    await product.save();

    return product;
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(updates: Array<{
    productId: string;
    data: any;
  }>): Promise<IProduct[]> {
    const results: IProduct[] = [];
    
    for (const update of updates) {
      try {
        const product = await this.updateProduct(update.productId, update.data);
        results.push(product);
      } catch (error) {
        console.error(`Failed to update product ${update.productId}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Bulk delete products
   */
  static async bulkDeleteProducts(productIds: string[]): Promise<IProduct[]> {
    const results: IProduct[] = [];
    
    for (const productId of productIds) {
      try {
        const product = await this.deleteProduct(productId);
        results.push(product);
      } catch (error) {
        console.error(`Failed to delete product ${productId}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}
