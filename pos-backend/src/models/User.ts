import mongoose, { Schema, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserModel } from '../types';

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['superadmin', 'manager', 'cashier'],
    default: 'cashier',
    required: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active',
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  approvedAt: {
    type: Date,
    required: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    },
  },
});

// Comprehensive indexing strategy for optimal query performance

// Single field indexes for basic queries
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isApproved: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ approvedBy: 1 });
userSchema.index({ lastLogin: -1 }); // For sorting by last login

// Compound indexes for common query patterns
userSchema.index({ 
  role: 1, 
  status: 1, 
  isApproved: 1 
}); // For admin user management queries

userSchema.index({ 
  status: 1, 
  isApproved: 1, 
  createdAt: -1 
}); // For filtering active approved users with recent first

userSchema.index({ 
  email: 1, 
  status: 1 
}); // For credential lookup optimization

userSchema.index({ 
  username: 1, 
  status: 1 
}); // For credential lookup optimization

// Index for user search and filtering
userSchema.index({ 
  role: 1, 
  firstName: 1, 
  lastName: 1 
}); // For user search by role and name

// Time-based indexes for analytics and reporting
userSchema.index({ 
  createdAt: -1, 
  role: 1 
}); // For user registration analytics by role

// Pre-save middleware to hash password
userSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, (this as any).password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method to find user by email or username
userSchema.statics.findByCredentials = async function(emailOrUsername: string, password: string) {
  const user = await this.findOne({
    $and: [
      {
        $or: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      },
      { status: 'active' },
      {
        $or: [
          { isApproved: true },
          { isApproved: { $exists: false } } // Allow users without isApproved field (legacy users)
        ]
      }
    ]
  }).select('+password');

  if (!user) {
    throw new Error('Invalid credentials or account not approved');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${(this as any).firstName} ${(this as any).lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
});

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
