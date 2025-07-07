import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@/lib/orderTypes';

export interface IOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  quantityId: string;
  quantityDescription: string;
}

export interface IOrder extends Document {
  orderId: string;
  outletId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  comments: string;
  customerName?: string;
  tableNumber?: string;
  timestamps: {
    created: Date;
    updated: Date;
  };
}

const OrderItemSchema = new Schema<IOrderItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  quantityId: { type: String, required: true },
  quantityDescription: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  outletId: {
    type: Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true,
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  orderStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.TAKEN,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID,
  },
  comments: {
    type: String,
    default: '',
    maxlength: 500,
  },
  customerName: {
    type: String,
    maxlength: 100,
  },
  tableNumber: {
    type: String,
    maxlength: 20,
  },
  timestamps: {
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: false, // We're handling timestamps manually
});

// Update the updated timestamp on save
OrderSchema.pre('save', function(next) {
  this.timestamps.updated = new Date();
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);