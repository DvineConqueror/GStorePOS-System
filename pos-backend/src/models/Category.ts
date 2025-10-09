import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
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
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
