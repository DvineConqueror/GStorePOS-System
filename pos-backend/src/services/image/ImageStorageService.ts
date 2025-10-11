import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export class ImageStorageService {
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
   * Delete image by ID
   */
  static async deleteImage(imageId: string): Promise<boolean> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const objectId = new ObjectId(imageId);
      await this.bucket.delete(objectId);
      console.log('Image deleted successfully:', imageId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(imageIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const imageId of imageIds) {
      try {
        const deleted = await this.deleteImage(imageId);
        if (deleted) {
          success.push(imageId);
        } else {
          failed.push(imageId);
        }
      } catch (error) {
        console.error(`Failed to delete image ${imageId}:`, error);
        failed.push(imageId);
      }
    }

    return { success, failed };
  }

  /**
   * Clean up orphaned images
   */
  static async cleanupOrphanedImages(): Promise<{
    deletedCount: number;
    orphanedImages: string[];
  }> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      // Get all images in GridFS
      const allImages = await this.bucket.find({}).toArray();
      const orphanedImages: string[] = [];

      // Check each image against product references
      for (const image of allImages) {
        const imageId = image._id.toString();
        
        // Check if image is referenced by any product
        const Product = mongoose.model('Product');
        const productUsingImage = await Product.findOne({ image: imageId });
        
        if (!productUsingImage) {
          orphanedImages.push(imageId);
        }
      }

      // Delete orphaned images
      let deletedCount = 0;
      for (const imageId of orphanedImages) {
        try {
          const deleted = await this.deleteImage(imageId);
          if (deleted) {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete orphaned image ${imageId}:`, error);
        }
      }

      console.log(`Cleaned up ${deletedCount} orphaned images`);
      return { deletedCount, orphanedImages };
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      return { deletedCount: 0, orphanedImages: [] };
    }
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
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const images = await this.bucket.find({}).toArray();
      
      let totalSize = 0;
      let oldestDate: Date | undefined;
      let newestDate: Date | undefined;

      for (const image of images) {
        totalSize += image.length;
        
        if (!oldestDate || image.uploadDate < oldestDate) {
          oldestDate = image.uploadDate;
        }
        
        if (!newestDate || image.uploadDate > newestDate) {
          newestDate = image.uploadDate;
        }
      }

      return {
        totalImages: images.length,
        totalSize,
        averageSize: images.length > 0 ? totalSize / images.length : 0,
        oldestImage: oldestDate,
        newestImage: newestDate
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalImages: 0,
        totalSize: 0,
        averageSize: 0
      };
    }
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
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const skip = (page - 1) * limit;
      
      const images = await this.bucket.find({})
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.bucket.find({}).count();

      return {
        images,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error listing images:', error);
      return {
        images: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      };
    }
  }

  /**
   * Search images by metadata
   */
  static async searchImages(query: string): Promise<any[]> {
    if (!this.bucket) {
      this.initializeBucket();
    }

    try {
      const images = await this.bucket.find({
        $or: [
          { filename: { $regex: query, $options: 'i' } },
          { 'metadata.originalName': { $regex: query, $options: 'i' } }
        ]
      }).toArray();

      return images;
    } catch (error) {
      console.error('Error searching images:', error);
      return [];
    }
  }
}
