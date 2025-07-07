import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import { getAuthUser } from '@/lib/auth';

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
    const { isHighlighted } = body;

    if (typeof isHighlighted !== 'boolean') {
      return NextResponse.json(
        { error: 'isHighlighted must be a boolean value' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the item
    const item = await Item.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update highlight status
    const updatedItem = await Item.findByIdAndUpdate(
      params.id,
      { isHighlighted },
      { new: true }
    )
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description');

    return NextResponse.json(
      { 
        message: `Item ${isHighlighted ? 'highlighted' : 'unhighlighted'} successfully`, 
        item: updatedItem 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update item highlight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}