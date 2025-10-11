import express from 'express';
import multer from 'multer';
import { authenticate, requireAdmin, requireCashier } from '../middleware/auth';
import { ProductController } from '../controllers/ProductController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// @desc    Get all products with filtering and pagination
// @route   GET /api/v1/products
// @access  Private (Cashier, Admin)
router.get('/', authenticate, requireCashier, ProductController.getProducts);

// @desc    Get product categories
// @route   GET /api/v1/products/categories
// @access  Private (Cashier, Admin)
router.get('/categories', authenticate, requireCashier, ProductController.getCategories);

// @desc    Add new category
// @route   POST /api/v1/products/categories
// @access  Private (Admin only)
router.post('/categories', authenticate, requireAdmin, ProductController.addCategory);

// @desc    Get product brands
// @route   GET /api/v1/products/brands
// @access  Private (Cashier, Admin)
router.get('/brands', authenticate, requireCashier, ProductController.getBrands);

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Private (Cashier, Admin)
router.get('/:id', authenticate, requireCashier, ProductController.getProductById);

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (Admin only)
router.post('/', authenticate, requireAdmin, ProductController.createProduct);

// @desc    Create new product with image
// @route   POST /api/v1/products/with-image
// @access  Private (Admin only)
router.post('/with-image', authenticate, requireAdmin, upload.single('image'), ProductController.createProductWithImage);

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, requireAdmin, ProductController.updateProduct);

// @desc    Update product with image
// @route   PUT /api/v1/products/:id/with-image
// @access  Private (Admin only)
router.put('/:id/with-image', authenticate, requireAdmin, upload.single('image'), ProductController.updateProductWithImage);

// @desc    Delete product (soft delete)
// @route   DELETE /api/v1/products/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, ProductController.deleteProduct);

// @desc    Update product stock
// @route   PATCH /api/v1/products/:id/stock
// @access  Private (Admin only)
router.patch('/:id/stock', authenticate, requireAdmin, ProductController.updateStock);

// @desc    Get low stock products
// @route   GET /api/v1/products/alerts/low-stock
// @access  Private (Admin only)
router.get('/alerts/low-stock', authenticate, requireAdmin, ProductController.getLowStockProducts);

// @desc    Get out of stock products
// @route   GET /api/v1/products/alerts/out-of-stock
// @access  Private (Admin only)
router.get('/alerts/out-of-stock', authenticate, requireAdmin, ProductController.getOutOfStockProducts);

// @desc    Toggle product status (active/inactive)
// @route   PATCH /api/v1/products/:id/toggle-status
// @access  Private (Admin only)
router.patch('/:id/toggle-status', authenticate, requireAdmin, ProductController.toggleProductStatus);

export default router;