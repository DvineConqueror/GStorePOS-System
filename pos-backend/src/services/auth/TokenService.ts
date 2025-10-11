import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, JWTPayload, RefreshTokenPayload, TokenPair } from '../../types';

// Token expiration times
const ACCESS_TOKEN_EXPIRE = '2h';
const REFRESH_TOKEN_EXPIRE = '7d';

export class TokenService {
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
      jwtid: crypto.randomUUID()
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
      jwtid: crypto.randomUUID()
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
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', {
        issuer: 'grocery-pos',
        audience: 'grocery-pos-client',
        algorithms: ['HS256']
      }) as JWTPayload;
      
      if (decoded.tokenType !== 'access') {
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
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
        issuer: 'grocery-pos',
        audience: 'grocery-pos-client',
        algorithms: ['HS256']
      }) as RefreshTokenPayload;
      
      if (decoded.tokenType !== 'refresh') {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Refresh token verification error:', error);
      return null;
    }
  }
}
