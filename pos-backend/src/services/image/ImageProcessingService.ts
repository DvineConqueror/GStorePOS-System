import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export class ImageProcessingService {
  private static bucket: GridFSBucket;

  /**
   * Initialize GridFS bucket
   */
  static initializeBucket(): void {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    this.bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'productImages'
    });
  }

  /**
   * Get image stream by ID
   */
  static getImageStream(imageId: string) {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      return this.bucket.openDownloadStream(objectId);
    } catch (error) {
      console.error('Error creating image stream:', error);
      throw new Error('Invalid image ID');
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imageId: string): Promise<any> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      const files = await this.bucket.find({ _id: objectId }).toArray();
      
      if (files.length === 0) {
        throw new Error('Image not found');
      }

      return files[0];
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Check if image exists
   */
  static async imageExists(imageId: string): Promise<boolean> {
    try {
      await this.getImageMetadata(imageId);
      return true;
    } catch (error) {
      return false;
    }
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
    const metadata = await this.getImageMetadata(imageId);
    
    return {
      id: metadata._id.toString(),
      filename: metadata.filename,
      contentType: metadata.metadata?.mimetype || 'application/octet-stream',
      size: metadata.length,
      uploadDate: metadata.uploadDate,
      metadata: metadata.metadata
    };
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    // Check if buffer is empty
    if (!file.buffer || file.buffer.length === 0) {
      return {
        valid: false,
        error: 'File buffer is empty.'
      };
    }

    return { valid: true };
  }

  /**
   * Generate image URL for frontend
   */
  static generateImageUrl(imageId: string, baseUrl?: string): string {
    const base = baseUrl || process.env.API_URL || 'http://localhost:5000';
    return `${base}/api/v1/images/${imageId}`;
  }
}
