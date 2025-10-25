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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert - SmartGrocery</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #000000;
              background-color: #ececec;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fafaf9;
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }
            .header {
              text-align: center;
              padding: 32px 32px 24px;
            }
            .brand-text {
              font-size: 24px;
              font-weight: 700;
              color: #16a34a;
              text-align: center;
              margin-bottom: 16px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #000000;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            }
            .content {
              padding: 0 32px 32px;
            }
            .greeting {
              font-size: 16px;
              color: #000000;
              margin-bottom: 16px;
            }
            .instruction {
              color: #6b7280;
              margin-bottom: 16px;
              line-height: 1.5;
            }
            .info-box {
              background-color: #f0fdf4;
              border: 1px solid #16a34a;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #15803d;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .info-item {
              margin: 8px 0;
              color: #374151;
              font-size: 14px;
            }
            .info-item strong {
              color: #000000;
              display: inline-block;
              min-width: 100px;
            }
            .warning {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .warning-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 8px;
            }
            .warning-list {
              margin: 0;
              padding-left: 20px;
              font-size: 14px;
              line-height: 1.5;
              color: #92400e;
            }
            .success-note {
              background-color: #f0fdf4;
              border-left: 4px solid #16a34a;
              padding: 12px 16px;
              margin: 20px 0;
              color: #15803d;
              font-size: 14px;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 24px 32px;
              border-top: 1px solid #e5e7eb;
              background-color: #fafaf9;
            }
            .footer-brand {
              font-weight: 600;
              color: #000000;
              margin-bottom: 8px;
            }
            .footer-text {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="brand-text">SmartGrocery</div>
              <h1 class="title">Security Alert</h1>
              <p class="subtitle">New login detected on your account</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${user.username},</p>
              
              <p class="instruction">We detected a new login to your account from another device. For security reasons, your previous session has been automatically terminated.</p>
              
              <div class="info-box">
                <div class="info-box-title">New Login Details</div>
                <div class="info-item"><strong>IP Address:</strong> ${deviceInfo?.ip || 'Unknown'}</div>
                <div class="info-item"><strong>Device:</strong> ${deviceInfo?.userAgent || 'Unknown'}</div>
                <div class="info-item"><strong>Time:</strong> ${new Date().toLocaleString()}</div>
              </div>
              
              <div class="warning">
                <div class="warning-title"> If this was not you, please take action immediately:</div>
                <ul class="warning-list">
                  <li>Change your password immediately</li>
                  <li>Contact your system administrator</li>
                  <li>Review your recent account activity</li>
                  <li>Check for any unauthorized transactions</li>
                </ul>
              </div>
              
              <div class="success-note">
                ✓ If this was you logging in from a new device, you can safely ignore this message.
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-brand">SmartGrocery System</p>
              <p class="footer-text">This is an automated security notification to protect your account.</p>
              <p class="footer-text">If you have any questions, please contact your system administrator.</p>
            </div>
          </div>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert - SmartGrocery</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #000000;
              background-color: #ececec;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fafaf9;
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }
            .header {
              text-align: center;
              padding: 32px 32px 24px;
            }
            .brand-text {
              font-size: 24px;
              font-weight: 700;
              color: #16a34a;
              text-align: center;
              margin-bottom: 16px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #000000;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            }
            .content {
              padding: 0 32px 32px;
            }
            .greeting {
              font-size: 16px;
              color: #000000;
              margin-bottom: 16px;
            }
            .instruction {
              color: #6b7280;
              margin-bottom: 16px;
              line-height: 1.5;
            }
            .user-box {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .user-box-title {
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .user-item {
              margin: 8px 0;
              color: #374151;
              font-size: 14px;
            }
            .user-item strong {
              color: #000000;
              display: inline-block;
              min-width: 100px;
            }
            .info-box {
              background-color: #f0fdf4;
              border: 1px solid #16a34a;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #15803d;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .info-item {
              margin: 8px 0;
              color: #374151;
              font-size: 14px;
            }
            .info-item strong {
              color: #000000;
              display: inline-block;
              min-width: 100px;
            }
            .action-taken {
              background-color: #ecfdf5;
              border-left: 4px solid #16a34a;
              padding: 12px 16px;
              margin: 20px 0;
              color: #15803d;
              font-size: 14px;
              border-radius: 4px;
              font-weight: 500;
            }
            .footer {
              text-align: center;
              padding: 24px 32px;
              border-top: 1px solid #e5e7eb;
              background-color: #fafaf9;
            }
            .footer-brand {
              font-weight: 600;
              color: #000000;
              margin-bottom: 8px;
            }
            .footer-text {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="brand-text">SmartGrocery</div>
              <h1 class="title">Security Alert</h1>
              <p class="subtitle">Concurrent login detected and handled</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello Administrator,</p>
              
              <p class="instruction">A concurrent login has been detected and handled automatically by the system. The user's previous session has been terminated for security reasons.</p>
              
              <div class="user-box">
                <div class="user-box-title">Affected User</div>
                <div class="user-item"><strong>Username:</strong> ${user.username}</div>
                <div class="user-item"><strong>Email:</strong> ${user.email}</div>
                <div class="user-item"><strong>Role:</strong> ${user.role}</div>
              </div>
              
              <div class="info-box">
                <div class="info-box-title">New Login Details</div>
                <div class="info-item"><strong>IP Address:</strong> ${deviceInfo?.ip || 'Unknown'}</div>
                <div class="info-item"><strong>Device:</strong> ${deviceInfo?.userAgent || 'Unknown'}</div>
                <div class="info-item"><strong>Time:</strong> ${new Date().toLocaleString()}</div>
              </div>
              
              <div class="action-taken">
                ✓ Action Taken: All existing sessions for this user have been automatically terminated.
              </div>
              
              <p class="instruction">The affected user has been notified via email. No further action is required unless you suspect unauthorized access.</p>
            </div>
            
            <div class="footer">
              <p class="footer-brand">SmartGrocery System</p>
              <p class="footer-text">This is an automated security notification from the system.</p>
              <p class="footer-text">For security concerns, please review system logs and contact IT support if needed.</p>
            </div>
          </div>
        </body>
        </html>
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
