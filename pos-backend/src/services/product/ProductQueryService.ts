import { Product } from '../../models/Product';
import { IProduct } from '../../types';

export class ProductQueryService {
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
    status?: 'available' | 'unavailable' | 'deleted';
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      status,
      search,
      sort = 'name',
      order = 'asc',
      includeDeleted = false
    } = filters;

    const query: any = {};

    // Always exclude deleted products unless explicitly requested
    if (!includeDeleted) {
      query.status = { $ne: 'deleted' };
    }

    // Filter by specific status if provided
    if (status) {
      query.status = status;
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

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string, limit: number = 20): Promise<IProduct[]> {
    return await Product.find({ 
      category: { $regex: category, $options: 'i' }, 
      isActive: true 
    }).limit(limit);
  }

  /**
   * Get products by brand
   */
  static async getProductsByBrand(brand: string, limit: number = 20): Promise<IProduct[]> {
    return await Product.find({ 
      brand: { $regex: brand, $options: 'i' }, 
      isActive: true 
    }).limit(limit);
  }

  /**
   * Get products in price range
   */
  static async getProductsInPriceRange(minPrice: number, maxPrice: number): Promise<IProduct[]> {
    return await Product.find({
      price: { $gte: minPrice, $lte: maxPrice },
      isActive: true
    });
  }
}
