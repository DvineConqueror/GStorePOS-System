import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Centralized error response utility
 * Provides consistent error handling across all controllers
 */
export class ErrorResponse {
  /**
   * Common error types mapping
   */
  private static readonly ERROR_MAPPINGS: Record<string, { status: number; message?: string }> = {
    'not found': { status: 404 },
    'product not found': { status: 404 },
    'user not found': { status: 404 },
    'transaction not found': { status: 404 },
    'image not found': { status: 404 },
    'category not found': { status: 404 },
    'already exists': { status: 400 },
    'invalid credentials': { status: 401 },
    'access denied': { status: 403 },
    'insufficient permissions': { status: 403 },
    'insufficient stock': { status: 400 },
    'invalid operation': { status: 400 },
    'validation error': { status: 400 },
    'invalid token': { status: 401 },
    'expired token': { status: 401 },
    'session expired': { status: 401 },
  };

  /**
   * Send standardized error response
   */
  static send(
    res: Response,
    error: any,
    defaultMessage: string = 'An error occurred while processing your request'
  ): void {
    console.error(`Error: ${defaultMessage}`, error);

    // Handle known error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Check for mapped error types
      for (const [key, config] of Object.entries(this.ERROR_MAPPINGS)) {
        if (errorMessage.includes(key)) {
          res.status(config.status).json({
            success: false,
            message: config.message || error.message,
          } as ApiResponse);
          return;
        }
      }
    }

    // Default to 500 for unknown errors
    res.status(500).json({
      success: false,
      message: defaultMessage,
    } as ApiResponse);
  }

  /**
   * Send not found error
   */
  static notFound(res: Response, resource: string = 'Resource'): void {
    res.status(404).json({
      success: false,
      message: `${resource} not found.`,
    } as ApiResponse);
  }

  /**
   * Send validation error
   */
  static validationError(res: Response, message: string): void {
    res.status(400).json({
      success: false,
      message,
    } as ApiResponse);
  }

  /**
   * Send unauthorized error
   */
  static unauthorized(res: Response, message: string = 'Unauthorized access'): void {
    res.status(401).json({
      success: false,
      message,
    } as ApiResponse);
  }

  /**
   * Send forbidden error
   */
  static forbidden(res: Response, message: string = 'Access forbidden'): void {
    res.status(403).json({
      success: false,
      message,
    } as ApiResponse);
  }

  /**
   * Send success response
   */
  static success(
    res: Response,
    message: string,
    data?: any,
    pagination?: any,
    statusCode: number = 200
  ): void {
    const response: ApiResponse = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created(res: Response, message: string, data?: any): void {
    this.success(res, message, data, undefined, 201);
  }
}

