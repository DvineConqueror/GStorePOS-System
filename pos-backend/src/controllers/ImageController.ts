import { Request, Response } from 'express';
import { ImageService } from '../services/ImageService';
import { ApiResponse } from '../types';

export class ImageController {
  /**
   * Upload product image
   */
  static async uploadImage(req: Request, res: Response): Promise<void> {
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
      console.error('Upload image error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading image.',
      } as ApiResponse);
    }
  }

  /**
   * Get image by ID
   */
  static async getImage(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.id;
      
      if (!imageId) {
        res.status(400).json({
          success: false,
          message: 'Image ID is required.',
        } as ApiResponse);
        return;
      }

      // First get metadata to check if image exists and get content type
      const metadata = await ImageService.getImageMetadata(imageId);
      
      if (!metadata) {
        res.status(404).json({
          success: false,
          message: 'Image not found.',
        } as ApiResponse);
        return;
      }

      // Get the image stream
      const imageStream = ImageService.getImageStream(imageId);
      
      if (!imageStream) {
        res.status(404).json({
          success: false,
          message: 'Image not found.',
        } as ApiResponse);
        return;
      }

      // Set appropriate headers
      res.set({
        'Content-Type': metadata.metadata?.mimetype || 'image/jpeg',
        'Content-Length': metadata.length,
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      });

      // Pipe the image stream to the response
      imageStream.pipe(res);
    } catch (error) {
      console.error('Get image error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving image.',
      } as ApiResponse);
    }
  }

  /**
   * Delete image by ID
   */
  static async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.id;
      
      if (!imageId) {
        res.status(400).json({
          success: false,
          message: 'Image ID is required.',
        } as ApiResponse);
        return;
      }

      const deleted = await ImageService.deleteImage(imageId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Image not found.',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Image deleted successfully.',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting image.',
      } as ApiResponse);
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.id;
      
      if (!imageId) {
        res.status(400).json({
          success: false,
          message: 'Image ID is required.',
        } as ApiResponse);
        return;
      }

      const metadata = await ImageService.getImageMetadata(imageId);
      
      if (!metadata) {
        res.status(404).json({
          success: false,
          message: 'Image not found.',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Image metadata retrieved successfully.',
        data: metadata,
      } as ApiResponse);
    } catch (error) {
      console.error('Get image metadata error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving image metadata.',
      } as ApiResponse);
    }
  }

  /**
   * List all images
   */
  static async listImages(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const images = await ImageService.listImages(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Images retrieved successfully.',
        data: images,
      } as ApiResponse);
    } catch (error) {
      console.error('List images error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving images.',
      } as ApiResponse);
    }
  }
}
