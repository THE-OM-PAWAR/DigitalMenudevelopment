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

    return NextResponse.json({ outlet });
  } catch (error) {
    console.error('Get outlet error:', error);
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
    const { name, logo, description, address, phone } = body;

    await connectDB();

    const outlet = await Outlet.findOneAndUpdate(
      {
        _id: params.id,
        adminUserId: user.userId,
      },
      {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
      },
      { new: true }
    );

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ outlet });
  } catch (error) {
    console.error('Update outlet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}