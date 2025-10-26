import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../../utils/errorResponse';

/**
 * Request validation middleware
 * Validates request body, params, and query parameters
 */
export class RequestValidation {
  /**
   * Validate required fields in request body
   */
  static validateRequiredFields(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const missing: string[] = [];

      for (const field of fields) {
        if (!req.body[field]) {
          missing.push(field);
        }
      }

      if (missing.length > 0) {
        ErrorResponse.validationError(
          res,
          `Missing required fields: ${missing.join(', ')}`
        );
        return;
      }

      next();
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(field: string = 'email') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const email = req.body[field];
      
      if (!email) {
        next();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        ErrorResponse.validationError(res, `Invalid ${field} format`);
        return;
      }

      next();
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(minLength: number = 6) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const password = req.body.password;

      if (!password) {
        next();
        return;
      }

      if (password.length < minLength) {
        ErrorResponse.validationError(
          res,
          `Password must be at least ${minLength} characters long`
        );
        return;
      }

      next();
    };
  }

  /**
   * Validate numeric fields
   */
  static validateNumeric(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      for (const field of fields) {
        const value = req.body[field];
        
        if (value !== undefined && value !== null) {
          if (isNaN(Number(value))) {
            ErrorResponse.validationError(res, `${field} must be a valid number`);
            return;
          }
        }
      }

      next();
    };
  }

  /**
   * Validate positive numbers
   */
  static validatePositiveNumber(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      for (const field of fields) {
        const value = req.body[field];
        
        if (value !== undefined && value !== null) {
          const num = Number(value);
          if (isNaN(num) || num <= 0) {
            ErrorResponse.validationError(
              res,
              `${field} must be a positive number`
            );
            return;
          }
        }
      }

      next();
    };
  }

  /**
   * Validate array fields
   */
  static validateArray(field: string, minLength: number = 0) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const value = req.body[field];

      if (!value) {
        next();
        return;
      }

      if (!Array.isArray(value)) {
        ErrorResponse.validationError(res, `${field} must be an array`);
        return;
      }

      if (value.length < minLength) {
        ErrorResponse.validationError(
          res,
          `${field} must contain at least ${minLength} item(s)`
        );
        return;
      }

      next();
    };
  }

  /**
   * Validate enum values
   */
  static validateEnum(field: string, allowedValues: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const value = req.body[field];

      if (!value) {
        next();
        return;
      }

      if (!allowedValues.includes(value)) {
        ErrorResponse.validationError(
          res,
          `${field} must be one of: ${allowedValues.join(', ')}`
        );
        return;
      }

      next();
    };
  }

  /**
   * Validate MongoDB ObjectId format
   */
  static validateObjectId(field: string, source: 'body' | 'params' | 'query' = 'params') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const value = source === 'body' ? req.body[field] : 
                    source === 'params' ? req.params[field] : 
                    req.query[field];

      if (!value) {
        next();
        return;
      }

      const objectIdRegex = /^[a-f\d]{24}$/i;
      if (!objectIdRegex.test(value as string)) {
        ErrorResponse.validationError(res, `Invalid ${field} format`);
        return;
      }

      next();
    };
  }

  /**
   * Validate date range
   */
  static validateDateRange() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { startDate, endDate } = req.query;

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          ErrorResponse.validationError(res, 'Invalid date format');
          return;
        }

        if (start > end) {
          ErrorResponse.validationError(
            res,
            'Start date must be before end date'
          );
          return;
        }
      }

      next();
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { page, limit } = req.query;

      if (page) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          ErrorResponse.validationError(res, 'Page must be a positive integer');
          return;
        }
      }

      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          ErrorResponse.validationError(
            res,
            'Limit must be between 1 and 100'
          );
          return;
        }
      }

      next();
    };
  }

  /**
   * Validate login mode (for auth)
   */
  static validateLoginMode() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { loginMode } = req.body;

      if (!loginMode) {
        ErrorResponse.validationError(
          res,
          'Login mode is required (admin or cashier)'
        );
        return;
      }

      if (!['admin', 'cashier'].includes(loginMode)) {
        ErrorResponse.validationError(
          res,
          'Login mode must be either "admin" or "cashier"'
        );
        return;
      }

      next();
    };
  }
}

