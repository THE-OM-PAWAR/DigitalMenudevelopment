import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Outlet from '@/models/Outlet';
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

    const outlet = await Outlet.findOne({
      _id: params.id,
      adminUserId: user.userId,
    });

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      orderManagementEnabled: outlet.orderManagementEnabled || false
    });
  } catch (error) {
    console.error('Get outlet settings error:', error);
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
    const { orderManagementEnabled } = body;

    if (typeof orderManagementEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'orderManagementEnabled must be a boolean' },
        { status: 400 }
      );
    }

    await connectDB();

    const outlet = await Outlet.findOneAndUpdate(
      {
        _id: params.id,
        adminUserId: user.userId,
      },
      { orderManagementEnabled },
      { new: true }
    );

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      orderManagementEnabled: outlet.orderManagementEnabled 
    });
  } catch (error) {
    console.error('Update outlet settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}