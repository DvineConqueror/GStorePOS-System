import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { SecurityConfig } from './config/server/SecurityConfig';
import { MiddlewareConfig } from './config/server/MiddlewareConfig';
import { HealthCheckService } from './config/server/HealthCheckService';
import { ServerConfig } from './config/server/ServerConfig';
import { ServiceInitializer } from './config/server/ServiceInitializer';
import { GracefulShutdownService } from './config/server/GracefulShutdownService';
import { SocketService } from './services/SocketService';
import { requestMetrics } from './middleware/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT;

/**
 * Configure Express application
 */
async function configureApp(): Promise<void> {
  // Security configuration
  SecurityConfig.configure(app);
  SecurityConfig.configureRateLimit(app);
  SecurityConfig.configureCORS(app);

  // Middleware configuration
  MiddlewareConfig.configureBodyParsing(app);
  MiddlewareConfig.configureLogging(app);
  MiddlewareConfig.configureImageCORS(app);

  // Request metrics middleware
  app.use(requestMetrics);

  // Health check endpoint
  HealthCheckService.configureHealthCheck(app);

  // Routes configuration
  await ServerConfig.configureRoutes(app);

  // Error handling middleware
  ServerConfig.configureErrorHandling(app);
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDB();
    
    // Configure Express app
    await configureApp();

    // Create HTTP server and Socket.IO instance
    const { server, io } = ServerConfig.createServer(app);

    // Configure Socket.IO
    ServerConfig.configureSocketIO(io);
    SocketService.initialize(io);

    // Make io available globally for other modules
    (global as any).io = io;

    // Configure server timeouts
    ServerConfig.configureTimeouts(server);

    // Start the server
    const serverInstance = server.listen(PORT, async () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`CORS Configuration:`);
      console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`);
      console.log(`- CLIENT_URL: ${process.env.CLIENT_URL}`);
      console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

      // Initialize services
      await ServiceInitializer.initializeServices();
      
      // Initialize image storage
      ServiceInitializer.initializeImageStorage();

      // Start health monitoring
      const healthInterval = HealthCheckService.startHealthMonitoring();
      GracefulShutdownService.setHealthInterval(healthInterval);

      // Setup process handlers
      GracefulShutdownService.setupProcessHandlers(io, serverInstance);
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

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;