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
}
