import mongoose, { Schema, Document } from 'mongoose';

export interface IQuantity extends Document {
  value: string;
  description: string;
  outletId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuantitySchema = new Schema<IQuantity>({
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
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

// Create compound index for unique quantity values per outlet
QuantitySchema.index({ value: 1, outletId: 1 }, { unique: true });

// Prevent re-compilation during development
export default mongoose.models.Quantity || mongoose.model<IQuantity>('Quantity', QuantitySchema);