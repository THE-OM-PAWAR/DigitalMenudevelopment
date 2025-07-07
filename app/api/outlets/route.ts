import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Outlet from '@/models/Outlet';
import { OutletSchema } from '@/lib/validations';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(user.userId).populate('outletId');
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ outlet: userDoc.outletId });
  } catch (error) {
    console.error('Get outlets error:', error);
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
    
    // Validate input
    const validatedFields = OutletSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { name } = validatedFields.data;

    await connectDB();

    // Check if user already has an outlet
    const existingUser = await User.findById(user.userId);
    if (existingUser?.outletId) {
      return NextResponse.json(
        { error: 'User already has an outlet' },
        { status: 409 }
      );
    }

    // Create outlet
    const outlet = await Outlet.create({
      name,
      createdBy: user.userId,
      adminUserId: user.userId,
    });

    // Add outlet to user's outletId
    await User.findByIdAndUpdate(
      user.userId,
      { outletId: outlet._id }
    );

    return NextResponse.json(
      { message: 'Outlet created successfully', outlet },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create outlet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}