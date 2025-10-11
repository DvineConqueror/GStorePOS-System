import { Server as SocketIOServer } from 'socket.io';

export class SocketConnectionService {
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
   * Emit to specific user
   */
  static emitToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    this.io.to(`user-${userId}`).emit(event, data);
  }
}
