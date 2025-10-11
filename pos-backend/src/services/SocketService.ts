import { Server as SocketIOServer } from 'socket.io';
import { SocketConnectionService } from './socket/SocketConnectionService';
import { SocketNotificationService } from './socket/SocketNotificationService';
import { SocketAnalyticsService } from './socket/SocketAnalyticsService';
import { SocketSecurityService } from './socket/SocketSecurityService';
import { SocketSystemService } from './socket/SocketSystemService';

export class SocketService {
  static initialize(io: SocketIOServer) {
    SocketConnectionService.initialize(io);
  }

  /**
   * Check if there are connected clients
   */
  static hasConnectedClients(): boolean {
    return SocketConnectionService.hasConnectedClients();
  }

  /**
   * Emit notification to all users with a specific role
   */
  static emitToRole(role: string, event: string, data: any) {
    SocketConnectionService.emitToRole(role, event, data);
  }

  /**
   * Emit notification to all connected users
   */
  static emitToAll(event: string, data: any) {
    SocketConnectionService.emitToAll(event, data);
  }

  /**
   * Emit to specific user
   */
  static emitToUser(userId: string, event: string, data: any) {
    SocketConnectionService.emitToUser(userId, event, data);
  }

  // Notification methods
  static emitNewUserRegistration(userData: any) {
    SocketNotificationService.emitNewUserRegistration(userData);
  }

  static emitUserApproval(userData: any, approvedBy: any) {
    SocketNotificationService.emitUserApproval(userData, approvedBy);
  }

  static emitPendingApprovalsUpdate(role: string, count: number) {
    SocketNotificationService.emitPendingApprovalsUpdate(role, count);
  }

  static emitTransactionRefund(transactionData: any, refundedBy: string) {
    SocketNotificationService.emitTransactionRefund(transactionData, refundedBy);
  }

  static emitLowStockAlert(data: {
    products: any[];
    count: number;
    alertType: 'critical' | 'warning';
    timestamp?: Date;
  }) {
    SocketNotificationService.emitLowStockAlert(data);
  }

  // Analytics methods
  static emitAnalyticsUpdate(analyticsData: any) {
    SocketAnalyticsService.emitAnalyticsUpdate(analyticsData);
  }

  static emitCashierAnalyticsUpdate(cashierId: string, analyticsData: any) {
    SocketAnalyticsService.emitCashierAnalyticsUpdate(cashierId, analyticsData);
  }

  static emitManagerAnalyticsUpdate(analyticsData: any) {
    SocketAnalyticsService.emitManagerAnalyticsUpdate(analyticsData);
  }

  // Security methods
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
    SocketSecurityService.emitSecurityAlert(data);
  }

  static emitSessionTermination(userId: string, reason: 'concurrent_login' | 'manual_logout' | 'security_breach') {
    SocketSecurityService.emitSessionTermination(userId, reason);
  }

  static emitLoginActivity(data: {
    userId: string;
    username: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    isNewDevice: boolean;
    timestamp?: string;
  }) {
    SocketSecurityService.emitLoginActivity(data);
  }

  // System methods
  static emitMaintenanceModeUpdate(data: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    updatedAt: Date;
  }) {
    SocketSystemService.emitMaintenanceModeUpdate(data);
  }
}
