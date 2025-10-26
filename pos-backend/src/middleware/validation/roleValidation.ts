import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { ErrorResponse } from '../../utils/errorResponse';

/**
 * Role validation middleware
 * Validates user roles before authentication
 */
export class RoleValidation {
  /**
   * Validate login mode matches user role
   * This middleware runs BEFORE authentication to check if the user
   * is trying to login with the correct mode (admin vs cashier)
   */
  static async validateLoginMode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { emailOrUsername, loginMode } = req.body;

      if (!emailOrUsername || !loginMode) {
        next();
        return;
      }

      // Find user by email/username to check their role (without password validation)
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }).select('role username email');

      if (!user) {
        // User doesn't exist - let the auth controller handle it
        next();
        return;
      }

      // Check if login mode matches user role
      if (loginMode === 'cashier' && (user.role === 'manager' || user.role === 'superadmin')) {
        res.status(403).json({
          success: false,
          message: 'Manager/Superadmin access required. Please use Manager Mode to login.',
          data: { errorType: 'role_mismatch' }
        });
        return;
      }

      if (loginMode === 'admin' && user.role === 'cashier') {
        res.status(403).json({
          success: false,
          message: 'Cashier access required. Please use Cashier Mode to login.',
          data: { errorType: 'role_mismatch' }
        });
        return;
      }

      // Role matches login mode - proceed
      next();
    } catch (error) {
      console.error('Role validation error:', error);
      ErrorResponse.send(
        res,
        error,
        'Server error during role validation'
      );
    }
  }

  /**
   * Validate user has required role
   * This is used for role-specific operations
   */
  static requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ErrorResponse.unauthorized(res, 'Authentication required');
        return;
      }

      if (!roles.includes(req.user.role)) {
        ErrorResponse.forbidden(
          res,
          `Access denied. Required role: ${roles.join(' or ')}`
        );
        return;
      }

      next();
    };
  }

  /**
   * Validate user can manage target role
   * Superadmin > Manager > Cashier
   */
  static canManageRole(targetRole: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ErrorResponse.unauthorized(res, 'Authentication required');
        return;
      }

      const currentRole = req.user.role;

      // Superadmin can manage everyone except other superadmins
      if (currentRole === 'superadmin' && targetRole !== 'superadmin') {
        next();
        return;
      }

      // Manager can manage cashiers only
      if (currentRole === 'manager' && targetRole === 'cashier') {
        next();
        return;
      }

      ErrorResponse.forbidden(
        res,
        `You do not have permission to manage ${targetRole} accounts`
      );
    };
  }
}

