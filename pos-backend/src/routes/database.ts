import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseController } from '../controllers/DatabaseController';

const router = express.Router();

/**
 * @route   GET /api/database/indexes
 * @desc    Get database index information
 * @access  Superadmin only
 */
router.get('/indexes', authenticate, authorize('superadmin'), DatabaseController.getIndexInfo);

/**
 * @route   GET /api/database/stats
 * @desc    Get database statistics and index usage
 * @access  Superadmin only
 */
router.get('/stats', authenticate, authorize('superadmin'), DatabaseController.getIndexStats);

/**
 * @route   GET /api/database/explain
 * @desc    Get query execution plans for common queries
 * @access  Superadmin only
 */
router.get('/explain', authenticate, authorize('superadmin'), DatabaseController.explainCommonQueries);

/**
 * @route   POST /api/database/ensure-indexes
 * @desc    Ensure all indexes are created
 * @access  Superadmin only
 */
router.post('/ensure-indexes', authenticate, authorize('superadmin'), DatabaseController.ensureIndexes);

/**
 * @route   POST /api/database/optimize
 * @desc    Optimize database performance
 * @access  Superadmin only
 */
router.post('/optimize', authenticate, authorize('superadmin'), DatabaseController.optimizeDatabase);

/**
 * @route   GET /api/database/slow-queries
 * @desc    Get slow query analysis
 * @access  Superadmin only
 */
router.get('/slow-queries', authenticate, authorize('superadmin'), DatabaseController.getSlowQueries);

/**
 * @route   GET /api/database/health
 * @desc    Get database health check
 * @access  Manager and above
 */
router.get('/health', authenticate, authorize('superadmin', 'manager'), DatabaseController.healthCheck);

/**
 * @route   POST /api/database/fix-product-status
 * @desc    Fix product status based on stock levels (stock=0 -> unavailable, stock>0 -> available)
 * @access  Manager and above
 */
router.post('/fix-product-status', authenticate, authorize('superadmin', 'manager'), DatabaseController.fixProductStatus);

export default router;