import { User } from '../../models/User';
import { IUser } from '../../types';
import { TokenService } from './TokenService';
import { SessionService } from './SessionService';

export class AuthService {
  /**
   * Verify access token and check session
   */
  static verifyAccessToken(token: string): any | null {
    const decoded = TokenService.verifyAccessToken(token);
    
    if (!decoded) {
      return null;
    }

    // Check if session is still active
    const session = SessionService.getSession(decoded.sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    return decoded;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<any | null> {
    const decoded = TokenService.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return null;
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.status !== 'active' || user.isApproved === false) {
      return null;
    }

    // Generate new token pair
    const newAccessToken = TokenService.generateAccessToken(user, decoded.sessionId);
    const newRefreshToken = TokenService.generateRefreshToken(user._id, decoded.sessionId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(token: string): Promise<IUser | null> {
    const decoded = this.verifyAccessToken(token);
    
    if (!decoded) {
      return null;
    }

    const user = await User.findById(decoded.userId).select('-password');
    return user;
  }

  /**
   * Blacklist a token
   */
  static blacklistToken(token: string): void {
    // This would be implemented with a token blacklist store
    // For now, we'll rely on session management
    console.log('Token blacklisted:', token.substring(0, 8) + '...');
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<number> {
    return SessionService.deactivateAllUserSessions(userId);
  }

  /**
   * Get all active sessions for a user
   */
  static getUserSessions(userId: string): any[] {
    return SessionService.getUserSessions(userId);
  }

  /**
   * Cleanup expired sessions
   */
  static cleanupExpiredSessions(): number {
    return SessionService.cleanupExpiredSessions();
  }

  /**
   * Get session statistics
   */
  static getSessionStats(): { totalSessions: number; activeSessions: number; expiredSessions: number; } {
    return SessionService.getSessionStats();
  }
}
