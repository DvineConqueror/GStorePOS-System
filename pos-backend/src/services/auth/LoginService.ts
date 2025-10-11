import { User } from '../../models/User';
import { IUser } from '../../types';
import { TokenService } from './TokenService';
import { SessionService } from './SessionService';
import { SocketService } from '../SocketService';
import { EmailService } from '../email/EmailService';
import { NotificationDeliveryService } from '../notification/NotificationDeliveryService';

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
    
    console.log(`LoginService: Checking concurrent sessions for user ${user._id}`);
    console.log(`LoginService: Found ${existingSessionCount} existing sessions`);
    
    if (existingSessionCount > 0) {
      console.log(`LoginService: Existing sessions:`, existingSessions.map(s => ({
        sessionId: s.sessionId,
        isActive: s.isActive,
        lastActivity: s.lastActivity
      })));
      
      // Notify existing sessions via WebSocket BEFORE deactivating them
      existingSessions.forEach(existingSession => {
        console.log(`LoginService: Processing session ${existingSession.sessionId}, isActive: ${existingSession.isActive}`);
        if (existingSession.isActive) {
          console.log(`LoginService: Emitting session_terminated to user ${user._id} for session ${existingSession.sessionId}`);
          SocketService.emitToUser(user._id.toString(), 'session_terminated', {
            type: 'concurrent_login',
            message: 'Your session has been terminated due to a new login from another device',
            timestamp: new Date().toISOString(),
            metadata: {
              newDeviceInfo: deviceInfo
            }
          });
        } else {
          console.log(`LoginService: Skipping inactive session ${existingSession.sessionId}`);
        }
      });

      // Now deactivate all sessions
      const loggedOutCount = SessionService.deactivateAllUserSessions(user._id.toString());

      // Send email notification to the affected user
      await this.sendConcurrentLoginEmailToUser(user, deviceInfo);

      // Send email notification to superadmin
      await this.sendConcurrentLoginEmailToSuperadmin(user, deviceInfo);

      console.log(`Forced logout: ${loggedOutCount} existing sessions terminated for user ${user.username}`);
    } else {
      console.log(`LoginService: No existing sessions found for user ${user._id}`);
    }
  }

  /**
   * Send concurrent login email notification to the affected user
   */
  private static async sendConcurrentLoginEmailToUser(
    user: IUser,
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<void> {
    try {
      const subject = 'Security Alert: New Login Detected';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert: New Login Detected</h2>
          <p>Hello ${user.username},</p>
          <p>We detected a new login to your account from another device. For security reasons, your previous session has been terminated.</p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #92400e; margin: 0 0 8px 0;">New Login Details:</h3>
            <p style="margin: 4px 0;"><strong>IP Address:</strong> ${deviceInfo?.ip || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Device:</strong> ${deviceInfo?.userAgent || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>If this was not you, please:</p>
          <ul>
            <li>Change your password immediately</li>
            <li>Contact your system administrator</li>
            <li>Review your account activity</li>
          </ul>
          
          <p>If this was you, you can safely ignore this message.</p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated security notification from your POS system.
          </p>
        </div>
      `;

      await NotificationDeliveryService.sendEmailNotification(
        user.email,
        subject,
        html
      );

      console.log(`Concurrent login email sent to user: ${user.email}`);
    } catch (error) {
      console.error('Failed to send concurrent login email to user:', error);
    }
  }

  /**
   * Send concurrent login email notification to superadmin
   */
  private static async sendConcurrentLoginEmailToSuperadmin(
    user: IUser,
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<void> {
    try {
      // Find superadmin users
      const superadmins = await User.find({ role: 'superadmin', status: 'active' });
      
      if (superadmins.length === 0) {
        console.log('No superadmin users found for concurrent login notification');
        return;
      }

      const subject = 'Security Alert: Concurrent Login Detected';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Security Alert: Concurrent Login Detected</h2>
          <p>A concurrent login has been detected and handled automatically.</p>
          
          <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #374151; margin: 0 0 8px 0;">Affected User:</h3>
            <p style="margin: 4px 0;"><strong>Username:</strong> ${user.username}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0;"><strong>Role:</strong> ${user.role}</p>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #92400e; margin: 0 0 8px 0;">New Login Details:</h3>
            <p style="margin: 4px 0;"><strong>IP Address:</strong> ${deviceInfo?.ip || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Device:</strong> ${deviceInfo?.userAgent || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p><strong>Action Taken:</strong> All existing sessions for this user have been terminated.</p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated security notification from your POS system.
          </p>
        </div>
      `;

      // Send to all superadmins
      for (const superadmin of superadmins) {
        await NotificationDeliveryService.sendEmailNotification(
          superadmin.email,
          subject,
          html
        );
      }

      console.log(`Concurrent login email sent to ${superadmins.length} superadmin(s)`);
    } catch (error) {
      console.error('Failed to send concurrent login email to superadmin:', error);
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
