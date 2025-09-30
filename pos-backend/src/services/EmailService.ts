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
      port: parseInt(process.env.EMAIL_PORT!),
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
        console.log('Email service initialized successfully');
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
      console.log('Email sent successfully:', result.messageId);
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
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            transition: background-color 0.2s;
          }
          .reset-button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .token-info {
            background-color: #f3f4f6;
            border-radius: 4px;
            padding: 10px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛒 SmartGrocery</div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello ${user.firstName} ${user.lastName},</p>
            
            <p>We received a request to reset your password for your SmartGrocery account.</p>
            
            <p>If you have forgotten your password, use the button below to reset it:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-info">${resetUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 15 minutes</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security reasons, this link can only be used once</li>
              </ul>
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from SmartGrocery POS System</p>
            <p>If you have any questions, please contact our support team.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
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
