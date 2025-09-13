import express from 'express';
import { Product } from '../models/Product';
import { authenticate, requireAdmin, requireCashier } from '../middleware/auth';
import { ApiResponse, ProductFilters, PaginationOptions } from '../types';

const router = express.Router();

// @desc    Get all products with filtering and pagination
// @route   GET /api/v1/products
// @access  Private (Cashier, Admin)
router.get('/', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
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
    } = req.query;

    const filters: ProductFilters = {};
    
    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (category) filters.category = category as string;
    if (brand) filters.brand = brand as string;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    if (inStock === 'true') filters.inStock = true;
    if (search) filters.search = search as string;

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query: any = {};
    
    // Only add isActive filter if explicitly provided
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Apply filters
    if (filters.category) {
      query.category = { $regex: filters.category, $options: 'i' };
    }
    if (filters.brand) {
      query.brand = { $regex: filters.brand, $options: 'i' };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }
    if (filters.inStock) {
      query.stock = { $gt: 0 };
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { barcode: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      message: 'Products retrieved successfully.',
      data: products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving products.',
    } as ApiResponse);
  }
});

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Private (Cashier, Admin)
router.get('/:id', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully.',
      data: product,
    } as ApiResponse);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving product.',
    } as ApiResponse);
  }
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const productData = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists.',
      } as ApiResponse);
      return;
    }

    // Check if barcode already exists (if provided)
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ barcode: productData.barcode });
      if (existingBarcode) {
        res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists.',
        } as ApiResponse);
        return;
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    } as ApiResponse);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product.',
    } as ApiResponse);
  }
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const productData = req.body;
    const productId = req.params.id;

    // Check if SKU is being changed and if it's already taken
    if (productData.sku) {
      const existingProduct = await Product.findOne({ 
        sku: productData.sku, 
        _id: { $ne: productId } 
      });
      if (existingProduct) {
        res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists.',
        } as ApiResponse);
        return;
      }
    }

    // Check if barcode is being changed and if it's already taken
    if (productData.barcode) {
      const existingBarcode = await Product.findOne({ 
        barcode: productData.barcode, 
        _id: { $ne: productId } 
      });
      if (existingBarcode) {
        res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists.',
        } as ApiResponse);
        return;
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    } as ApiResponse);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product.',
    } as ApiResponse);
  }
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/v1/products/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully.',
      data: product,
    } as ApiResponse);
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product.',
    } as ApiResponse);
  }
});

// @desc    Update product stock
// @route   PATCH /api/v1/products/:id/stock
// @access  Private (Admin only)
router.patch('/:id/stock', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (typeof stock !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Stock must be a number.',
      } as ApiResponse);
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found.',
      } as ApiResponse);
      return;
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
        res.status(400).json({
          success: false,
          message: 'Invalid operation. Use "set", "add", or "subtract".',
        } as ApiResponse);
        return;
    }

    if (newStock < 0) {
      res.status(400).json({
        success: false,
        message: 'Stock cannot be negative.',
      } as ApiResponse);
      return;
    }

    product.stock = newStock;
    await product.save();

    res.json({
      success: true,
      message: 'Product stock updated successfully.',
      data: product,
    } as ApiResponse);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock.',
    } as ApiResponse);
  }
});

// @desc    Get low stock products
// @route   GET /api/v1/products/alerts/low-stock
// @access  Private (Admin only)
router.get('/alerts/low-stock', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const lowStockProducts = await Product.findLowStock();

    res.json({
      success: true,
      message: 'Low stock products retrieved successfully.',
      data: lowStockProducts,
    } as ApiResponse);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving low stock products.',
    } as ApiResponse);
  }
});

// @desc    Get out of stock products
// @route   GET /api/v1/products/alerts/out-of-stock
// @access  Private (Admin only)
router.get('/alerts/out-of-stock', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const outOfStockProducts = await Product.findOutOfStock();

    res.json({
      success: true,
      message: 'Out of stock products retrieved successfully.',
      data: outOfStockProducts,
    } as ApiResponse);
  } catch (error) {
    console.error('Get out of stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving out of stock products.',
    } as ApiResponse);
  }
});

// @desc    Get product categories
// @route   GET /api/v1/products/categories
// @access  Private (Cashier, Admin)
router.get('/categories', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      message: 'Categories retrieved successfully.',
      data: categories,
    } as ApiResponse);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving categories.',
    } as ApiResponse);
  }
});

// @desc    Get product brands
// @route   GET /api/v1/products/brands
// @access  Private (Cashier, Admin)
router.get('/brands', authenticate, requireCashier, async (req, res): Promise<void> => {
  try {
    const brands = await Product.distinct('brand', { 
      isActive: true, 
      brand: { $exists: true, $ne: null, $nin: ['', null] } 
    });
    
    res.json({
      success: true,
      message: 'Brands retrieved successfully.',
      data: brands,
    } as ApiResponse);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving brands.',
    } as ApiResponse);
  }
});

export default router;