import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// Define the file type interface
interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class ImageUploadService {
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
        console.log('Image uploaded successfully:', uploadStream.id);
        resolve(uploadStream.id.toString());
      });

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files: UploadedFile[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Replace existing image
   */
  static async replaceImage(oldImageId: string, newFile: UploadedFile): Promise<string> {
    try {
      // Delete old image
      if (oldImageId) {
        await this.deleteImage(oldImageId);
      }
      
      // Upload new image
      return await this.uploadImage(newFile);
    } catch (error) {
      console.error('Error replacing image:', error);
      throw new Error('Failed to replace image');
    }
  }
}
