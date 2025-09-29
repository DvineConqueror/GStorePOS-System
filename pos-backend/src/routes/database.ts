import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseIndexService } from '../services/DatabaseIndexService';

const router = express.Router();

/**
 * @route   GET /api/database/indexes
 * @desc    Get database index information
 * @access  Superadmin only
 */
router.get('/indexes', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const indexInfo = await DatabaseIndexService.getIndexInfo();
    
    res.json({
      success: true,
      data: indexInfo
    });
  } catch (error) {
    console.error('Error getting index info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get index information'
    });
  }
});

/**
 * @route   GET /api/database/stats
 * @desc    Get database statistics and index usage
 * @access  Superadmin only
 */
router.get('/stats', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const stats = await DatabaseIndexService.getIndexStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics'
    });
  }
});

/**
 * @route   GET /api/database/explain
 * @desc    Get query execution plans for common queries
 * @access  Superadmin only
 */
router.get('/explain', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const explanations = await DatabaseIndexService.explainCommonQueries();
    
    res.json({
      success: true,
      data: explanations
    });
  } catch (error) {
    console.error('Error explaining queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to explain queries'
    });
  }
});

/**
 * @route   POST /api/database/ensure-indexes
 * @desc    Ensure all indexes are created
 * @access  Superadmin only
 */
router.post('/ensure-indexes', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await DatabaseIndexService.ensureIndexes();
    
    res.json({
      success: true,
      message: 'All indexes ensured successfully'
    });
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ensure indexes'
    });
  }
});

/**
 * @route   POST /api/database/optimize
 * @desc    Optimize database performance
 * @access  Superadmin only
 */
router.post('/optimize', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const results = await DatabaseIndexService.optimizeDatabase();
    
    res.json({
      success: true,
      message: 'Database optimization completed',
      data: results
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize database'
    });
  }
});

/**
 * @route   GET /api/database/slow-queries
 * @desc    Get slow query analysis
 * @access  Superadmin only
 */
router.get('/slow-queries', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const slowQueries = await DatabaseIndexService.getSlowQueries();
    
    res.json({
      success: true,
      data: slowQueries
    });
  } catch (error) {
    console.error('Error getting slow queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow query analysis'
    });
  }
});

/**
 * @route   GET /api/database/health
 * @desc    Get database health check
 * @access  Manager and above
 */
router.get('/health', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const health = await DatabaseIndexService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error in database health check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform health check'
    });
  }
});

export default router;