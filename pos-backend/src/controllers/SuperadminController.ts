import { Request, Response } from 'express';
import { SuperadminUserController } from './superadmin/SuperadminUserController';
import { SuperadminApprovalController } from './superadmin/SuperadminApprovalController';
import { SuperadminStatsController } from './superadmin/SuperadminStatsController';
import { SuperadminDeleteController } from './superadmin/SuperadminDeleteController';

export class SuperadminController {
  // User management methods
  static getAllUsers = SuperadminUserController.getAllUsers;
  static getPendingApprovals = SuperadminUserController.getPendingApprovals;
  static createManager = SuperadminUserController.createManager;

  // Approval methods
  static approveUser = SuperadminApprovalController.approveUser;
  static bulkApproveUsers = SuperadminApprovalController.bulkApproveUsers;

  // Statistics methods
  static getSystemStats = SuperadminStatsController.getSystemStats;

  // Delete methods
  static deleteUser = SuperadminDeleteController.deleteUser;
  static bulkDeleteUsers = SuperadminDeleteController.bulkDeleteUsers;
}