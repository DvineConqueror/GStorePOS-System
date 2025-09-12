import mongoose, { Schema } from 'mongoose';
import { ITransaction, ITransactionItem, ITransactionModel } from '../types';

const transactionItemSchema = new Schema<ITransactionItem>({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
}, { _id: false });

const transactionSchema = new Schema<ITransaction>({
  transactionNumber: {
    type: String,
    required: [true, 'Transaction number is required'],
    unique: true,
    trim: true,
  },
  items: {
    type: [transactionItemSchema],
    required: [true, 'Transaction items are required'],
    validate: {
      validator: function(items: ITransactionItem[]) {
        return items && items.length > 0;
      },
      message: 'Transaction must have at least one item',
    },
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax cannot be negative'],
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital'],
    required: [true, 'Payment method is required'],
  },
  cashierId: {
    type: String,
    required: [true, 'Cashier ID is required'],
  },
  cashierName: {
    type: String,
    required: [true, 'Cashier name is required'],
  },
  customerId: {
    type: String,
  },
  customerName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'voided'],
    default: 'completed',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
transactionSchema.index({ cashierId: 1 });
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ total: 1 });

// Compound indexes
transactionSchema.index({ cashierId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// Virtual for item count
transactionSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for tax rate
transactionSchema.virtual('taxRate').get(function() {
  if (this.subtotal > 0) {
    return ((this.tax / this.subtotal) * 100).toFixed(2);
  }
  return '0.00';
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', {
  virtuals: true,
});

// Pre-save middleware to generate transaction number
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionNumber) {
    const count = await (this.constructor as any).countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');
    this.transactionNumber = `TXN${year}${month}${day}${sequence}`;
  }
  next();
});

// Pre-save middleware to calculate totals
transactionSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.totalPrice - (item.discount || 0));
  }, 0);

  // Calculate total
  this.total = this.subtotal + this.tax - this.discount;

  next();
});

// Static method to get daily sales
transactionSchema.statics.getDailySales = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalTransactions: { $sum: 1 },
        averageTransactionValue: { $avg: '$total' }
      }
    }
  ]);
};

// Static method to get sales by cashier
transactionSchema.statics.getSalesByCashier = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$cashierId',
        cashierName: { $first: '$cashierName' },
        totalSales: { $sum: '$total' },
        totalTransactions: { $sum: 1 },
        averageTransactionValue: { $avg: '$total' }
      }
    },
    {
      $sort: { totalSales: -1 }
    }
  ]);
};

// Static method to get top products
transactionSchema.statics.getTopProducts = function(startDate: Date, endDate: Date, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' }
      }
    },
    {
      $sort: { quantitySold: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

export const Transaction = mongoose.model<ITransaction, ITransactionModel>('Transaction', transactionSchema);
