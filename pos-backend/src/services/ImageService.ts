import { ImageUploadService } from './image/ImageUploadService';
import { ImageProcessingService } from './image/ImageProcessingService';
import { ImageStorageService } from './image/ImageStorageService';
import { ApiResponse } from '../types';

// Define the file type interface
interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class ImageService {
  /**
   * Upload image to GridFS
   */
  static async uploadImage(file: UploadedFile): Promise<string> {
    return ImageUploadService.uploadImage(file);
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files: UploadedFile[]): Promise<string[]> {
    return ImageUploadService.uploadMultipleImages(files);
  }

  /**
   * Replace existing image
   */
  static async replaceImage(oldImageId: string, newFile: UploadedFile): Promise<string> {
    return ImageUploadService.replaceImage(oldImageId, newFile);
  }

  /**
   * Get image stream by ID
   */
  static getImageStream(imageId: string) {
    return ImageProcessingService.getImageStream(imageId);
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imageId: string): Promise<any> {
    return ImageProcessingService.getImageMetadata(imageId);
  }

  /**
   * Check if image exists
   */
  static async imageExists(imageId: string): Promise<boolean> {
    return ImageProcessingService.imageExists(imageId);
  }

  /**
   * Get image info (size, type, etc.)
   */
  static async getImageInfo(imageId: string): Promise<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    uploadDate: Date;
    metadata?: any;
  }> {
    return ImageProcessingService.getImageInfo(imageId);
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: UploadedFile): { valid: boolean; error?: string } {
    return ImageProcessingService.validateImageFile(file);
  }

  /**
   * Generate image URL for frontend
   */
  static generateImageUrl(imageId: string, baseUrl?: string): string {
    return ImageProcessingService.generateImageUrl(imageId, baseUrl);
  }

  /**
   * Delete image by ID
   */
  static async deleteImage(imageId: string): Promise<boolean> {
    return ImageStorageService.deleteImage(imageId);
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(imageIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    return ImageStorageService.deleteMultipleImages(imageIds);
  }

  /**
   * Clean up orphaned images
   */
  static async cleanupOrphanedImages(): Promise<{
    deletedCount: number;
    orphanedImages: string[];
  }> {
    return ImageStorageService.cleanupOrphanedImages();
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    oldestImage?: Date;
    newestImage?: Date;
  }> {
    return ImageStorageService.getStorageStats();
  }

  /**
   * List all images with pagination
   */
  static async listImages(page: number = 1, limit: number = 20): Promise<{
    images: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return ImageStorageService.listImages(page, limit);
  }

  /**
   * Search images by metadata
   */
  static async searchImages(query: string): Promise<any[]> {
    return ImageStorageService.searchImages(query);
  }
}