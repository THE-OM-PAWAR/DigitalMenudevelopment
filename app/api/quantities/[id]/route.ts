import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quantity from '@/models/Quantity';
import { getAuthUser } from '@/lib/auth';

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

    const quantity = await Quantity.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!quantity) {
      return NextResponse.json({ error: 'Quantity not found' }, { status: 404 });
    }

    return NextResponse.json({ quantity });
  } catch (error) {
    console.error('Get quantity error:', error);
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
    const { value, description } = body;

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

    await connectDB();

    // Find the quantity
    const quantity = await Quantity.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!quantity) {
      return NextResponse.json({ error: 'Quantity not found' }, { status: 404 });
    }

    // Check if quantity with same value exists for this outlet (excluding current quantity)
    const existingQuantity = await Quantity.findOne({
      value: value,
      outletId: quantity.outletId,
      _id: { $ne: params.id },
    });

    if (existingQuantity) {
      return NextResponse.json(
        { error: 'Quantity with this value already exists' },
        { status: 409 }
      );
    }

    // Update quantity
    const updatedQuantity = await Quantity.findByIdAndUpdate(
      params.id,
      {
        value: value,
        description: description.trim(),
      },
      { new: true }
    );

    return NextResponse.json(
      { message: 'Quantity updated successfully', quantity: updatedQuantity },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update quantity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find the quantity
    const quantity = await Quantity.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!quantity) {
      return NextResponse.json({ error: 'Quantity not found' }, { status: 404 });
    }

    // Delete the quantity
    await Quantity.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: 'Quantity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete quantity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}