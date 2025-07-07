import mongoose, { Schema, Document } from 'mongoose';

export interface IItemQuantityPrice {
  quantityId: mongoose.Types.ObjectId;
  price: number;
}

export interface IItem extends Document {
  name: string;
  description: string;
  image?: string;
  categoryId: mongoose.Types.ObjectId;
  outletId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isVeg: boolean;
  quantityPrices: IItemQuantityPrice[];
  isAvailable: boolean;
  isHighlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemQuantityPriceSchema = new Schema<IItemQuantityPrice>({
  quantityId: {
    type: Schema.Types.ObjectId,
    ref: 'Quantity',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const ItemSchema = new Schema<IItem>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500,
  },
  image: {
    type: String,
    default: '',
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
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
  isVeg: {
    type: Boolean,
    required: true,
    default: true,
  },
  quantityPrices: [ItemQuantityPriceSchema],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
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

// Create compound index for unique item names per outlet
ItemSchema.index({ name: 1, outletId: 1 }, { unique: true });

// Prevent re-compilation during development
export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);