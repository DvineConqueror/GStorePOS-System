import { Server as SocketIOServer } from 'socket.io';

export class SocketService {
  private static io: SocketIOServer;

  static initialize(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Check if there are connected clients
   */
  static hasConnectedClients(): boolean {
    if (!this.io) return false;
    return this.io.engine.clientsCount > 0;
  }

  /**
   * Emit notification to all users with a specific role
   */
  static emitToRole(role: string, event: string, data: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    // Get room info for debugging
    const room = this.io.sockets.adapter.rooms.get(`role-${role}`);
    const memberCount = room?.size || 0;
    
    console.log(`📡 EMITTING TO ROLE: role-${role} (${memberCount} members) - Event: ${event}`, {
      role,
      event,
      memberCount,
      hasData: !!data
    });

    this.io.to(`role-${role}`).emit(event, data);
  }

  /**
   * Emit notification to all connected users
   */
  static emitToAll(event: string, data: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Emit new user registration notification
   */
  static emitNewUserRegistration(userData: any) {
    const notification = {
      type: 'new_user_registration',
      message: `New ${userData.role} registration: ${userData.firstName} ${userData.lastName}`,
      user: userData,
      timestamp: new Date().toISOString()
    };

    // Notify superadmins and managers
    this.emitToRole('superadmin', 'notification', notification);
    this.emitToRole('manager', 'notification', notification);
  }

  /**
   * Emit user approval notification
   */
  static emitUserApproval(userData: any, approvedBy: any) {
    const notification = {
      type: 'user_approval',
      message: `User ${userData.firstName} ${userData.lastName} has been ${userData.isApproved ? 'approved' : 'rejected'}`,
      user: userData,
      approvedBy: approvedBy,
      timestamp: new Date().toISOString()
    };

    // Notify superadmins and managers
    this.emitToRole('superadmin', 'notification', notification);
    this.emitToRole('manager', 'notification', notification);
  }

  /**
   * Emit pending approvals update
   */
  static emitPendingApprovalsUpdate(role: string, count: number) {
    const notification = {
      type: 'pending_approvals_update',
      count: count,
      timestamp: new Date().toISOString()
    };

    this.emitToRole(role, 'pending_approvals_update', notification);
  }

  /**
   * Emit analytics update to managers and superadmins
   */
  static emitAnalyticsUpdate(analyticsData: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    // Emit to managers and superadmins
    this.emitToRole('manager', 'analytics:update', analyticsData);
    this.emitToRole('superadmin', 'analytics:update', analyticsData);
    
  }

  /**
   * Emit cashier-specific analytics update
   */
  static emitCashierAnalyticsUpdate(cashierId: string, analyticsData: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    // Emit to specific cashier
    this.io.to(`user-${cashierId}`).emit('analytics:update', analyticsData);
    
    // Also emit to managers and superadmins for oversight
    this.emitToRole('manager', 'cashier:analytics:update', {
      cashierId,
      ...analyticsData
    });
    this.emitToRole('superadmin', 'cashier:analytics:update', {
      cashierId,
      ...analyticsData
    });
    
  }

  /**
   * Emit manager analytics update
   */
  static emitManagerAnalyticsUpdate(analyticsData: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    // Emit to managers and superadmins
    this.emitToRole('manager', 'manager:analytics:update', analyticsData);
    this.emitToRole('superadmin', 'manager:analytics:update', analyticsData);
    
  }

  /**
   * Emit transaction refund notification
   */
  static emitTransactionRefund(transactionData: any, refundedBy: string) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const notification = {
      type: 'transaction_refund',
      message: `Transaction ${transactionData.transactionNumber} has been refunded`,
      transaction: transactionData,
      refundedBy,
      timestamp: new Date().toISOString()
    };

    // Notify managers and superadmins
    this.emitToRole('manager', 'notification', notification);
    this.emitToRole('superadmin', 'notification', notification);
    
    // Notify the cashier who made the original transaction
    if (transactionData.cashierId) {
      this.io.to(`user-${transactionData.cashierId}`).emit('notification', notification);
    }
    
  }

  /**
   * Emit to specific user
   */
  static emitToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    this.io.to(`user-${userId}`).emit(event, data);
  }

  /**
   * Emit maintenance mode update to all users
   */
  static emitMaintenanceModeUpdate(data: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    updatedAt: Date;
  }) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    // Emit to all connected clients
    this.io.emit('system:maintenance', {
      type: 'maintenance_mode_update',
      data,
      timestamp: new Date().toISOString(),
    });

    console.log(`Maintenance mode ${data.maintenanceMode ? 'enabled' : 'disabled'} - notification sent to all users`);
  }

  /**
   * Emit low stock alert to managers and superadmins
   */
  static emitLowStockAlert(data: {
    products: any[];
    count: number;
    alertType: 'critical' | 'warning';
    timestamp?: Date;
  }) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const notification = {
      type: 'low_stock_alert',
      message: `${data.count} product(s) require immediate attention`,
      products: data.products,
      count: data.count,
      alertType: data.alertType,
      timestamp: data.timestamp?.toISOString() || new Date().toISOString()
    };

    // Notify managers and superadmins
    this.emitToRole('manager', 'notification', notification);
    this.emitToRole('superadmin', 'notification', notification);
    
    // Also emit a custom event for the frontend to update counts
    this.emitToRole('manager', 'lowStockUpdate', { count: data.count });
    this.emitToRole('superadmin', 'lowStockUpdate', { count: data.count });
  }

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
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

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
    this.emitToRole('manager', 'security_alert', securityNotification);
    this.emitToRole('superadmin', 'security_alert', securityNotification);

    // For session termination, also notify the affected user
    if (data.type === 'session_terminated') {
      this.emitToUser(data.userId, 'session_terminated', {
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
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const sessionNotification = {
      type: 'session_terminated',
      reason,
      message: this.getSessionTerminationMessage(reason),
      timestamp: new Date().toISOString(),
      requiresReauth: true
    };

    this.emitToUser(userId, 'session_terminated', sessionNotification);
    
    console.log(`Session termination notification sent to user ${userId} - reason: ${reason}`);
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
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

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
    this.emitToRole('superadmin', 'login_activity', loginNotification);
    
    console.log(`Login activity notification sent: user ${data.username} from ${data.ipAddress}`);
  }
}
