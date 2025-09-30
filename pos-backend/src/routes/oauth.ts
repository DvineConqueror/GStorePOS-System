import express from 'express';
import passport from 'passport';
import { OAuthService, OAuthProfile } from '../services/OAuthService';
import { authRateLimit } from '../middleware/rateLimiter';
import { ApiResponse } from '../types';

const router = express.Router();

// Google OAuth routes
router.get('/google', authRateLimit, passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  async (req: any, res: any) => {
    try {
      const profile = req.user as OAuthProfile;
      const deviceInfo = {
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || req.connection.remoteAddress || '',
        platform: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      };

      const result = await OAuthService.handleOAuthLogin(profile, deviceInfo);
      
      console.log('🔍 OAuth result:', {
        isNewUser: result.isNewUser,
        userRole: result.user.role,
        userEmail: result.user.email,
        isApproved: result.user.isApproved
      });
      
      // Set tokens in cookies
      res.cookie('auth_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Redirect based on user role and approval status
      if (result.isNewUser) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?message=oauth_account_created&approval_required=true`);
      }

      if (!result.user.isApproved) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?message=oauth_account_pending_approval`);
      }

      // Redirect to appropriate dashboard
      switch (result.user.role) {
        case 'superadmin':
          return res.redirect(`${process.env.FRONTEND_URL}/superadmin`);
        case 'manager':
          return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        case 'cashier':
          return res.redirect(`${process.env.FRONTEND_URL}/pos`);
        default:
          return res.redirect(`${process.env.FRONTEND_URL}/pos`);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// Facebook OAuth routes
router.get('/facebook', authRateLimit, passport.authenticate('facebook', {
  scope: ['email']
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=oauth_failed' }),
  async (req: any, res: any) => {
    try {
      const profile = req.user as OAuthProfile;
      const deviceInfo = {
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || req.connection.remoteAddress || '',
        platform: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      };

      const result = await OAuthService.handleOAuthLogin(profile, deviceInfo);
      
      // Set tokens in cookies
      res.cookie('auth_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Redirect based on user role and approval status
      if (result.isNewUser) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?message=oauth_account_created&approval_required=true`);
      }

      if (!result.user.isApproved) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?message=oauth_account_pending_approval`);
      }

      // Redirect to appropriate dashboard
      switch (result.user.role) {
        case 'superadmin':
          return res.redirect(`${process.env.FRONTEND_URL}/superadmin`);
        case 'manager':
          return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        case 'cashier':
          return res.redirect(`${process.env.FRONTEND_URL}/pos`);
        default:
          return res.redirect(`${process.env.FRONTEND_URL}/pos`);
      }
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// Get user's OAuth providers
router.get('/providers', async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
    }

    const providers = await OAuthService.getUserOAuthProviders(req.user._id);
    
    res.json({
      success: true,
      message: 'OAuth providers retrieved successfully',
      data: providers
    } as ApiResponse);
  } catch (error) {
    console.error('Get OAuth providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OAuth providers'
    } as ApiResponse);
  }
});

// Unlink OAuth provider
router.delete('/providers/:provider', async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
    }

    const { provider } = req.params;
    
    if (!['google', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OAuth provider'
      } as ApiResponse);
    }

    const canUnlink = await OAuthService.canUnlinkProvider(req.user._id, provider as 'google' | 'facebook');
    
    if (!canUnlink) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlink the only authentication method'
      } as ApiResponse);
    }

    await OAuthService.unlinkOAuthProvider(req.user._id, provider as 'google' | 'facebook');
    
    res.json({
      success: true,
      message: 'OAuth provider unlinked successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Unlink OAuth provider error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to unlink OAuth provider'
    } as ApiResponse);
  }
});

export default router;
