import mongoose, { Schema, Document } from 'mongoose';

export interface IOutlet extends Document {
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  theme?: string;
  orderManagementEnabled?: boolean;
  createdBy: mongoose.Types.ObjectId;
  adminUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OutletSchema = new Schema<IOutlet>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  logo: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  address: {
    type: String,
    default: '',
    maxlength: 200,
  },
  phone: {
    type: String,
    default: '',
    maxlength: 20,
  },
  theme: {
    type: String,
    default: 'modern',
    enum: ['modern', 'premium', 'traditional', 'vibrant', 'minimalist', 'dark'],
  },
  orderManagementEnabled: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent re-compilation during development
export default mongoose.models.Outlet || mongoose.model<IOutlet>('Outlet', OutletSchema);