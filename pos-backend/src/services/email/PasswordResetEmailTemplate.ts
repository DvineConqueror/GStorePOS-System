interface PasswordResetEmailData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  resetToken: string;
  clientUrl: string;
}

export class PasswordResetEmailTemplate {
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
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
          .brand-text {
            font-size: 24px;
            font-weight: 700;
            color: #16a34a;
            text-align: center;
            margin-bottom: 16px;
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
          }
          .warning-list {
            margin: 0;
            padding-left: 20px;
            font-size: 14px;
            line-height: 1.5;
          }
          .footer {
            text-align: center;
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            background-color: #fafaf9;
          }
          .footer-brand {
            font-weight: 600;
            color: #000000;
            margin-bottom: 8px;
          }
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="brand-text">SmartGrocery</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Enter a new password for ${user.email}</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
            
            <p class="instruction">We received a request to reset your password for your SmartGrocery account.</p>
            
            <p class="instruction">If you have forgotten your password, use the button below to reset it:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <div class="warning-title">Important Security Information</div>
              <ul class="warning-list">
                <li>This link will expire in 15 minutes</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security reasons, this link can only be used once</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-brand">SmartGrocery POS System</p>
            <p class="footer-text">This email was sent from our secure password reset service.</p>
            <p class="footer-text">If you have any questions, please contact our support team.</p>
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

This email was sent from SmartGrocery POS System
If you have any questions, please contact our support team.

This is an automated message. Please do not reply to this email.
    `.trim();
  }
}
