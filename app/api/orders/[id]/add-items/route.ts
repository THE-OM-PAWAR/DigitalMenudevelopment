import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { OrderStatus, PaymentStatus, OrderItem } from '@/lib/orderTypes';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { items, sessionId }: { items: OrderItem[], sessionId: string } = body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required for user isolation' },
        { status: 400 }
      );
    }

    await connectDB();

    // CRITICAL: Find order by ID AND sessionId to prevent users from modifying other people's orders
    const order = await Order.findOne({ 
      orderId: params.id,
      sessionId: sessionId // Ensure user can only modify their own orders
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
    }

    // Check if order can be modified (only unpaid orders)
    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      return NextResponse.json(
        { error: 'Cannot add items to paid or cancelled orders' },
        { status: 400 }
      );
    }

    // Mark existing items as not newly added
    order.items.forEach((item: any) => {
      item.isNewlyAdded = false;
    });

    // Process new items
    const currentTime = new Date();
    const processedNewItems = items.map(item => {
      const existingItemIndex = order.items.findIndex((existing: any) => existing.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity and mark as newly added
        const existingItem = order.items[existingItemIndex];
        existingItem.quantity += item.quantity;
        existingItem.isNewlyAdded = true;
        existingItem.addedAt = currentTime;
        return null; // Don't add as new item
      } else {
        // New item
        return {
          ...item,
          addedAt: currentTime,
          isNewlyAdded: true
        };
      }
    }).filter(item => item !== null);

    // Add new items to order
    order.items.push(...processedNewItems);

    // Update total amount
    const newTotalAmount = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    order.totalAmount = newTotalAmount;

    // Update timestamps
    order.timestamps.updated = currentTime;
    order.lastItemAddedAt = currentTime;

    await order.save();

    return NextResponse.json(
      { message: 'Items added successfully', order },
      { status: 200 }
    );
  } catch (error) {
    console.error('Add items to order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}