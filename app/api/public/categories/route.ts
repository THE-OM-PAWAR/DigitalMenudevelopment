import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Category } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting categories API request...');
    
    // Ensure database connection is established
    await connectDB();
    console.log('Database connected successfully');

    const outletId = request.nextUrl.searchParams.get('outletId');
    
    console.log('Request params:', { outletId });
    
    if (!outletId) {
      return NextResponse.json({ error: 'Outlet ID is required' }, { status: 400 });
    }

    // Validate outlet ID format
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return NextResponse.json({ error: 'Invalid outlet ID format' }, { status: 400 });
    }

    const categories = await Category.find({
      outletId: new mongoose.Types.ObjectId(outletId),
      isActive: true,
    })
      .select('-createdBy -isActive')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log('Found categories:', categories?.length || 0);

    return NextResponse.json({ categories: categories || [] });
  } catch (error: any) {
    console.error('Get public categories error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}