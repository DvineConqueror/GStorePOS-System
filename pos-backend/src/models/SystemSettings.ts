import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  systemName: string;
  systemVersion: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireStrongPasswords: boolean;
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  systemAlerts: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  taxRate: number;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>({
  maintenanceMode: {
    type: Boolean,
    default: false,
    required: true,
  },
  maintenanceMessage: {
    type: String,
    default: 'System is currently under maintenance. Some features may be unavailable.',
  },
  systemName: {
    type: String,
    default: 'Grocery Store POS',
    required: true,
  },
  systemVersion: {
    type: String,
    default: '1.0.0',
    required: true,
  },
  sessionTimeout: {
    type: Number,
    default: 30,
    min: 5,
    max: 240,
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
    min: 3,
    max: 10,
  },
  passwordMinLength: {
    type: Number,
    default: 6,
    min: 6,
    max: 32,
  },
  requireStrongPasswords: {
    type: Boolean,
    default: false,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  lowStockAlerts: {
    type: Boolean,
    default: true,
  },
  systemAlerts: {
    type: Boolean,
    default: true,
  },
  autoBackup: {
    type: Boolean,
    default: true,
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  retentionDays: {
    type: Number,
    default: 30,
    min: 7,
    max: 365,
  },
  storeName: {
    type: String,
    default: 'Grocery Store',
  },
  storeAddress: {
    type: String,
    default: '',
  },
  storePhone: {
    type: String,
    default: '',
  },
  storeEmail: {
    type: String,
    default: '',
  },
  currency: {
    type: String,
    default: 'USD',
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for quick lookups
systemSettingsSchema.index({ updatedAt: -1 });

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

