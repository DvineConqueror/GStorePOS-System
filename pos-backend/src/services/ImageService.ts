import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { ApiResponse } from '../types';

// Define the file type interface
interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class ImageService {
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
   * Upload image to GridFS
   */
  static async uploadImage(file: UploadedFile): Promise<string> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(file.originalname, {
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(new Error('Failed to upload image'));
      });

      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Get image stream by ID
   */
  static async getImageStream(imageId: string) {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      const downloadStream = this.bucket.openDownloadStream(objectId);
      return downloadStream;
    } catch (error) {
      console.error('GridFS download error:', error);
      throw new Error('Image not found');
    }
  }

  /**
   * Get image metadata by ID
   */
  static async getImageMetadata(imageId: string) {
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
      console.error('GridFS metadata error:', error);
      throw new Error('Image not found');
    }
  }

  /**
   * Delete image by ID
   */
  static async deleteImage(imageId: string): Promise<void> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      await this.bucket.delete(objectId);
    } catch (error) {
      console.error('GridFS delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Check if image exists
   */
  static async imageExists(imageId: string): Promise<boolean> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      const files = await this.bucket.find({ _id: objectId }).toArray();
      return files.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all images (for admin purposes)
   */
  static async getAllImages() {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const files = await this.bucket.find({}).toArray();
      return files.map(file => ({
        id: file._id.toString(),
        filename: file.filename,
        uploadDate: file.uploadDate,
        length: file.length,
        contentType: file.metadata?.mimetype || 'unknown'
      }));
    } catch (error) {
      console.error('GridFS list error:', error);
      throw new Error('Failed to retrieve images');
    }
  }

  /**
   * Clean up orphaned images (images not referenced by any product)
   */
  static async cleanupOrphanedImages(): Promise<number> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const { Product } = await import('../models/Product');
      
      // Get all image IDs referenced by products
      const products = await Product.find({ image: { $exists: true, $ne: null } });
      const referencedImageIds = products
        .map(product => product.image)
        .filter(imageId => imageId)
        .map(imageId => new ObjectId(imageId));

      // Get all images in GridFS
      const allImages = await this.bucket.find({}).toArray();
      
      // Find orphaned images
      const orphanedImages = allImages.filter(image => 
        !referencedImageIds.some(refId => refId.equals(image._id))
      );

      // Delete orphaned images
      let deletedCount = 0;
      for (const image of orphanedImages) {
        try {
          await this.bucket.delete(image._id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete orphaned image ${image._id}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('GridFS cleanup error:', error);
      throw new Error('Failed to cleanup orphaned images');
    }
  }
}
