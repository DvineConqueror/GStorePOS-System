import express from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ImageController } from '../controllers/ImageController';

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
router.post('/upload', authenticate, requireAdmin, upload.single('image'), ImageController.uploadImage);

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
router.get('/:id', ImageController.getImage);

// @desc    Delete image by ID
// @route   DELETE /api/v1/images/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, requireAdmin, ImageController.deleteImage);

// @desc    Get image metadata
// @route   GET /api/v1/images/:id/metadata
// @access  Private (Admin only)
router.get('/:id/metadata', authenticate, requireAdmin, ImageController.getImageMetadata);

// @desc    List all images
// @route   GET /api/v1/images
// @access  Private (Admin only)
router.get('/', authenticate, requireAdmin, ImageController.listImages);

export default router;