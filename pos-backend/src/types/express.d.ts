// Extend Express Request to include our custom user property
import { IUser } from './index';

declare global {
  namespace Express {
    // Override the Request interface to include our user
    interface Request {
      user?: IUser;
    }
  }
}

export {};
