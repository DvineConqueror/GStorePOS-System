import { SocketConnectionService } from './SocketConnectionService';

export class SocketSecurityService {
  /**
   * Emit security alert notifications (suspicious login, concurrent sessions, etc.)
   */
  static emitSecurityAlert(data: {
    type: 'suspicious_login' | 'concurrent_login' | 'session_terminated';
    userId: string;
    username: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    timestamp?: string;
    message?: string;
    metadata?: any;
  }) {
    const securityNotification = {
      type: 'security_alert',
      alertType: data.type,
      severity: data.type === 'suspicious_login' ? 'high' : 'medium',
      userId: data.userId,
      username: data.username,
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      message: data.message,
      metadata: data.metadata,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Emit to managers and superadmins for security oversight
    SocketConnectionService.emitToRole('manager', 'security_alert', securityNotification);
    SocketConnectionService.emitToRole('superadmin', 'security_alert', securityNotification);

    // For session termination, also notify the affected user
    if (data.type === 'session_terminated') {
      SocketConnectionService.emitToUser(data.userId, 'session_terminated', {
        type: 'forced_logout',
        message: 'Your session has been terminated due to a new login from another device',
        timestamp: securityNotification.timestamp,
        metadata: data.metadata
      });
    }

    console.log(`Security alert emitted: ${data.type} for user ${data.username}`);
  }

  /**
   * Emit session termination notification to specific user
   */
  static emitSessionTermination(userId: string, reason: 'concurrent_login' | 'manual_logout' | 'security_breach') {
    const sessionNotification = {
      type: 'session_terminated',
      reason,
      message: this.getSessionTerminationMessage(reason),
      timestamp: new Date().toISOString(),
      requiresReauth: true
    };

    SocketConnectionService.emitToUser(userId, 'session_terminated', sessionNotification);
    
    console.log(`Session termination notification sent to user ${userId} - reason: ${reason}`);
  }

  /**
   * Emit login activity notification to admins
   */
  static emitLoginActivity(data: {
    userId: string;
    username: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    isNewDevice: boolean;
    timestamp?: string;
  }) {
    const loginNotification = {
      type: 'login_activity',
      userId: data.userId,
      username: data.username,
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isNewDevice: data.isNewDevice,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Emit to superadmins for comprehensive monitoring
    SocketConnectionService.emitToRole('superadmin', 'login_activity', loginNotification);
    
    console.log(`Login activity notification sent: user ${data.username} from ${data.ipAddress}`);
  }

  /**
   * Get appropriate message for session termination reason
   */
  private static getSessionTerminationMessage(reason: 'concurrent_login' | 'manual_logout' | 'security_breach'): string {
    switch (reason) {
      case 'concurrent_login':
        return 'Your session has been terminated due to a new login from another device. Please log in again.';
      case 'manual_logout':
        return 'You have been logged out. Please log in again.';
      case 'security_breach':
        return 'Your session has been terminated for security reasons. Please log in again.';
      default:
        return 'Your session has been terminated. Please log in again.';
    }
  }
}
