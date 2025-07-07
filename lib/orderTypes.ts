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
}

export interface Order {
  orderId: string;
  outletId: string;
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
}

export interface OrderUpdate {
  orderId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  comments?: string;
}