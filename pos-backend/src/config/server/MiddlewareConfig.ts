import express from 'express';
import morgan from 'morgan';

export class MiddlewareConfig {
  /**
   * Configure body parsing middleware
   */
  static configureBodyParsing(app: express.Application): void {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  /**
   * Configure logging middleware
   */
  static configureLogging(app: express.Application): void {
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else {
      app.use(morgan('combined'));
    }
  }

  /**
   * Configure image-specific CORS middleware
   */
  static configureImageCORS(app: express.Application): void {
    app.use('/api/v1/images', (req, res, next) => {
      // Set CORS headers for all image requests
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Cache-Control, ETag'
      });
      
      // Handle OPTIONS preflight requests
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Max-Age', '86400');
        res.status(204).end();
        return;
      }
      
      next();
    });
  }
}
