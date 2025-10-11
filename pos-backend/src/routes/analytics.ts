import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin only)
router.get('/dashboard', authenticate, requireAdmin, AnalyticsController.getDashboardAnalytics);

// @desc    Get sales analytics
// @route   GET /api/v1/analytics/sales
// @access  Private (Admin only)
router.get('/sales', authenticate, requireAdmin, AnalyticsController.getSalesAnalytics);

// @desc    Get product analytics
// @route   GET /api/v1/analytics/products
// @access  Private (Admin only)
router.get('/products', authenticate, requireAdmin, AnalyticsController.getProductAnalytics);

// @desc    Get cashier performance
// @route   GET /api/v1/analytics/cashiers
// @access  Private (Admin only)
router.get('/cashiers', authenticate, requireAdmin, AnalyticsController.getCashierAnalytics);

// @desc    Get inventory analytics
// @route   GET /api/v1/analytics/inventory
// @access  Private (Admin only)
router.get('/inventory', authenticate, requireAdmin, AnalyticsController.getInventoryAnalytics);

export default router;
