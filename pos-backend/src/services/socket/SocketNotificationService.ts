import { SocketConnectionService } from './SocketConnectionService';

export class SocketNotificationService {
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
    SocketConnectionService.emitToRole('superadmin', 'notification', notification);
    SocketConnectionService.emitToRole('manager', 'notification', notification);
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
    SocketConnectionService.emitToRole('superadmin', 'notification', notification);
    SocketConnectionService.emitToRole('manager', 'notification', notification);
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

    SocketConnectionService.emitToRole(role, 'pending_approvals_update', notification);
  }

  /**
   * Emit transaction refund notification
   */
  static emitTransactionRefund(transactionData: any, refundedBy: string) {
    const notification = {
      type: 'transaction_refund',
      message: `Transaction ${transactionData.transactionNumber} has been refunded`,
      transaction: transactionData,
      refundedBy,
      timestamp: new Date().toISOString()
    };

    // Notify managers and superadmins
    SocketConnectionService.emitToRole('manager', 'notification', notification);
    SocketConnectionService.emitToRole('superadmin', 'notification', notification);
    
    // Notify the cashier who made the original transaction
    if (transactionData.cashierId) {
      SocketConnectionService.emitToUser(transactionData.cashierId, 'notification', notification);
    }
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
    const notification = {
      type: 'low_stock_alert',
      message: `${data.count} product(s) require immediate attention`,
      products: data.products,
      count: data.count,
      alertType: data.alertType,
      timestamp: data.timestamp?.toISOString() || new Date().toISOString()
    };

    // Notify managers and superadmins
    SocketConnectionService.emitToRole('manager', 'notification', notification);
    SocketConnectionService.emitToRole('superadmin', 'notification', notification);
    
    // Also emit a custom event for the frontend to update counts
    SocketConnectionService.emitToRole('manager', 'lowStockUpdate', { count: data.count });
    SocketConnectionService.emitToRole('superadmin', 'lowStockUpdate', { count: data.count });
  }
}
