import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus, PaymentStatus } from '@/lib/orderTypes';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint: no authentication required for menu/guest access
    // but we need sessionId for proper user isolation
    
    await connectDB();

    const outletId = request.nextUrl.searchParams.get('outletId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!outletId) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 });
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required for user isolation' }, { status: 400 });
    }

    // CRITICAL: Only return orders for this specific user session
    const orders = await Order.find({ 
      outletId, 
      sessionId // Filter by sessionId to prevent users from seeing each other's orders
    })
      .sort({ 'timestamps.created': -1 })
      .limit(100);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outletId, sessionId, items, totalAmount, comments, customerName, tableNumber } = body;

    // Validate input
    if (!outletId || !sessionId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data - outletId, sessionId, and items are required' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create order with sessionId for proper isolation
    const order = await Order.create({
      orderId,
      outletId,
      sessionId, // Associate order with user session
      items,
      totalAmount,
      orderStatus: OrderStatus.TAKEN,
      paymentStatus: PaymentStatus.UNPAID,
      comments: comments || '',
      customerName: customerName || '',
      tableNumber: tableNumber || '',
      timestamps: {
        created: new Date(),
        updated: new Date(),
      },
      lastItemAddedAt: new Date(),
    });

    return NextResponse.json(
      { message: 'Order created successfully', order },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}