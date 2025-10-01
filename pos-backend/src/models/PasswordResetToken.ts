import mongoose, { Schema, Model } from 'mongoose';
import { IPasswordResetToken } from '../types';

interface IPasswordResetTokenModel extends Model<IPasswordResetToken> {
  findValidToken(token: string): Promise<IPasswordResetToken | null>;
  invalidateToken(token: string): Promise<IPasswordResetToken | null>;
  cleanupExpiredTokens(): Promise<{ deletedCount?: number }>;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
  },
  token: {
    type: String,
    required: [true, 'Reset token is required'],
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for performance
passwordResetTokenSchema.index({ token: 1 });
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });
passwordResetTokenSchema.index({ used: 1 });

// Static method to find valid token
passwordResetTokenSchema.statics.findValidToken = function(token: string) {
  return this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to invalidate token
passwordResetTokenSchema.statics.invalidateToken = function(token: string) {
  return this.findOneAndUpdate(
    { token },
    { 
      used: true, 
      usedAt: new Date() 
    },
    { new: true }
  );
};

// Static method to clean up expired tokens
passwordResetTokenSchema.statics.cleanupExpiredTokens = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Delete used tokens older than 24 hours
    ]
  });
};

export const PasswordResetToken = mongoose.model<IPasswordResetToken, IPasswordResetTokenModel>('PasswordResetToken', passwordResetTokenSchema);
