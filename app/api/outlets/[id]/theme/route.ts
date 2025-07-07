import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Outlet from '@/models/Outlet';
import { getAuthUser } from '@/lib/auth';
import { menuThemes } from '@/lib/themes';

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
      theme: outlet.theme || 'modern'
    });
  } catch (error) {
    console.error('Get outlet theme error:', error);
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
    const { theme } = body;

    // Validate theme
    const validTheme = menuThemes.find(t => t.id === theme);
    if (!validTheme) {
      return NextResponse.json(
        { error: 'Invalid theme selected' },
        { status: 400 }
      );
    }

    await connectDB();

    const outlet = await Outlet.findOneAndUpdate(
      {
        _id: params.id,
        adminUserId: user.userId,
      },
      { theme },
      { new: true }
    );

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Theme updated successfully',
      theme: outlet.theme 
    });
  } catch (error) {
    console.error('Update outlet theme error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}