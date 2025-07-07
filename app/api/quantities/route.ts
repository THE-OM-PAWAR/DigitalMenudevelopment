import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quantity from '@/models/Quantity';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const outletId = request.nextUrl.searchParams.get('outletId');
    
    const quantities = await Quantity.find({
      ...(outletId && { outletId }),
      createdBy: user.userId,
    }).sort({ sortOrder: 1, createdAt: -1 });

    return NextResponse.json({ quantities });
  } catch (error) {
    console.error('Get quantities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { value, description, outletId } = body;

    // Validate input
    if (!value || !value.toString().trim()) {
      return NextResponse.json(
        { error: 'Quantity value is required' },
        { status: 400 }
      );
    }

    if (value.toString().length > 50) {
      return NextResponse.json(
        { error: 'Quantity value must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 200) {
      return NextResponse.json(
        { error: 'Description must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (!outletId) {
      return NextResponse.json(
        { error: 'Outlet ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if quantity with same value exists for this outlet
    const existingQuantity = await Quantity.findOne({
      value: value,
      outletId,
    });

    if (existingQuantity) {
      return NextResponse.json(
        { error: 'Quantity with this value already exists' },
        { status: 409 }
      );
    }

    // Create quantity
    const quantity = await Quantity.create({
      value: value,
      description: description.trim(),
      outletId,
      createdBy: user.userId,
    });

    return NextResponse.json(
      { message: 'Quantity created successfully', quantity },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create quantity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}