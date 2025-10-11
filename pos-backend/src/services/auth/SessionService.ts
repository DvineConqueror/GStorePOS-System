import crypto from 'crypto';
import { ISession } from '../../types';

// In-memory session store (in production, use Redis)
const sessionStore = new Map<string, ISession>();
const SESSION_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class SessionService {
  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
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
    console.log(`SESSION CREATED: SessionID ${sessionId} for user ${userId}`);
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
