import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  image?: string;
  outletId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  description: {
    type: String,
    default: '',
    maxlength: 200,
  },
  image: {
    type: String,
    default: '',
  },
  outletId: {
    type: Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Create compound index for unique category names per outlet
CategorySchema.index({ name: 1, outletId: 1 }, { unique: true });

// Prevent re-compilation during development
export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
