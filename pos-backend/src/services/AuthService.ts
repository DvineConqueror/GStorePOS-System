import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { IUser, JWTPayload, RefreshTokenPayload, ISession, TokenPair } from '../types';
import { EmailService } from './EmailService';
import { SocketService } from './SocketService';
import notificationService from './NotificationService';

// In-memory session store (in production, use Redis)
const sessionStore = new Map<string, ISession>();
const blacklistedTokens = new Set<string>();

// Token expiration times
const ACCESS_TOKEN_EXPIRE = '2h'; // 2 hours (extended for development)
const REFRESH_TOKEN_EXPIRE = '7d'; // 7 days
const SESSION_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class AuthService {
  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate access token with enhanced security
   */
  static generateAccessToken(user: IUser, sessionId: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user._id,
      username: user.username,
      role: user.role,
      sessionId,
      tokenType: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret-key', {
      expiresIn: ACCESS_TOKEN_EXPIRE,
      issuer: 'grocery-pos',
      audience: 'grocery-pos-client',
      algorithm: 'HS256',
      jwtid: crypto.randomUUID() // Unique JWT ID for tracking
    });
  }

  /**
   * Generate refresh token with enhanced security
   */
  static generateRefreshToken(userId: string, sessionId: string): string {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      sessionId,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
      expiresIn: REFRESH_TOKEN_EXPIRE,
      issuer: 'grocery-pos',
      audience: 'grocery-pos-client',
      algorithm: 'HS256',
      jwtid: crypto.randomUUID() // Unique JWT ID for tracking
    });
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(user: IUser, sessionId: string): TokenPair {
    const accessToken = this.generateAccessToken(user, sessionId);
    const refreshToken = this.generateRefreshToken(user._id, sessionId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Create a new session
   */
  static createSession(
    userId: string, 
    sessionId: string, 
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): ISession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRE);

    const session: ISession = {
      sessionId,
      userId,
      deviceInfo,
      isActive: true,
      lastActivity: now,
      createdAt: now,
      expiresAt
    };

    sessionStore.set(sessionId, session);
    console.log(`SESSION CREATED: SessionID ${sessionId} for user ${userId}`, {
      sessionId,
      userId,
      deviceInfo,
      totalSessionsInStore: sessionStore.size
    });
    return session;
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): ISession | null {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      sessionStore.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Update session activity
   */
  static updateSessionActivity(sessionId: string): boolean {
    const session = sessionStore.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = new Date();
    return true;
  }

  /**
   * Deactivate session
   */
  static deactivateSession(sessionId: string): boolean {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.isActive = false;
    return true;
  }

  /**
   * Remove session
   */
  static removeSession(sessionId: string): boolean {
    return sessionStore.delete(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  static getUserSessions(userId: string): ISession[] {
    const sessions: ISession[] = [];
    
    for (const session of sessionStore.values()) {
      // Convert userId to string for comparison (in case it was stored as ObjectId)
      const sessionUserId = session.userId;
      if (sessionUserId === userId && session.isActive && new Date() <= session.expiresAt) {
        sessions.push(session);
      }
    }

    console.log(`🔍 FOUND ${sessions.length} active sessions for user ${userId}`, {
      userId,
      totalSessionsInStore: sessionStore.size,
      allSessions: Array.from(sessionStore.values()).map(s => ({
        sessionId: s.sessionId,
        userId: s.userId,
        isActive: s.isActive,
        matchesUser: s.userId === userId
      }))
    });

    return sessions;
  }

  /**
   * Deactivate all sessions for a user
   */
  static deactivateAllUserSessions(userId: string): number {
    let count = 0;
    
    for (const session of sessionStore.values()) {
      // Compare userId directly (should be string)
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        count++;
        console.log(`🔒 DEACTIVATED session ${session.sessionId} for user ${userId}`);
      }
    }

    return count;
  }

  /**
   * Clean up expired sessions
   */
  static cleanupExpiredSessions(): number {
    const now = new Date();
    let count = 0;
    
    for (const [sessionId, session] of sessionStore.entries()) {
      if (now > session.expiresAt) {
        sessionStore.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  /**
   * Blacklist a token
   */
  static blacklistToken(token: string): void {
    blacklistedTokens.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return blacklistedTokens.has(token);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        return null;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', {
        issuer: 'grocery-pos',
        audience: 'grocery-pos-client',
        algorithms: ['HS256']
      }) as JWTPayload;
      
      // Verify token type
      if (decoded.tokenType !== 'access') {
        return null;
      }

      // Check if session is still active
      const session = this.getSession(decoded.sessionId);
      if (!session || !session.isActive) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        return null;
      }

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
        issuer: 'grocery-pos',
        audience: 'grocery-pos-client',
        algorithms: ['HS256']
      }) as RefreshTokenPayload;
      
      // Verify token type
      if (decoded.tokenType !== 'refresh') {
        return null;
      }

      // Check if session is still active
      const session = this.getSession(decoded.sessionId);
      if (!session || !session.isActive) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Refresh token verification error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token with rotation
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return null;
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.status !== 'active' || user.isApproved === false) {
      return null;
    }

    // Blacklist the old refresh token for rotation
    this.blacklistToken(refreshToken);

    // Generate new token pair with rotation
    const newAccessToken = this.generateAccessToken(user, decoded.sessionId);
    const newRefreshToken = this.generateRefreshToken(user._id, decoded.sessionId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // New refresh token
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Login user and create session with concurrent session detection and security monitoring
   */
  static async loginUser(
    emailOrUsername: string, 
    password: string,
    deviceInfo?: { userAgent: string; ip: string; platform?: string }
  ): Promise<{ user: IUser; tokens: TokenPair; session: ISession } | null> {
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

    // **CONCURRENT SESSION DETECTION - Force Single Session (Most Secure)**
    const existingSessions = this.getUserSessions(user._id.toString());
    const existingSessionCount = existingSessions.length;
    
    console.log(`SESSION CHECK: User ${user.username} has ${existingSessionCount} existing sessions`, {
      userId: user._id,
      username: user.username,
      existingSessions: existingSessions.map(s => ({
        sessionId: s.sessionId,
        isActive: s.isActive,
        createdAt: s.createdAt,
        deviceInfo: s.deviceInfo
      })),
      totalSessionsInStore: sessionStore.size
    });

    // Force logout all existing sessions for single session enforcement
    if (existingSessionCount > 0) {
      const loggedOutCount = this.deactivateAllUserSessions(user._id.toString());
      
      // Notify existing sessions via WebSocket that a user tried to login with their account
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

      console.log(`Forced logout: ${loggedOutCount} existing sessions terminated for user ${user.username} (${user._id})`);

      // Send email alerts to all superadmins and managers about concurrent session detection
      await this.sendConcurrentSessionAlertToAdmins(user, deviceInfo, existingSessionCount);
    }

    // **SUSPICIOUS LOGIN DETECTION**
    if (deviceInfo && existingSessions.length > 0) {
      const lastSession = existingSessions[existingSessions.length - 1];
      
      if (lastSession && lastSession.deviceInfo) {
        const timeDiff = Date.now() - lastSession.createdAt.getTime();
        const isDifferentIP = lastSession.deviceInfo.ip !== deviceInfo.ip;
        const isRecentLogin = timeDiff < 5 * 60 * 1000; // 5 minutes
        
        if (isDifferentIP && isRecentLogin) {
          // Suspicious login detected - different IP within 5 minutes
          console.warn(`SUSPICIOUS LOGIN: User ${user.username} logged in from different IP within 5 minutes`, {
            userId: user._id,
            previousIP: lastSession.deviceInfo.ip,
            newIP: deviceInfo.ip,
            previousUserAgent: lastSession.deviceInfo.userAgent,
            newUserAgent: deviceInfo.userAgent,
            timeDifference: Math.round(timeDiff / 1000) + ' seconds'
          });

          // Send security alert email to user
          await this.sendSecurityAlert(user, deviceInfo, 'suspicious_login');
          
          // Send email alerts to all superadmins and managers about suspicious login
          await this.sendSuspiciousLoginAlertToAdmins(user, deviceInfo, lastSession.deviceInfo, timeDiff);
        }
      }
    }

    // **SEND LOGIN NOTIFICATIONS**
    // If there were existing sessions (user logged in from new device)
    if (existingSessionCount > 0 && deviceInfo) {
      await this.sendSecurityAlert(user, deviceInfo, 'new_login');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate session ID
    const sessionId = this.generateSessionId();

    // Create session
    const session = this.createSession(user._id.toString(), sessionId, deviceInfo);

    // Generate tokens
    const tokens = this.generateTokenPair(user, sessionId);

    // Log successful login
    console.log(`LOGIN SUCCESS: User ${user.username} (${user._id}) logged in from ${deviceInfo?.ip || 'unknown IP'}`, {
      userId: user._id,
      username: user.username,
      ip: deviceInfo?.ip,
      userAgent: deviceInfo?.userAgent,
      sessionId,
      terminatedSessions: existingSessionCount
    });

    return {
      user: user.toObject(),
      tokens,
      session
    };
  }

  /**
   * Logout user and invalidate session
   */
  static async logoutUser(sessionId: string, accessToken?: string): Promise<boolean> {
    // Blacklist access token if provided
    if (accessToken) {
      this.blacklistToken(accessToken);
    }

    // Deactivate session
    return this.deactivateSession(sessionId);
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<number> {
    return this.deactivateAllUserSessions(userId);
  }

  /**
   * Send security alert email for login notifications
   */
  static async sendSecurityAlert(
    user: IUser, 
    deviceInfo: { userAgent: string; ip: string; platform?: string },
    alertType: 'new_login' | 'suspicious_login'
  ): Promise<void> {
    try {
      const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:8080';
      const subject = alertType === 'suspicious_login' 
        ? 'Suspicious Login Alert - SmartGrocery'
        : 'New Login Alert - SmartGrocery';
      
      const alertTypeText = alertType === 'suspicious_login' ? 'Suspicious login' : 'New login';
      const severityClass = alertType === 'suspicious_login' ? 'alert-danger' : 'alert-info';

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
              max-width: 448px;
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
            .alert-icon {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              font-size: 32px;
              ${alertType === 'suspicious_login' 
                ? 'background-color: #fef2f2; color: #dc2626;' 
                : 'background-color: #f3f4f6; color: #059669;'
              }
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
            .alert-info {
              background-color: ${alertType === 'suspicious_login' 
                ? '#fef3c7; border-left: 4px solid #f59e0b;' 
                : '#dbeafe; border-left: 4px solid #3b82f6;'
              }
              padding: 16px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .alert-info h3 {
              margin-bottom: 8px;
              color: ${alertType === 'suspicious_login' ? '#92400e' : '#1e40af'};
              font-size: 16px;
            }
            .device-info {
              background-color: #f3f4f6;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 16px;
              margin: 16px 0;
            }
            .device-info h4 {
              margin-bottom: 12px;
              color: #374151;
              font-size: 14px;
              font-weight: 600;
            }
            .device-info p {
              margin-bottom: 8px;
              font-size: 14px;
              color: #6b7280;
            }
            .footer {
              text-align: center;
              padding: 24px 32px;
              border-top: 1px solid #e5e7eb;
              background-color: #fafaf9;
            }
            .brand-text {
              font-size: 20px;
              font-weight: 700;
              color: #16a34a;
              margin-bottom: 8px;
            }
            .footer-text {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .security-tips {
              background-color: #f0f9ff;
              border: 1px solid #bae6fd;
              border-radius: 6px;
              padding: 16px;
              margin: 20px 0;
            }
            .security-tips h4 {
              color: #0369a1;
              margin-bottom: 8px;
            }
            .security-tips ul {
              margin: 0;
              padding-left: 20px;
              font-size: 14px;
              color: #1e40af;
            }
            .security-tips li {
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="brand-text">SmartGrocery</div>
              <h1 class="title">Security Alert</h1>
              <p class="subtitle">Login activity detected for ${user.email}</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
              
              <div class="alert-info">
                <h3>${alertType === 'suspicious_login' ? '🚨 Potential Security Risk' : '🔐 Login Confirmation'}</h3>
                <p>A ${alertTypeText.toLowerCase()} was detected on your SmartGrocery POS account.</p>
                ${alertType === 'suspicious_login' 
                  ? `<p><strong>This login appears suspicious and requires immediate attention:</strong></p>
                     <ul style="margin-top: 8px;">
                       <li>The login occurred from a different IP address</li>
                       <li>Multiple login attempts within a short timeframe</li>
                       <li>If this was not you, please secure your account immediately</li>
                     </ul>`
                  : `<p>This is a normal security notification to keep you informed about account activity.</p>`
                }
              </div>
              
              <div class="device-info">
                <h4>Login Details</h4>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${deviceInfo.ip}</p>
                <p><strong>Device:</strong> ${deviceInfo.userAgent}</p>
                <p><strong>Location:</strong> ${await this.getLocationFromIP(deviceInfo.ip)}</p>
              </div>
              
              ${alertType === 'suspicious_login' ? `
              <div class="security-tips">
                <h4>Immediate Actions Required</h4>
                <ul>
                  <li>If this login was not authorized, change your password immediately</li>
                  <li>Review your recent account activity</li>
                  <li>Consider enabling additional security measures</li>
                  <li>Contact support if you believe your account has been compromised</li>
                </ul>
              </div>
              ` : '' }
              
              <div style="text-align: center; margin-top: 24px;">
                <a href="${clientUrl}/login" style="
                  display: inline-block;
                  background-color: #16a34a;
                  color: #ffffff;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                ">Access Your Account</a>
              </div>
            </div>
            
            <div class="footer">
              <div class="brand-text">SmartGrocery POS System</div>
              <p class="footer-text">This email was sent from our secure monitoring service.</p>
              <p class="footer-text">For security reasons, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
SmartGrocery Security Alert

Hello ${user.firstName} ${user.lastName},

A ${alertTypeText.toLowerCase()} was detected on your SmartGrocery POS account.

Login Details:
- Time: ${new Date().toLocaleString()}
- IP Address: ${deviceInfo.ip}
- Device: ${deviceInfo.userAgent}

${alertType === 'suspicious_login' ? `
POTENTIAL SECURITY RISK:
This login appears suspicious and requires immediate attention.
If this login was not authorized, please:
1. Change your password immediately
2. Review your recent account activity
3. Contact support if you believe your account has been compromised
` : `
This is a normal security notification to keep you informed about account activity.
If you did not authorize this login, please secure your account immediately.
`}

For additional security:
- Use strong, unique passwords
- Keep your devices secure
- Never share your login credentials

This email was sent from SmartGrocery POS System Security Monitoring.
For support, contact our support team.

This is an automated message. Please do not reply to this email.
      `.trim();

      await EmailService.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });

      console.log(`Security alert email sent to ${user.email} for ${alertType}`);
    } catch (error) {
      console.error('Failed to send security alert email:', error);
    }
  }

  /**
   * Get location information from IP address (placeholder implementation)
   */
  private static async getLocationFromIP(ip: string): Promise<string> {
    // In a real implementation, you would use a service like ipapi.co or ipinfo.io
    // For now, return a placeholder based on common IP patterns
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'Local Network';
    }
    if (ip.startsWith('::1') || ip === 'localhost') {
      return 'Localhost';
    }
    return 'Unknown Location';
  }

  /**
   * Get session statistics
   */
  static getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    const now = new Date();
    let totalSessions = 0;
    let activeSessions = 0;
    let expiredSessions = 0;

    for (const session of sessionStore.values()) {
      totalSessions++;
      
      if (now > session.expiresAt) {
        expiredSessions++;
      } else if (session.isActive) {
        activeSessions++;
      }
    }

    return {
      totalSessions,
      activeSessions,
      expiredSessions
    };
  }

  /**
   * Send concurrent session alert emails to all admins
   */
  static async sendConcurrentSessionAlertToAdmins(
    user: IUser,
    deviceInfo: { userAgent: string; ip: string; platform?: string },
    sessionCount: number
  ): Promise<void> {
    try {
      // Get all superadmins and managers
      const adminUsers = await User.find({
        role: { $in: ['superadmin', 'manager'] },
        status: 'active',
        isApproved: true
      }).select('email firstName lastName role');

      if (adminUsers.length === 0) {
        console.log('No admin users found to send concurrent session alerts');
        return;
      }

      const currentTime = new Date().toLocaleString();
      const subject = `🚨 SECURITY ALERT: Concurrent Session Detected - ${user.username}`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Concurrent Session Detected</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #dc2626; margin-top: 0;">Concurrent Login Detected</h2>
            <p><strong>A user has logged in from a new device while already having an active session.</strong></p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #374151;">User Information:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Username:</strong> ${user.username}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role.toUpperCase()}</li>
                <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
              </ul>
            </div>

            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #374151;">Login Details:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>IP Address:</strong> ${deviceInfo.ip}</li>
                <li><strong>Device:</strong> ${deviceInfo.userAgent}</li>
                <li><strong>Time:</strong> ${currentTime}</li>
                <li><strong>Previous Sessions Terminated:</strong> ${sessionCount}</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #92400e;">⚠️ Action Taken</h3>
              <p style="margin: 0;">All previous sessions for this user have been automatically terminated for security.</p>
            </div>

            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">🔧 Recommended Actions</h3>
              <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>Review the user's account for any suspicious activity</li>
                <li>Contact the user to verify this login was legitimate</li>
                <li>Consider temporarily disabling the account if suspicious</li>
                <li>Monitor for additional security events</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">SmartGrocery POS Security System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">This is an automated security notification</p>
          </div>
        </div>
      `;

      // Send email to all admins
      for (const admin of adminUsers) {
        try {
          await EmailService.sendEmail({
            to: admin.email,
            subject: subject,
            html: emailBody,
            text: `SECURITY ALERT: Concurrent session detected for user ${user.username} (${user.email}). ${sessionCount} existing session(s) were terminated. IP: ${deviceInfo.ip}. Time: ${currentTime}. Please review this activity and take appropriate action.`
          });

          console.log(`✉️ Concurrent session alert sent to ${admin.role} ${admin.email}`);
        } catch (emailError) {
          console.error(`Failed to send concurrent session alert to ${admin.email}:`, emailError);
        }
      }

      console.log(`📧 Concurrent session alerts sent to ${adminUsers.length} admin(s) for user ${user.username}`);
    } catch (error) {
      console.error('Failed to send concurrent session alerts to admins:', error);
    }
  }

  /**
   * Send suspicious login alert emails to all admins
   */
  static async sendSuspiciousLoginAlertToAdmins(
    user: IUser,
    newDeviceInfo: { userAgent: string; ip: string; platform?: string },
    previousDeviceInfo: { userAgent: string; ip: string; platform?: string },
    timeDiff: number
  ): Promise<void> {
    try {
      // Get all superadmins and managers
      const adminUsers = await User.find({
        role: { $in: ['superadmin', 'manager'] },
        status: 'active',
        isApproved: true
      }).select('email firstName lastName role');

      if (adminUsers.length === 0) {
        console.log('No admin users found to send suspicious login alerts');
        return;
      }

      const currentTime = new Date().toLocaleString();
      const timeDiffMinutes = Math.round(timeDiff / (1000 * 60));
      const subject = `🚨 SECURITY ALERT: Suspicious Login Pattern - ${user.username}`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Suspicious Login Pattern Detected</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #dc2626; margin-top: 0;">Suspicious Login Activity</h2>
            <p><strong>A user logged in from a different IP address within ${timeDiffMinutes} minute(s) of their previous login.</strong></p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #374151;">User Information:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Username:</strong> ${user.username}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role.toUpperCase()}</li>
                <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
              </ul>
            </div>

            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #374151;">Previous Login:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>IP Address:</strong> ${previousDeviceInfo.ip}</li>
                <li><strong>Device:</strong> ${previousDeviceInfo.userAgent}</li>
              </ul>
            </div>

            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #374151;">New Login:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>IP Address:</strong> ${newDeviceInfo.ip}</li>
                <li><strong>Device:</strong> ${newDeviceInfo.userAgent}</li>
                <li><strong>Time:</strong> ${currentTime}</li>
                <li><strong>Time Difference:</strong> ${timeDiffMinutes} minute(s)</li>
              </ul>
            </div>

            <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">🔴 Potential Security Risk</h3>
              <p style="margin: 0;">This rapid change in location/device could indicate:</p>
              <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>Account compromise</li>
                <li>Credential theft</li>
                <li>Unauthorized access attempt</li>
              </ul>
            </div>

            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">🔧 Immediate Actions Recommended</h3>
              <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li><strong>URGENT:</strong> Contact the user immediately to verify the login</li>
                <li>Consider temporarily disabling the account</li>
                <li>Force password reset if compromise suspected</li>
                <li>Review account activity logs</li>
                <li>Monitor for additional suspicious activity</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">SmartGrocery POS Security System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">This is an automated security notification</p>
          </div>
        </div>
      `;

      // Send email to all admins
      for (const admin of adminUsers) {
        try {
          await EmailService.sendEmail({
            to: admin.email,
            subject: subject,
            html: emailBody,
            text: `SECURITY ALERT: Suspicious login pattern for user ${user.username} (${user.email}). User logged in from IP ${newDeviceInfo.ip} within ${timeDiffMinutes} minutes of previous login from ${previousDeviceInfo.ip}. Time: ${currentTime}. URGENT: Please investigate immediately.`
          });

          console.log(`✉️ Suspicious login alert sent to ${admin.role} ${admin.email}`);
        } catch (emailError) {
          console.error(`Failed to send suspicious login alert to ${admin.email}:`, emailError);
        }
      }

      console.log(`📧 Suspicious login alerts sent to ${adminUsers.length} admin(s) for user ${user.username}`);
    } catch (error) {
      console.error('Failed to send suspicious login alerts to admins:', error);
    }
  }
}
