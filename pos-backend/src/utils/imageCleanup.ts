/**
 * Image cleanup utilities
 * Handles image field cleaning and validation
 */
export class ImageCleanup {
  /**
   * Clean image field from request data
   * Removes empty objects, null, or undefined values
   */
  static cleanImageField(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const cleaned = { ...data };

    // Check if image field exists
    if ('image' in cleaned) {
      // Remove if it's an empty object
      if (
        cleaned.image &&
        typeof cleaned.image === 'object' &&
        Object.keys(cleaned.image).length === 0
      ) {
        delete cleaned.image;
      }
      // Remove if it's null or undefined
      else if (cleaned.image === null || cleaned.image === undefined) {
        delete cleaned.image;
      }
      // Remove if it's an empty string
      else if (cleaned.image === '') {
        delete cleaned.image;
      }
    }

    return cleaned;
  }

  /**
   * Validate image ID format
   */
  static validateImageId(imageId: string): boolean {
    if (!imageId || typeof imageId !== 'string') {
      return false;
    }

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const objectIdRegex = /^[a-f\d]{24}$/i;
    return objectIdRegex.test(imageId);
  }

  /**
   * Clean multiple image fields from an array of data
   */
  static cleanImageFieldsBulk(dataArray: any[]): any[] {
    if (!Array.isArray(dataArray)) {
      return dataArray;
    }

    return dataArray.map(item => this.cleanImageField(item));
  }

  /**
   * Extract valid image IDs from data
   * Returns only valid image IDs, filtering out invalid ones
   */
  static extractValidImageIds(data: any | any[]): string[] {
    const imageIds: string[] = [];

    const extractFromObject = (obj: any) => {
      if (obj && typeof obj === 'object' && 'image' in obj) {
        const imageId = obj.image;
        if (this.validateImageId(imageId)) {
          imageIds.push(imageId);
        }
      }
    };

    if (Array.isArray(data)) {
      data.forEach(extractFromObject);
    } else {
      extractFromObject(data);
    }

    return imageIds;
  }

  /**
   * Check if image field needs updating
   * Returns true if the new image is different from the old one
   */
  static needsImageUpdate(oldImage: string | undefined, newImage: string | undefined): boolean {
    // If no new image provided, no update needed
    if (!newImage) {
      return false;
    }

    // If new image is provided and different from old, update needed
    return oldImage !== newImage;
  }
}

