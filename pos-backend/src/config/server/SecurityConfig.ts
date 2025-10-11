import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

export class SecurityConfig {
  /**
   * Configure security middleware
   */
  static configure(app: express.Application): void {
    app.use(helmet());
    app.use(compression());
  }

  /**
   * Configure rate limiting
   */
  static configureRateLimit(app: express.Application): void {
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // limit each IP to 1000 requests per minute default
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
      }
    });
    app.use(limiter);
  }

  /**
   * Configure CORS
   */
  static configureCORS(app: express.Application): void {
    const corsOptions = {
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        // In development, allow any localhost port
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }
        
        // Allow specific origins
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:8080', 
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:3000',
          process.env.FRONTEND_URL,
          process.env.CLIENT_URL,
          'https://gstorepos-system.onrender.com' // Explicit frontend URL
        ].filter(Boolean);
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        console.error(`CORS Error: Origin '${origin}' not allowed. Allowed origins:`, allowedOrigins);
        return callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
      maxAge: 86400, // Cache preflight response for 24 hours
    };

    app.use(cors(corsOptions));
  }
}
