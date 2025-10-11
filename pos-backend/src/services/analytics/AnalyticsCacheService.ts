interface CachedAnalytics {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export class AnalyticsCacheService {
  private static cache = new Map<string, CachedAnalytics>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached analytics data
   */
  static getCachedAnalytics(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached analytics data
   */
  static setCachedAnalytics(key: string, data: any): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
  }

  /**
   * Check if cache has valid data for key
   */
  static hasValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear specific cache entry
   */
  static clearCache(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  static clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        expiredEntries++;
        this.cache.delete(key);
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: this.cache.size * 1024 // Rough estimate
    };
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredEntries(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}
