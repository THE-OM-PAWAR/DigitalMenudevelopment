export enum OrderStatus {
  TAKEN = 'taken',
  PREPARING = 'preparing',
  PREPARED = 'prepared',
  SERVED = 'served'
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  quantityId: string;
  quantityDescription: string;
  addedAt?: Date; // Track when item was added
  isNewlyAdded?: boolean; // Flag for newly added items
}

export interface Order {
  orderId: string;
  outletId: string;
  sessionId: string; // User session ID for proper isolation
  items: OrderItem[];
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
  lastItemAddedAt?: Date; // Track when last item was added
}

export interface OrderUpdate {
  orderId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  comments?: string;
}