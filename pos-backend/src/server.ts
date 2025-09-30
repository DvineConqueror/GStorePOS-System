import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { SessionCleanupService } from './services/SessionCleanupService';
import { EmailService } from './services/EmailService';
import { PasswordResetService } from './services/PasswordResetService';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import transactionRoutes from './routes/transactions';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import superadminRoutes from './routes/superadmin';
import databaseRoutes from './routes/database';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestMetrics } from './middleware/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!), // limit each IP to 1000 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// CORS configuration - Optimized for performance
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log('CORS Origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // In development, allow any localhost port
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      console.log('CORS: Allowing localhost in development');
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
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log('CORS: Allowed origins:', allowedOrigins);
    console.log('CORS: Request origin:', origin);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Origin allowed');
      return callback(null, true);
    }
    
    console.log('CORS: Origin blocked');
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  maxAge: 86400, // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request metrics middleware
app.use(requestMetrics);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint with enhanced monitoring
app.get('/health', async (req, res) => {
  const memUsage = process.memoryUsage();
  const { requestCount } = require('./middleware/metrics').getRequestMetrics();
  
  // Get cache health
  let cacheHealth = { status: 'unknown', type: 'unknown' };
  try {
    const { getCacheHealth } = require('./config/cache');
    cacheHealth = await getCacheHealth();
  } catch (error) {
    cacheHealth = { status: 'error', type: 'unknown' };
  }
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown',
    },
    cache: cacheHealth,
    requests: {
      currentMinute: requestCount
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/database', databaseRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
let server: any;
let healthInterval: NodeJS.Timeout | null = null;

const startServer = async () => {
  try {
    await connectDB();
    
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
      
      // Start session cleanup service
      SessionCleanupService.start();
      console.log('Session cleanup service started');

      // Initialize email service
      EmailService.initializeTransporter();
      
      // Start password reset token cleanup (every hour)
      setInterval(async () => {
        try {
          await PasswordResetService.cleanupExpiredTokens();
        } catch (error) {
          console.error('Error cleaning up expired password reset tokens:', error);
        }
      }, 60 * 60 * 1000); // 1 hour
    });

    // Server timeout settings
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // Periodic health monitoring (every 10 minutes)
    healthInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (heapUsedMB > 500) { // Alert if memory usage exceeds 500MB
        console.warn(`High memory usage: ${heapUsedMB} MB`);
      }
      
      // Log periodic health status
      console.log(`Health Check - Memory: ${heapUsedMB}MB, Uptime: ${Math.round(process.uptime())}s, DB: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  
  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExit = setTimeout(() => {
    console.log('Force exiting due to timeout...');
    process.exit(1);
  }, 10000); // 10 seconds timeout
  
  try {
    // Stop session cleanup service
    SessionCleanupService.stop();
    
    // Clear health monitoring interval
    if (healthInterval) {
      clearInterval(healthInterval);
      healthInterval = null;
    }
    
    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close((err: any) => {
          if (err) {
            console.error('Error closing server:', err);
          } else {
            console.log('HTTP server closed.');
          }
          resolve();
        });
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
    // Clear any caches/intervals
    console.log('Cleaning up resources...');
    
    // Clear the force exit timeout
    clearTimeout(forceExit);
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    clearTimeout(forceExit);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export default app;
