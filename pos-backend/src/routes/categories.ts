import express, { Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import CategoryService from '../services/CategoryService';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await CategoryService.getAllCategories(includeInactive);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   GET /api/v1/categories/grouped
 * @desc    Get categories grouped by category group
 * @access  Private
 */
router.get('/grouped', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const grouped = await CategoryService.getGroupedCategories();

    res.json({
      success: true,
      message: 'Grouped categories retrieved successfully',
      data: grouped
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve grouped categories',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await CategoryService.getCategoryById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, group, description } = req.body;

    if (!name || !group) {
      res.status(400).json({
        success: false,
        message: 'Name and group are required'
      } as ApiResponse);
      return;
    }

    const category = await CategoryService.createCategory({
      name,
      group,
      description,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create category',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, group, description, isActive } = req.body;

    const category = await CategoryService.updateCategory(req.params.id, {
      name,
      group,
      description,
      isActive
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update category',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await CategoryService.deleteCategory(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   POST /api/v1/categories/initialize
 * @desc    Initialize default categories
 * @access  Private (Admin only)
 */
router.post('/initialize', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await CategoryService.initializeDefaultCategories(req.user!.id);

    res.json({
      success: true,
      message: 'Default categories initialized successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize categories',
      error: error.message
    } as ApiResponse);
  }
});

export default router;

