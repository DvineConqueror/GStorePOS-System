import { User } from '../models/User';
import { EmailService } from './EmailService';
import { IUser } from '../types';

interface ApprovalNotificationData {
  user: IUser;
  approvedBy: IUser;
  clientUrl: string;
}

export class NotificationService {
  /**
   * Send approval notification email to cashier
   */
  static async sendApprovalNotification(data: ApprovalNotificationData): Promise<boolean> {
    const { user, approvedBy, clientUrl } = data;
    
    const html = this.generateApprovalEmailHTML(user, approvedBy, clientUrl);
    const text = this.generateApprovalEmailText(user, approvedBy, clientUrl);

    return EmailService.sendEmail({
      to: user.email,
      subject: 'SmartGrocery - Account Approved',
      html,
      text,
    });
  }

  /**
   * Generate approval email HTML
   */
  static generateApprovalEmailHTML(user: IUser, approvedBy: IUser, clientUrl: string): string {
    const loginUrl = `${clientUrl}/login`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - SmartGrocery</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #ececec;
            padding: 20px;
          }
          .email-container {
            max-width: 448px;
            margin: 0 auto;
            background-color: #fafaf9;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
          }
          .header {
            text-align: center;
            padding: 32px 32px 24px;
          }
          .icon-container {
            width: 64px;
            height: 64px;
            background-color: #dcfce7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          }
          .icon {
            font-size: 32px;
            color: #16a34a;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
          }
          .content {
            padding: 0 32px 32px;
          }
          .greeting {
            font-size: 16px;
            color: #000000;
            margin-bottom: 16px;
          }
          .instruction {
            color: #6b7280;
            margin-bottom: 16px;
            line-height: 1.5;
          }
          .button-container {
            margin: 24px 0;
          }
          .login-button {
            display: inline-block;
            width: 100%;
            background-color: #16a34a;
            color: #ffffff !important;
            padding: 12px 16px;
            text-decoration: none !important;
            border-radius: 6px;
            font-weight: 500;
            text-align: center;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }
          .login-button:hover {
            background-color: #15803d;
          }
          .approval-details {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
          }
          .approval-details h4 {
            font-weight: 600;
            margin-bottom: 8px;
            color: #374151;
          }
          .approval-details p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .footer {
            text-align: center;
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            background-color: #fafaf9;
          }
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .footer-brand {
            font-weight: 600;
            color: #000000;
            margin-bottom: 8px;
          }
          .footer-note {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          .brand-text {
            font-size: 24px;
            font-weight: 700;
            color: #16a34a;
            text-align: center;
            width: 100%;
          }
          @media (max-width: 480px) {
            .email-container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding-left: 16px;
              padding-right: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-section">
              <div class="brand-text">SmartGrocery</div>
            </div>
            <h1 class="title">Account Approved!</h1>
            <p class="subtitle">Your SmartGrocery account is now active</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
            
            <p class="instruction">Great news! Your SmartGrocery cashier account has been approved and is now active.</p>
            
            <div class="approval-details">
              <h4>Account Details</h4>
              <p><strong>Username:</strong> ${user.username}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Role:</strong> Cashier</p>
              <p><strong>Approved by:</strong> ${approvedBy.firstName} ${approvedBy.lastName}</p>
              <p><strong>Approved on:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p class="instruction">You can now log in to your account and start using the POS system:</p>
            
            <div class="button-container">
              <a href="${loginUrl}" class="login-button" style="color: #ffffff !important; text-decoration: none !important;">Login to Your Account</a>
            </div>
            
            <p class="instruction">If you have any questions or need assistance, please contact your manager or the system administrator.</p>
          </div>
          
          <div class="footer">
            <p class="footer-brand">SmartGrocery POS System</p>
            <p class="footer-text">Welcome to the team!</p>
            <p class="footer-note">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate approval email text version
   */
  static generateApprovalEmailText(user: IUser, approvedBy: IUser, clientUrl: string): string {
    const loginUrl = `${clientUrl}/login`;

    return `
SmartGrocery - Account Approved

Hello ${user.firstName} ${user.lastName},

Great news! Your SmartGrocery cashier account has been approved and is now active.

Account Details:
- Username: ${user.username}
- Email: ${user.email}
- Role: Cashier
- Approved by: ${approvedBy.firstName} ${approvedBy.lastName}
- Approved on: ${new Date().toLocaleDateString()}

You can now log in to your account and start using the POS system:
${loginUrl}

If you have any questions or need assistance, please contact your manager or the system administrator.

Welcome to the team!

SmartGrocery POS System
This is an automated message. Please do not reply to this email.
    `.trim();
  }

  /**
   * Get pending approval count for notifications
   */
  static async getPendingApprovalCount(role: 'superadmin' | 'manager'): Promise<number> {
    try {
      let query: any = {
        $and: [
          {
            $or: [
              { isApproved: false },
              { isApproved: { $exists: false } } // Handle users without isApproved field
            ]
          },
          { role: { $ne: 'superadmin' } }, // Exclude superadmin from pending approvals
          { status: { $ne: 'deleted' } } // Exclude deleted users from pending approvals
        ]
      };
      
      if (role === 'manager') {
        // Managers can only see pending cashiers
        query.$and.push({ role: 'cashier' });
      }
      // Superadmins can see all pending users
      
      const count = await User.countDocuments(query);
      return count;
    } catch (error) {
      console.error('Error getting pending approval count:', error);
      return 0;
    }
  }

  /**
   * Get pending users for notifications
   */
  static async getPendingUsers(role: 'superadmin' | 'manager', limit: number = 5): Promise<IUser[]> {
    try {
      let query: any = {
        $and: [
          {
            $or: [
              { isApproved: false },
              { isApproved: { $exists: false } } // Handle users without isApproved field
            ]
          },
          { role: { $ne: 'superadmin' } }, // Exclude superadmin from pending approvals
          { status: { $ne: 'deleted' } } // Exclude deleted users from pending approvals
        ]
      };
      
      if (role === 'manager') {
        // Managers can only see pending cashiers
        query.$and.push({ role: 'cashier' });
      }
      // Superadmins can see all pending users
      
      const users = await User.find(query)
        .select('username email firstName lastName role createdAt')
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return users;
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  }
}

