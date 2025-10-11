import { Request, Response, NextFunction } from 'express';

export class AuthorizationService {
  /**
   * Authorize user by roles
   */
  static authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
        return;
      }

      next();
    };
  }

  /**
   * Require manager or superadmin access
   */
  static requireManager = this.authorize('manager', 'superadmin');

  /**
   * Require admin access (backward compatibility)
   */
  static requireAdmin = this.authorize('manager', 'superadmin');

  /**
   * Require cashier access (cashiers, managers, and superadmins)
   */
  static requireCashier = this.authorize('cashier', 'manager', 'superadmin');
}
