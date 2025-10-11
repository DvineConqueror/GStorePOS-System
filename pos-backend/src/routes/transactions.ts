import express from 'express';
import { authenticate, requireCashier } from '../middleware/auth';
import { TransactionController } from '../controllers/TransactionController';

const router = express.Router();

// @desc    Get all transactions with filtering and pagination
// @route   GET /api/v1/transactions
// @access  Private (Cashier, Admin)
router.get('/', authenticate, requireCashier, TransactionController.getTransactions);

// @desc    Get single transaction by ID
// @route   GET /api/v1/transactions/:id
// @access  Private (Cashier, Admin)
router.get('/:id', authenticate, requireCashier, TransactionController.getTransactionById);

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private (Cashier, Admin)
router.post('/', authenticate, requireCashier, TransactionController.createTransaction);

// @desc    Refund transaction
// @route   POST /api/v1/transactions/:id/refund
// @access  Private (Admin only)
router.post('/:id/refund', authenticate, TransactionController.refundTransaction);

// @desc    Get daily sales summary
// @route   GET /api/v1/transactions/sales/daily
// @access  Private (Manager/Superadmin only)
router.get('/sales/daily', authenticate, TransactionController.getDailySales);

// @desc    Get sales by cashier
// @route   GET /api/v1/transactions/sales/by-cashier
// @access  Private (Manager/Superadmin only)
router.get('/sales/by-cashier', authenticate, TransactionController.getSalesByCashier);

// @desc    Get top products
// @route   GET /api/v1/transactions/sales/top-products
// @access  Private (Manager/Superadmin only)
router.get('/sales/top-products', authenticate, TransactionController.getTopProducts);

export default router;