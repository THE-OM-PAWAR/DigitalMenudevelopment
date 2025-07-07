import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus, PaymentStatus } from '@/lib/orderTypes';

export async function GET(request: NextRequest) {
  try {
    // Public endpoint: no authentication required for menu/guest access
    // const user = getAuthUser(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    const outletId = request.nextUrl.searchParams.get('outletId');
    if (!outletId) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 });
    }

    const orders = await Order.find({ outletId })
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
    const { outletId, items, totalAmount, comments, customerName, tableNumber } = body;

    // Validate input
    if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
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

    // Create order
    const order = await Order.create({
      orderId,
      outletId,
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