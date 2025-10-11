export class NotificationTemplateService {
  /**
   * Generate user registration notification template
   */
  static generateUserRegistrationTemplate(userData: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = 'New User Registration';
    const message = `New ${userData.role} registered: ${userData.firstName} ${userData.lastName} (${userData.username})`;
    
    const emailMessage = `
      <h2>New User Registration</h2>
      <p>A new user has registered and is awaiting approval:</p>
      <ul>
        <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
        <li><strong>Username:</strong> ${userData.username}</li>
        <li><strong>Email:</strong> ${userData.email}</li>
        <li><strong>Role:</strong> ${userData.role}</li>
        <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please review and approve this user in the admin dashboard.</p>
    `;

    return { subject, message, emailMessage };
  }

  /**
   * Generate low stock alert template
   */
  static generateLowStockTemplate(productData: {
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    category: string;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = 'Low Stock Alert';
    const message = `Low stock alert: ${productData.name} (${productData.sku}) - ${productData.currentStock} remaining`;
    
    const emailMessage = `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <ul>
        <li><strong>Product:</strong> ${productData.name}</li>
        <li><strong>SKU:</strong> ${productData.sku}</li>
        <li><strong>Category:</strong> ${productData.category}</li>
        <li><strong>Current Stock:</strong> ${productData.currentStock}</li>
        <li><strong>Minimum Stock:</strong> ${productData.minStock}</li>
        <li><strong>Alert Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please restock this product to avoid stockouts.</p>
    `;

    return { subject, message, emailMessage };
  }

  /**
   * Generate out of stock alert template
   */
  static generateOutOfStockTemplate(productData: {
    name: string;
    sku: string;
    category: string;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = 'Out of Stock Alert';
    const message = `Out of stock: ${productData.name} (${productData.sku})`;
    
    const emailMessage = `
      <h2>Out of Stock Alert</h2>
      <p>The following product is now out of stock:</p>
      <ul>
        <li><strong>Product:</strong> ${productData.name}</li>
        <li><strong>SKU:</strong> ${productData.sku}</li>
        <li><strong>Category:</strong> ${productData.category}</li>
        <li><strong>Alert Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please restock this product immediately.</p>
    `;

    return { subject, message, emailMessage };
  }

  /**
   * Generate transaction alert template
   */
  static generateTransactionAlertTemplate(transactionData: {
    transactionNumber: string;
    total: number;
    cashierName: string;
    paymentMethod: string;
    itemCount: number;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = 'High Value Transaction';
    const message = `High value transaction: ${transactionData.transactionNumber} - ₱${transactionData.total}`;
    
    const emailMessage = `
      <h2>High Value Transaction Alert</h2>
      <p>A high-value transaction has been processed:</p>
      <ul>
        <li><strong>Transaction Number:</strong> ${transactionData.transactionNumber}</li>
        <li><strong>Total Amount:</strong> ₱${transactionData.total.toLocaleString()}</li>
        <li><strong>Cashier:</strong> ${transactionData.cashierName}</li>
        <li><strong>Payment Method:</strong> ${transactionData.paymentMethod}</li>
        <li><strong>Items:</strong> ${transactionData.itemCount}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    `;

    return { subject, message, emailMessage };
  }

  /**
   * Generate system maintenance template
   */
  static generateMaintenanceTemplate(maintenanceData: {
    type: string;
    scheduledDate: Date;
    duration: string;
    description: string;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = 'System Maintenance Scheduled';
    const message = `System maintenance scheduled: ${maintenanceData.type} on ${maintenanceData.scheduledDate.toLocaleDateString()}`;
    
    const emailMessage = `
      <h2>System Maintenance Scheduled</h2>
      <p>The following system maintenance has been scheduled:</p>
      <ul>
        <li><strong>Type:</strong> ${maintenanceData.type}</li>
        <li><strong>Scheduled Date:</strong> ${maintenanceData.scheduledDate.toLocaleString()}</li>
        <li><strong>Duration:</strong> ${maintenanceData.duration}</li>
        <li><strong>Description:</strong> ${maintenanceData.description}</li>
      </ul>
      <p>Please plan accordingly as the system may be unavailable during this time.</p>
    `;

    return { subject, message, emailMessage };
  }

  /**
   * Generate security alert template
   */
  static generateSecurityAlertTemplate(securityData: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUser?: string;
  }): { subject: string; message: string; emailMessage: string } {
    const subject = `Security Alert - ${securityData.severity.toUpperCase()}`;
    const message = `Security alert: ${securityData.type} - ${securityData.description}`;
    
    const emailMessage = `
      <h2>Security Alert</h2>
      <p><strong>Severity:</strong> ${securityData.severity.toUpperCase()}</p>
      <p><strong>Type:</strong> ${securityData.type}</p>
      <p><strong>Description:</strong> ${securityData.description}</p>
      ${securityData.affectedUser ? `<p><strong>Affected User:</strong> ${securityData.affectedUser}</p>` : ''}
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p>Please review this alert and take appropriate action if necessary.</p>
    `;

    return { subject, message, emailMessage };
  }
}
