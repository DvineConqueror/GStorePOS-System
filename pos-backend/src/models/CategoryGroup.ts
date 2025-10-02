import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryGroup extends Document {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categoryGroupSchema = new Schema<ICategoryGroup>({
  name: {
    type: String,
    required: [true, 'Category group name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category group name cannot exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  order: {
    type: Number,
    default: 0,
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
categoryGroupSchema.index({ name: 1 });
categoryGroupSchema.index({ order: 1 });
categoryGroupSchema.index({ isActive: 1 });

const CategoryGroup = mongoose.model<ICategoryGroup>('CategoryGroup', categoryGroupSchema);

export default CategoryGroup;

