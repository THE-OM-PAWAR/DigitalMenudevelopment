import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Outlet } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting outlet API request for ID:', params.id);
    
    // Ensure database connection is established
    await connectDB();
    console.log('Database connected successfully');

    // Validate outlet ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid outlet ID format' }, { status: 400 });
    }

    const outlet = await Outlet.findById(params.id)
      .select('-createdBy -adminUserId')
      .lean(); // Use lean() for better performance

    console.log('Found outlet:', outlet ? 'Yes' : 'No');

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ outlet });
  } catch (error: any) {
    console.error('Get public outlet error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}