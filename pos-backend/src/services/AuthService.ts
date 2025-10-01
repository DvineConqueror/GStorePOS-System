import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { IUser, JWTPayload, RefreshTokenPayload, ISession, TokenPair } from '../types';

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

    return jwt.sign(payload, process.env.JWT_SECRET!, {
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

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
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
      if (session.userId === userId && session.isActive && new Date() <= session.expiresAt) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Deactivate all sessions for a user
   */
  static deactivateAllUserSessions(userId: string): number {
    let count = 0;
    
    for (const session of sessionStore.values()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        count++;
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
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

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
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
   * Login user and create session
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

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate session ID
    const sessionId = this.generateSessionId();

    // Create session
    const session = this.createSession(user._id, sessionId, deviceInfo);

    // Generate tokens
    const tokens = this.generateTokenPair(user, sessionId);

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
}
