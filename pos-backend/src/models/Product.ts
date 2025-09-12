import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductModel } from '../types';

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock is required'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 0,
  },
  maxStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative'],
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    default: 'piece',
  },
  image: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  supplier: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.cost && this.price) {
    return ((this.price - this.cost) / this.price * 100).toFixed(2);
  }
  return null;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.minStock) return 'low-stock';
  return 'in-stock';
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.stock * this.price;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true,
});

// Pre-save middleware to validate stock
productSchema.pre('save', function(next) {
  if (this.maxStock && this.stock > this.maxStock) {
    return next(new Error('Stock cannot exceed maximum stock limit'));
  }
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$stock', '$minStock']
    },
    isActive: true
  });
};

// Static method to find out of stock products
productSchema.statics.findOutOfStock = function() {
  return this.find({
    stock: 0,
    isActive: true
  });
};

// Static method to search products
productSchema.statics.searchProducts = function(query: string, filters: any = {}) {
  const searchQuery: any = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { sku: { $regex: query, $options: 'i' } },
      { barcode: { $regex: query, $options: 'i' } },
    ],
    isActive: true,
    ...filters
  };

  return this.find(searchQuery);
};

export const Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);
