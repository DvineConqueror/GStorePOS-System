import { User } from '../models/User';
import { AuthService } from './AuthService';
import { IUser, IOAuthProvider } from '../types';

export interface OAuthProfile {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  name: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
}

export class OAuthService {
  /**
   * Handle OAuth login - either link to existing account or create new one
   */
  static async handleOAuthLogin(
    profile: OAuthProfile,
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<{ user: IUser; tokens: any; session: any; isNewUser: boolean }> {
    try {
      // First, check if user exists with this OAuth provider
      let user = await User.findByOAuthProvider(profile.provider, profile.providerId);
      
      if (user) {
        // User exists with this OAuth provider, update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate tokens and session
        const sessionId = AuthService.generateSessionId();
        const tokens = AuthService.generateTokenPair(user, sessionId);
        const session = AuthService.createSession(user._id, sessionId, deviceInfo);
        
        return { user, tokens, session, isNewUser: false };
      }

      // Check if user exists with this email
      const existingUser = await User.findByEmailForOAuth(profile.email);
      
      if (existingUser) {
        // Link OAuth provider to existing account
        const oauthProvider: IOAuthProvider = {
          provider: profile.provider,
          providerId: profile.providerId,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          linkedAt: new Date(),
        };

        existingUser.oauthProviders = existingUser.oauthProviders || [];
        existingUser.oauthProviders.push(oauthProvider);
        existingUser.lastLogin = new Date();
        await existingUser.save();

        // Generate tokens and session
        const sessionId = AuthService.generateSessionId();
        const tokens = AuthService.generateTokenPair(existingUser, sessionId);
        const session = AuthService.createSession(existingUser._id, sessionId, deviceInfo);

        return { user: existingUser, tokens, session, isNewUser: false };
      }

      // Create new user account
      const nameParts = profile.name.split(' ');
      const firstName = profile.firstName || nameParts[0] || 'User';
      const lastName = profile.lastName || nameParts.slice(1).join(' ') || 'Name';
      
      // Generate username from email (max 30 characters)
      const emailPrefix = profile.email.split('@')[0];
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      const username = (emailPrefix + '_' + timestamp).substring(0, 30);

      const oauthProvider: IOAuthProvider = {
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        linkedAt: new Date(),
      };

      const newUser = new User({
        username,
        email: profile.email,
        password: 'oauth_user_' + Date.now(), // Dummy password for OAuth users
        role: 'cashier', // Default role for OAuth users
        firstName,
        lastName,
        status: 'active',
        isApproved: false, // OAuth users need approval
        oauthProviders: [oauthProvider],
        lastLogin: new Date(),
      });

      await newUser.save();

      // Generate tokens and session
      const sessionId = AuthService.generateSessionId();
      const tokens = AuthService.generateTokenPair(newUser, sessionId);
      const session = AuthService.createSession(newUser._id, sessionId, deviceInfo);

      return { user: newUser, tokens, session, isNewUser: true };
    } catch (error) {
      console.error('OAuth login error:', error);
      throw new Error('OAuth authentication failed');
    }
  }

  /**
   * Unlink OAuth provider from user account
   */
  static async unlinkOAuthProvider(userId: string, provider: 'google' | 'facebook'): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.oauthProviders || user.oauthProviders.length === 0) {
        throw new Error('No OAuth providers linked');
      }

      // Check if user has password (can't unlink if it's the only auth method)
      const userWithPassword = await User.findById(userId).select('+password');
      if (!userWithPassword || userWithPassword.password.startsWith('oauth_user_')) {
        // Check if there are other OAuth providers
        const otherProviders = user.oauthProviders.filter(p => p.provider !== provider);
        if (otherProviders.length === 0) {
          throw new Error('Cannot unlink the only authentication method');
        }
      }

      // Remove the provider
      user.oauthProviders = user.oauthProviders.filter(p => p.provider !== provider);
      await user.save();

      return true;
    } catch (error) {
      console.error('Unlink OAuth provider error:', error);
      throw error;
    }
  }

  /**
   * Get user's linked OAuth providers
   */
  static async getUserOAuthProviders(userId: string): Promise<IOAuthProvider[]> {
    try {
      const user = await User.findById(userId).select('oauthProviders');
      return user?.oauthProviders || [];
    } catch (error) {
      console.error('Get OAuth providers error:', error);
      throw error;
    }
  }

  /**
   * Check if user can unlink OAuth provider
   */
  static async canUnlinkProvider(userId: string, provider: 'google' | 'facebook'): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password oauthProviders');
      if (!user) return false;

      // Check if user has password
      if (user.password && !user.password.startsWith('oauth_user_')) {
        return true; // Has password, can unlink
      }

      // Check if user has other OAuth providers
      const otherProviders = user.oauthProviders?.filter(p => p.provider !== provider) || [];
      return otherProviders.length > 0;
    } catch (error) {
      console.error('Check can unlink provider error:', error);
      return false;
    }
  }
}
