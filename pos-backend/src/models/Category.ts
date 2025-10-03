import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  group: string;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
  },
  group: {
    type: String,
    required: [true, 'Category group is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
// Note: name index is automatically created due to unique: true in schema
categorySchema.index({ group: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;

