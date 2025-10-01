import { Server as SocketIOServer } from 'socket.io';

export class SocketService {
  private static io: SocketIOServer;

  static initialize(io: SocketIOServer) {
    this.io = io;
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
    console.log(`Emitted ${event} to role-${role}:`, data);
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
    console.log(`Emitted ${event} to all users:`, data);
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
}
