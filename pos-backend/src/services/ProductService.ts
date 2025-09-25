import { Product } from '../models/Product';
import { IProduct } from '../types';

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
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      isActive,
      search,
      sort = 'name',
      order = 'asc'
    } = filters;

    const query: any = {};

    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (category) query.category = { $regex: category, $options: 'i' };
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    if (inStock) {
      query.stock = { $gt: 0 };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort] = sortOrder;

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  /**
   * Create new product
   */
  static async createProduct(productData: any): Promise<IProduct> {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      throw new Error('Product with this SKU already exists');
    }

    // Check if barcode already exists (if provided)
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ barcode: productData.barcode });
      if (existingBarcode) {
        throw new Error('Product with this barcode already exists');
      }
    }

    const product = new Product(productData);
    await product.save();
    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, productData: any): Promise<IProduct> {
    // Check if SKU is being changed and if it's already taken
    if (productData.sku) {
      const existingProduct = await Product.findOne({ 
        sku: productData.sku, 
        _id: { $ne: productId } 
      });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }
    }

    // Check if barcode is being changed and if it's already taken
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ 
        barcode: productData.barcode, 
        _id: { $ne: productId } 
      });
      if (existingBarcode) {
        throw new Error('Product with this barcode already exists');
      }
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
   * Update product stock
   */
  static async updateStock(productId: string, stockData: {
    stock: number;
    operation?: 'set' | 'add' | 'subtract';
  }): Promise<IProduct> {
    const { stock, operation = 'set' } = stockData;

    if (typeof stock !== 'number') {
      throw new Error('Stock must be a number');
    }

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
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<IProduct[]> {
    return await Product.findLowStock();
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(): Promise<IProduct[]> {
    return await Product.findOutOfStock();
  }

  /**
   * Get product categories
   */
  static async getCategories(): Promise<string[]> {
    return await Product.distinct('category', { isActive: true });
  }

  /**
   * Get product brands
   */
  static async getBrands(): Promise<string[]> {
    return await Product.distinct('brand', { 
      isActive: true, 
      brand: { $exists: true, $ne: null, $nin: ['', null] } 
    });
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, filters: any = {}): Promise<IProduct[]> {
    return await Product.searchProducts(query, filters);
  }
}
