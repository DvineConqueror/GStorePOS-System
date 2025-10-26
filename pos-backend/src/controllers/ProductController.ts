import { Request, Response } from 'express';
import { Product } from '../models/Product';
import Category from '../models/Category';
import CategoryService from '../services/CategoryService';
import { ImageService } from '../services/ImageService';
import { ProductService } from '../services/ProductService';
import { ApiResponse, ProductFilters } from '../types';

export class ProductController {
  /**
   * Get all products with filtering and pagination
   */
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
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
        order = 'asc'
      } = req.query;

      const filters: ProductFilters = {};
      
      // Only filter by status if explicitly provided
      if (status !== undefined) {
        filters.status = status as 'available' | 'unavailable' | 'deleted';
      } else {
        // Default: exclude deleted products from all queries
        filters.includeDeleted = false;
      }

      if (category) filters.category = category as string;
      if (brand) filters.brand = brand as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (inStock === 'true') filters.inStock = true;
      if (search) filters.search = search as string;

      const result = await ProductService.getProducts({
        ...filters,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc'
      });

      res.json({
        success: true,
        message: 'Products retrieved successfully.',
        data: result.products,
        pagination: result.pagination,
      } as ApiResponse);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving products.',
      } as ApiResponse);
    }
  }

  /**
   * Get product categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getCategoryNames();
      
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
  }

  /**
   * Add new category
   */
  static async addCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.body;

      if (!category || typeof category !== 'string' || category.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Category name is required.',
        } as ApiResponse);
        return;
      }

      const categoryName = category.trim();

      // Create category using CategoryService
      const newCategory = await CategoryService.createCategory({
        name: categoryName,
        createdBy: req.user!.id
      });

      res.status(201).json({
        success: true,
        message: 'Category added successfully.',
        data: { category: categoryName },
      } as ApiResponse);
    } catch (error: any) {
      console.error('Add category error:', error);
      
      if (error.message === 'Category already exists') {
        res.status(400).json({
          success: false,
          message: 'Category already exists.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while adding category.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Get product brands
   */
  static async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await ProductService.getBrands();
      
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
  }

  /**
   * Get single product by ID
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id);

      res.json({
        success: true,
        message: 'Product retrieved successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get product error:', error);
      
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while retrieving product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Create new product
   */
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body;

      // Validate category exists
      if (productData.category) {
        const categoryExists = await CategoryService.getCategoryByName(productData.category);
        
        if (!categoryExists) {
          res.status(400).json({
            success: false,
            message: 'Category does not exist. Please create the category first.',
          } as ApiResponse);
          return;
        }
      }

      // Clean up image field - remove if it's an empty object or null
      if (productData.image && typeof productData.image === 'object' && Object.keys(productData.image).length === 0) {
        delete productData.image;
      } else if (productData.image === null || productData.image === undefined) {
        delete productData.image;
      }

      const product = await ProductService.createProduct(productData);

      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Create product error:', error);
      
      if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while creating product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Create new product with image
   */
  static async createProductWithImage(req: Request, res: Response): Promise<void> {
    try {
      console.log('Image upload endpoint debug:', {
        hasFile: !!req.file,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null,
        productDataRaw: req.body.productData
      });
      
      const productData = JSON.parse(req.body.productData);

      // Validate category exists
      if (productData.category) {
        const categoryExists = await CategoryService.getCategoryByName(productData.category);
        if (!categoryExists) {
          res.status(400).json({
            success: false,
            message: 'Category does not exist. Please create the category first.',
          } as ApiResponse);
          return;
        }
      }

      // Upload image if provided
      if (req.file) {
        try {
          const imageId = await ImageService.uploadImage(req.file);
          productData.image = imageId;
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          res.status(500).json({
            success: false,
            message: 'Failed to upload product image.',
          } as ApiResponse);
          return;
        }
      }

      // Clean up image field - remove if it's an empty object or null
      if (productData.image && typeof productData.image === 'object' && Object.keys(productData.image).length === 0) {
        delete productData.image;
      } else if (productData.image === null || productData.image === undefined) {
        delete productData.image;
      }

      const product = await ProductService.createProduct(productData);

      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Create product with image error:', error);
      
      if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while creating product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Update product
   */
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body;
      const productId = req.params.id;

      // Clean up image field - remove if it's an empty object or null
      if (productData.image && typeof productData.image === 'object' && Object.keys(productData.image).length === 0) {
        delete productData.image;
      } else if (productData.image === null || productData.image === undefined) {
        delete productData.image;
      }

      const product = await ProductService.updateProduct(productId, productData);

      res.json({
        success: true,
        message: 'Product updated successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Update product error:', error);
      
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
      } else if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while updating product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Update product with image
   */
  static async updateProductWithImage(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const productData = JSON.parse(req.body.productData);

      // Get existing product to check for old image
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
        return;
      }

      // Upload new image if provided
      if (req.file) {
        try {
          console.log('Uploading image to GridFS:', {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
          });
          
          const imageId = await ImageService.uploadImage(req.file);
          console.log('Image uploaded successfully, ID:', imageId);
          productData.image = imageId;

          // Delete old image if it exists
          if (existingProduct.image) {
            try {
              await ImageService.deleteImage(existingProduct.image);
            } catch (deleteError) {
              console.warn('Failed to delete old image:', deleteError);
              // Don't fail the update if old image deletion fails
            }
          }
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          res.status(500).json({
            success: false,
            message: 'Failed to upload product image.',
          } as ApiResponse);
          return;
        }
      }

      const product = await ProductService.updateProduct(productId, productData);

      res.json({
        success: true,
        message: 'Product updated successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Update product with image error:', error);
      
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
      } else if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while updating product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.deleteProduct(req.params.id);

      // Delete associated image if it exists
      if (product.image) {
        try {
          await ImageService.deleteImage(product.image);
        } catch (imageError) {
          console.warn('Failed to delete product image:', imageError);
          // Don't fail the deletion if image deletion fails
        }
      }

      res.json({
        success: true,
        message: 'Product deleted successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Delete product error:', error);
      
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while deleting product.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Update product stock
   */
  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

      if (typeof stock !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Stock must be a number.',
        } as ApiResponse);
        return;
      }

      const product = await ProductService.updateStock(req.params.id, { stock, operation });

      res.json({
        success: true,
        message: 'Product stock updated successfully.',
        data: product,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Update stock error:', error);
      
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
      } else if (error.message.includes('Stock cannot be negative') || error.message.includes('Invalid operation')) {
        res.status(400).json({
          success: false,
          message: error.message,
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Server error while updating stock.',
        } as ApiResponse);
      }
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const lowStockProducts = await ProductService.getLowStockProducts();

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
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const outOfStockProducts = await ProductService.getOutOfStockProducts();

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
  }

  /**
   * Toggle product status (available/unavailable)
   */
  static async toggleProductStatus(req: Request, res: Response): Promise<void> {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found.',
        } as ApiResponse);
        return;
      }

      // Toggle between available and unavailable (never toggle to deleted)
      const newStatus = product.status === 'available' ? 'unavailable' : 'available';
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { status: newStatus },
        { new: true }
      );

      res.json({
        success: true,
        message: `Product set to ${newStatus} successfully.`,
        data: updatedProduct,
      } as ApiResponse);

    } catch (error) {
      console.error('Toggle product status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling product status.',
      } as ApiResponse);
    }
  }
}
