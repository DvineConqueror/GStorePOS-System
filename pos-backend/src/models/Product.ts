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
    min: [0, 'Minimum stock cannot be negative'],
    default: 10,
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
  status: {
    type: String,
    enum: ['available', 'unavailable', 'deleted'],
    default: 'available',
    required: true,
  },
  supplier: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Comprehensive indexing strategy for optimal query performance

// Text search index for product search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  sku: 'text',
  barcode: 'text' 
}, {
  weights: {
    name: 10,      // Name is most important for search
    sku: 5,        // SKU is quite important
    barcode: 3,    // Barcode is important for POS
    description: 1  // Description is least important
  }
});

// Single field indexes for basic filtering
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });
// Note: sku and barcode indexes are automatically created due to unique: true in schema

// Compound indexes for common product listing queries
productSchema.index({ 
  status: 1, 
  category: 1, 
  name: 1 
}); // For filtered product listings (includes name for sorting)

productSchema.index({ 
  status: 1, 
  brand: 1, 
  price: 1 
}); // For brand-based price filtering

productSchema.index({ 
  category: 1, 
  status: 1, 
  stock: -1 
}); // For category inventory management

// Inventory management indexes
productSchema.index({ 
  stock: 1, 
  minStock: 1, 
  status: 1 
}); // Optimized for low stock queries

productSchema.index({ 
  status: 1, 
  stock: 1 
}); // For general stock filtering (in-stock, out-of-stock)

// Price range filtering indexes
productSchema.index({ 
  status: 1, 
  price: 1, 
  category: 1 
}); // For price range filtering by category

productSchema.index({ 
  price: 1, 
  cost: 1 
}); // For profit margin analysis

// Sorting and pagination optimization (removed duplicate name index)
productSchema.index({ 
  status: 1, 
  createdAt: -1 
}); // For newest products first

productSchema.index({ 
  status: 1, 
  updatedAt: -1 
}); // For recently updated products

// Advanced search combinations
productSchema.index({ 
  status: 1, 
  category: 1, 
  brand: 1, 
  price: 1 
}); // For complex filtered searches

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

// Virtual for display status (shows "out of stock" when stock is 0)
productSchema.virtual('displayStatus').get(function() {
  if (this.stock === 0) {
    return 'out of stock';
  }
  return this.status;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true,
});

// Pre-save middleware to generate SKU and validate stock
productSchema.pre('save', function(next) {
  // Generate SKU if not provided
  if (!this.sku) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.sku = `SKU-${timestamp}${random}`;
  }
  
  // Validate stock limits
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
    status: 'available'
  });
};

// Static method to find out of stock products
productSchema.statics.findOutOfStock = function() {
  return this.find({
    stock: 0,
    status: 'available'
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
    status: 'available',
    ...filters
  };

  return this.find(searchQuery);
};

export const Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);
