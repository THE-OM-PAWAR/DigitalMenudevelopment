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
    // For customer-facing order retrieval, we need sessionId instead of auth
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    // If no sessionId, check for admin auth (for dashboard access)
    if (!sessionId) {
      const user = getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Session ID required or unauthorized access' }, { status: 401 });
      }
      
      // Admin access - can view any order
      await connectDB();
      const order = await Order.findOne({ orderId: params.id });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    // Customer access with sessionId - only their own orders
    await connectDB();
    const order = await Order.findOne({ 
      orderId: params.id,
      sessionId: sessionId // Ensure customer can only access their own orders
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
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