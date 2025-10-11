import { EmailConfigService } from './EmailConfigService';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    const transporter = EmailConfigService.getTransporter();
    
    if (!transporter) {
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

      await transporter.sendMail(mailOptions);
      console.log('EMAIL SENT: Successfully sent email to', options.to);
      return true;
    } catch (error) {
      console.error('EMAIL FAILED: Failed to send email:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<boolean> {
    return EmailConfigService.testConnection();
  }

  /**
   * Check if email service is initialized
   */
  static isInitialized(): boolean {
    return EmailConfigService.isInitialized();
  }

  /**
   * Test email connection
   */
  static async testConnection(): Promise<boolean> {
    return EmailConfigService.testConnection();
  }
