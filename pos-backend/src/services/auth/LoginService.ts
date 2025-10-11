import { User } from '../../models/User';
import { IUser } from '../../types';
import { TokenService } from './TokenService';
import { SessionService } from './SessionService';
import { SocketService } from '../SocketService';

export class LoginService {
  /**
   * Login user and create session with concurrent session detection
   */
  static async loginUser(
    emailOrUsername: string, 
    password: string,
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<{ user: IUser; tokens: any; session: any } | null> {
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ],
      status: 'active'
    }).select('+password');

    if (!user) {
      return null;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return null;
    }

    // Check if user is approved
    if (user.isApproved === false) {
      return null;
    }

    // Handle concurrent sessions
    await this.handleConcurrentSessions(user, deviceInfo);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate session ID
    const sessionId = SessionService.generateSessionId();

    // Create session
    const session = SessionService.createSession(user._id.toString(), sessionId, deviceInfo);

    // Generate tokens
    const tokens = TokenService.generateTokenPair(user, sessionId);

    console.log(`LOGIN SUCCESS: User ${user.username} (${user._id}) logged in from ${deviceInfo?.ip || 'unknown IP'}`);

    return {
      user: user.toObject(),
      tokens,
      session
    };
  }

  /**
   * Handle concurrent session detection and termination
   */
  private static async handleConcurrentSessions(
    user: IUser, 
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<void> {
    const existingSessions = SessionService.getUserSessions(user._id.toString());
    const existingSessionCount = existingSessions.length;
    
    if (existingSessionCount > 0) {
      const loggedOutCount = SessionService.deactivateAllUserSessions(user._id.toString());
      
      // Notify existing sessions via WebSocket
      existingSessions.forEach(existingSession => {
        if (existingSession.isActive) {
          SocketService.emitToUser(user._id.toString(), 'session_terminated', {
            type: 'concurrent_login',
            message: 'Your session has been terminated due to a new login from another device',
            timestamp: new Date().toISOString(),
            newDeviceInfo: deviceInfo
          });
        }
      });

      console.log(`Forced logout: ${loggedOutCount} existing sessions terminated for user ${user.username}`);
    }
  }

  /**
   * Logout user and invalidate session
   */
  static async logoutUser(sessionId: string): Promise<boolean> {
    return SessionService.deactivateSession(sessionId);
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<number> {
    return SessionService.deactivateAllUserSessions(userId);
  }
}
