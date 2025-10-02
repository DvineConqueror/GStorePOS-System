import express, { Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import CategoryGroupService from '../services/CategoryGroupService';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * @route   GET /api/v1/category-groups
 * @desc    Get all category groups
 * @access  Private
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categoryGroups = await CategoryGroupService.getAllCategoryGroups(includeInactive);

    res.json({
      success: true,
      message: 'Category groups retrieved successfully',
      data: categoryGroups
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category groups',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   GET /api/v1/category-groups/:id
 * @desc    Get category group by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryGroup = await CategoryGroupService.getCategoryGroupById(req.params.id);

    if (!categoryGroup) {
      res.status(404).json({
        success: false,
        message: 'Category group not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category group retrieved successfully',
      data: categoryGroup
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category group',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   POST /api/v1/category-groups
 * @desc    Create new category group
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, order } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Name is required'
      } as ApiResponse);
      return;
    }

    const categoryGroup = await CategoryGroupService.createCategoryGroup({
      name,
      description,
      order,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Category group created successfully',
      data: categoryGroup
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create category group',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   PUT /api/v1/category-groups/:id
 * @desc    Update category group
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, order, isActive } = req.body;

    const categoryGroup = await CategoryGroupService.updateCategoryGroup(req.params.id, {
      name,
      description,
      order,
      isActive
    });

    if (!categoryGroup) {
      res.status(404).json({
        success: false,
        message: 'Category group not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category group updated successfully',
      data: categoryGroup
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update category group',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   DELETE /api/v1/category-groups/:id
 * @desc    Delete category group (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryGroup = await CategoryGroupService.deleteCategoryGroup(req.params.id);

    if (!categoryGroup) {
      res.status(404).json({
        success: false,
        message: 'Category group not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Category group deleted successfully',
      data: categoryGroup
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category group',
      error: error.message
    } as ApiResponse);
  }
});

/**
 * @route   POST /api/v1/category-groups/initialize
 * @desc    Initialize default category groups
 * @access  Private (Admin only)
 */
router.post('/initialize', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await CategoryGroupService.initializeDefaultCategoryGroups(req.user!.id);

    res.json({
      success: true,
      message: 'Default category groups initialized successfully'
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize category groups',
      error: error.message
    } as ApiResponse);
  }
});

export default router;

