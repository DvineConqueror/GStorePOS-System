import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/database';
import { SessionCleanupService } from './services/SessionCleanupService';
import { EmailService } from './services/EmailService';
import { PasswordResetService } from './services/PasswordResetService';
import { SocketService } from './services/SocketService';
import { ImageService } from './services/ImageService';
import { AnalyticsCacheService } from './services/AnalyticsCacheService';
import CategoryGroupService from './services/CategoryGroupService';
import CategoryService from './services/CategoryService';
import NotificationService from './services/NotificationService';
import { User } from './models/User';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import transactionRoutes from './routes/transactions';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import superadminRoutes from './routes/superadmin';
import databaseRoutes from './routes/database';
import notificationRoutes from './routes/notifications';
import imageRoutes from './routes/images';
import categoryRoutes from './routes/categories';
import categoryGroupRoutes from './routes/categoryGroups';
import systemSettingsRoutes from './routes/systemSettings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestMetrics } from './middleware/metrics';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - More lenient for development
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

// CORS configuration - Optimized for performance
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

// Special middleware for images to ensure CORS headers
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

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/database', databaseRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/category-groups', categoryGroupRoutes);
app.use('/api/v1/system-settings', systemSettingsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Join user to their role-based room for targeted notifications
  socket.on('join-role-room', (role: string) => {
    socket.join(`role-${role}`);
  });
});

// Initialize SocketService
SocketService.initialize(io);

// Make io available globally for other modules
(global as any).io = io;

// Start server
let healthInterval: NodeJS.Timeout | null = null;
let serverInstance: any = null;

const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize GridFS bucket for image storage
    ImageService.initializeBucket();
    // Ensure port is free before starting
    serverInstance = server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`CORS Configuration:`);
      console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`);
      console.log(`- CLIENT_URL: ${process.env.CLIENT_URL}`);
      console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
      
      // Start session cleanup service
      SessionCleanupService.start();

      // Initialize email service
      EmailService.initializeTransporter();
      
      // Initialize analytics cache service
      AnalyticsCacheService.initialize();
      
      // Initialize notification service low stock checker
      (NotificationService.constructor as any).initializeLowStockChecker();
      
      // Initialize default category groups and categories if they don't exist
      (async () => {
        try {
          const adminUser = await User.findOne({ 
            role: { $in: ['manager', 'superadmin'] } 
          }).sort({ createdAt: 1 });
          
          if (adminUser) {
            // Initialize category groups first
            await CategoryGroupService.initializeDefaultCategoryGroups(adminUser.id);
            console.log(' Category groups initialized');
            
            // Then initialize categories
            await CategoryService.initializeDefaultCategories(adminUser.id);
            console.log(' Default categories initialized');
          } else {
            console.log('⚠️  No admin user found for initialization');
          }
        } catch (error) {
          console.error('Error initializing categories:', error);
        }
      })();
      
      // Start password reset token cleanup (every hour)
      setInterval(async () => {
        try {
          await PasswordResetService.cleanupExpiredTokens();
        } catch (error) {
          console.error('Error cleaning up expired password reset tokens:', error);
        }
      }, 60 * 60 * 1000); // 1 hour
    });

    // Handle server errors
    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
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
      
      // Log periodic health status (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Health Check - Memory: ${heapUsedMB}MB, Uptime: ${Math.round(process.uptime())}s, DB: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
      }
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
    process.exit(1);
  }, 5000);
  
  try {
    // Stop session cleanup service
    SessionCleanupService.stop();
    
    // Clear health monitoring interval
    if (healthInterval) {
      clearInterval(healthInterval);
      healthInterval = null;
    }
    
    // Close Socket.IO server
    if (io) {
      io.close();
    }
    
    // Close HTTP server
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close((err: any) => {
          if (err) {
            console.error('Error closing server:', err);
          } else {
          }
          resolve();
        });
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    // Clear any caches/intervals
    clearTimeout(forceExit);
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
