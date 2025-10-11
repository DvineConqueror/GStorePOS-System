import nodemailer from 'nodemailer';

export class EmailConfigService {
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
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    };

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.error('EMAIL CONFIG ERROR: Email configuration incomplete');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('EMAIL TRANSPORTER: Created successfully');
    } catch (error) {
      console.error('EMAIL TRANSPORTER ERROR:', error);
      this.transporter = null;
    }
  }

  /**
   * Check if email service is initialized
   */
  static isInitialized(): boolean {
    return this.transporter !== null;
  }

  /**
   * Test email connection
   */
  static async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('EMAIL CONNECTION TEST FAILED:', error);
      return false;
    }
  }

  /**
   * Get transporter instance
   */
  static getTransporter(): nodemailer.Transporter | null {
    return this.transporter;
  }
}
