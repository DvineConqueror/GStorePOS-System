import express from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ImageService } from '../services/ImageService';
import { ApiResponse } from '../types';

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

// @desc    Upload product image
// @route   POST /api/v1/images/upload
// @access  Private (Admin only)
router.post('/upload', authenticate, requireAdmin, upload.single('image'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided.',
      } as ApiResponse);
      return;
    }

    const imageId = await ImageService.uploadImage(req.file);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        imageId,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image.',
    } as ApiResponse);
  }
});

// @desc    Handle CORS preflight for images
// @route   OPTIONS /api/v1/images/:id
// @access  Public
router.options('/:id', (req, res): void => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Content-Length': '0',
  });
  res.status(204).end();
});

// Also handle global OPTIONS for any image route
router.options('*', (req, res): void => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400',
    'Content-Length': '0',
  });
  res.status(204).end();
});

// @desc    Get product image (public access for display)
// @route   GET /api/v1/images/:id
// @access  Public
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const imageId = req.params.id;
    
    // Set CORS headers first - before any other processing
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Cache-Control',
      'Access-Control-Allow-Credentials': 'false',
    });
    
    // Check if image exists
    const exists = await ImageService.imageExists(imageId);
    if (!exists) {
      res.status(404).json({
        success: false,
        message: 'Image not found.',
      } as ApiResponse);
      return;
    }

    // Get image metadata
    const metadata = await ImageService.getImageMetadata(imageId);
    
    // Set additional headers for the image
    res.set({
      'Content-Type': metadata.metadata?.mimetype || 'image/jpeg',
      'Content-Length': metadata.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      'ETag': `"${imageId}"`, // Use imageId as ETag for caching
    });

    // Stream the image
    const imageStream = await ImageService.getImageStream(imageId);
    imageStream.pipe(res);

  } catch (error) {
    console.error('Image retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving image.',
    } as ApiResponse);
  }
});

// @desc    Delete product image
// @route   DELETE /api/v1/images/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const imageId = req.params.id;
    
    // Check if image exists
    const exists = await ImageService.imageExists(imageId);
    if (!exists) {
      res.status(404).json({
        success: false,
        message: 'Image not found.',
      } as ApiResponse);
      return;
    }

    await ImageService.deleteImage(imageId);

    res.json({
      success: true,
      message: 'Image deleted successfully.',
    } as ApiResponse);
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image.',
    } as ApiResponse);
  }
});

// @desc    Debug: List all images with their IDs  
// @route   GET /api/v1/images/debug
// @access  Public (for debugging)
router.get('/debug', async (req, res): Promise<void> => {
  try {
    const images = await ImageService.getAllImages();
    
    res.json({
      success: true,
      message: 'Debug: All images in GridFS',
      data: images,
    } as ApiResponse);
  } catch (error) {
    console.error('Debug images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve debug images.',
    } as ApiResponse);
  }
});

// @desc    Get all images (admin only)
// @route   GET /api/v1/images
// @access  Private (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const images = await ImageService.getAllImages();

    res.json({
      success: true,
      message: 'Images retrieved successfully.',
      data: images,
    } as ApiResponse);
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving images.',
    } as ApiResponse);
  }
});

// @desc    Cleanup orphaned images
// @route   POST /api/v1/images/cleanup
// @access  Private (Admin only)
router.post('/cleanup', authenticate, requireAdmin, async (req, res): Promise<void> => {
  try {
    const deletedCount = await ImageService.cleanupOrphanedImages();

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} orphaned images deleted.`,
      data: { deletedCount },
    } as ApiResponse);
  } catch (error) {
    console.error('Image cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up images.',
    } as ApiResponse);
  }
});

export default router;
