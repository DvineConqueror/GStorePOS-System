import express from 'express';
import { AuthSetupController } from '../controllers/auth/AuthSetupController';
import { AuthLoginController } from '../controllers/auth/AuthLoginController';
import { AuthProfileController } from '../controllers/auth/AuthProfileController';
import { AuthSessionController } from '../controllers/auth/AuthSessionController';
import { AuthPasswordController } from '../controllers/auth/AuthPasswordController';
import { AuthRegistrationController } from '../controllers/auth/AuthRegistrationController';
import { authenticate } from '../middleware/auth';
import { authRateLimit, refreshRateLimit, passwordResetRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Setup routes
router.post('/setup', AuthSetupController.setup);

// Registration routes
router.post('/register-cashier', AuthLoginController.registerCashier);

// Login routes
router.post('/login', authRateLimit, AuthLoginController.login);

// Profile routes
router.get('/me', authenticate, AuthProfileController.getProfile);
router.put('/profile', authenticate, AuthProfileController.updateProfile);
router.put('/change-password', authenticate, AuthProfileController.changePassword);

// Session management routes
router.post('/refresh', refreshRateLimit, AuthSessionController.refreshToken);
router.post('/logout', authenticate, AuthSessionController.logout);
router.post('/logout-all', authenticate, AuthSessionController.logoutAll);
router.get('/sessions', authenticate, AuthSessionController.getSessions);

// Password reset routes
router.post('/forgot-password', passwordResetRateLimit, AuthPasswordController.forgotPassword);
router.get('/verify-reset-token/:token', AuthPasswordController.verifyResetToken);
router.post('/reset-password/:token', passwordResetRateLimit, AuthPasswordController.resetPassword);

// Email health check
router.get('/email-health', AuthPasswordController.emailHealth);

// Admin registration route (requires authentication)
router.post('/register', authenticate, AuthRegistrationController.registerUser);

export default router;