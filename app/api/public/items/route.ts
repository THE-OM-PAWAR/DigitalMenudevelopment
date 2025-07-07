import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Item, Category, Quantity } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting items API request...');
    
    // Ensure database connection is established
    await connectDB();
    console.log('Database connected successfully');

    const outletId = request.nextUrl.searchParams.get('outletId');
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    
    console.log('Request params:', { outletId, categoryId });
    
    if (!outletId) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 });
    }

    // Validate outlet ID format
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return NextResponse.json({ error: 'Invalid outlet ID format' }, { status: 400 });
    }

    const query: any = {
      outletId: new mongoose.Types.ObjectId(outletId),
      isActive: true,
      isAvailable: true,
    };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    console.log('Query:', query);

    // Make sure all models are registered before the query
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description')
      .select('-createdBy -isActive -isAvailable')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean(); // Use lean() for better performance on read-only operations

    console.log('Found items:', items?.length || 0);

    return NextResponse.json({ items: items || [] });
  } catch (error: any) {
    console.error('Get public items error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}