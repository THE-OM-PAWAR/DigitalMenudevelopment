import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@/lib/orderTypes';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const order = await Order.findOne({ orderId: params.id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderStatus, paymentStatus, comments, items, totalAmount } = body;

    await connectDB();

    const order = await Order.findOne({ orderId: params.id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update fields if provided
    if (orderStatus && Object.values(OrderStatus).includes(orderStatus)) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }
    if (comments !== undefined) {
      order.comments = comments;
    }
    if (items && Array.isArray(items)) {
      order.items = items;
    }
    if (totalAmount !== undefined) {
      order.totalAmount = totalAmount;
    }

    order.timestamps.updated = new Date();
    await order.save();

    return NextResponse.json(
      { message: 'Order updated successfully', order },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}