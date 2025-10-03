import nodemailer from 'nodemailer';
import { IUser } from '../types';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PasswordResetEmailData {
  user: IUser;
  resetToken: string;
  clientUrl: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  static initializeTransporter(): void {
    if (this.transporter) {
      return;
    }

    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    };

    // Validate email configuration
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('Email configuration incomplete. Email functionality will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service initialization failed:', error);
        this.transporter = null;
      } else {
      }
    });
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.STORE_NAME}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Generate password reset email HTML
   */
  static generatePasswordResetEmail(data: PasswordResetEmailData): string {
    const { user, resetToken, clientUrl } = data;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SmartGrocery</title>
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
          .form-section {
            margin-bottom: 24px;
          }
          .label {
            font-size: 14px;
            font-weight: 500;
            color: #000000;
            margin-bottom: 8px;
            display: block;
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
          .reset-button {
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
          .reset-button:hover {
            background-color: #15803d;
          }
          .link-section {
            margin: 16px 0;
          }
          .link-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .token-info {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 12px;
            word-break: break-all;
            color: #374151;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
          }
          .warning-title {
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .warning-icon {
            font-size: 16px;
            color: #92400e;
          }
          .warning-list {
            margin: 0;
            padding-left: 20px;
            font-size: 14px;
            line-height: 1.5;
          }
          .warning-list li {
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
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #16a34a !important;
            text-decoration: none !important;
            font-size: 14px;
            margin-top: 16px;
          }
          .back-link:hover {
            text-decoration: underline;
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
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Enter a new password for ${user.email}</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
            
            <p class="instruction">We received a request to reset your password for your SmartGrocery account.</p>
            
            <p class="instruction">If you have forgotten your password, use the button below to reset it:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button" style="color: #ffffff !important; text-decoration: none !important;">Reset My Password</a>
            </div>
            
            <div class="link-section">
              <p class="link-label">Or copy and paste this link into your browser:</p>
              <div class="token-info">${resetUrl}</div>
            </div>
            
            <div class="warning">
              <div class="warning-title">
                Important Security Information
              </div>
              <ul class="warning-list">
                <li>This link will expire in 15 minutes</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security reasons, this link can only be used once</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p class="instruction">If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
            
            <div style="text-align: center;">
              <a href="${clientUrl}/login" class="back-link" style="color: #16a34a !important; text-decoration: none !important;">
                Back to Login
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-brand">SmartGrocery POS System</p>
            <p class="footer-text">This email was sent from our secure password reset service.</p>
            <p class="footer-text">If you have any questions, please contact our support team.</p>
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
   * Generate password reset email text version
   */
  static generatePasswordResetEmailText(data: PasswordResetEmailData): string {
    const { user, resetToken, clientUrl } = data;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    return `
SmartGrocery - Password Reset Request

Hello ${user.firstName} ${user.lastName},

We received a request to reset your password for your SmartGrocery account.

If you have forgotten your password, use this link to reset it:
${resetUrl}

IMPORTANT:
- This link will expire in 15 minutes
- If you didn't request this password reset, please ignore this email
- For security reasons, this link can only be used once

If you're having trouble with the link, copy and paste the URL above into your web browser.

This email was sent from SmartGrocery POS System
If you have any questions, please contact our support team.

This is an automated message. Please do not reply to this email.
    `.trim();
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const html = this.generatePasswordResetEmail(data);
    const text = this.generatePasswordResetEmailText(data);

    return this.sendEmail({
      to: data.user.email,
      subject: 'SmartGrocery Password Reset',
      html,
      text,
    });
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  /**
   * Get email service status
   */
  static getStatus(): { initialized: boolean; configured: boolean } {
    return {
      initialized: this.transporter !== null,
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    };
  }
}