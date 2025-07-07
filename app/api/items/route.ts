import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import Category from '@/models/Category';
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
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    
    const query: any = {
      createdBy: user.userId,
    };

    if (outletId) {
      query.outletId = outletId;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description')
      .sort({ sortOrder: 1, createdAt: -1 });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
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
    const { 
      name, 
      description, 
      image, 
      categoryId, 
      outletId, 
      isVeg,
      quantityPrices
    } = body;

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Item name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be less than 500 characters' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!outletId) {
      return NextResponse.json(
        { error: 'Outlet ID is required' },
        { status: 400 }
      );
    }

    if (!quantityPrices || !Array.isArray(quantityPrices) || quantityPrices.length === 0) {
      return NextResponse.json(
        { error: 'At least one quantity and price is required' },
        { status: 400 }
      );
    }

    // Validate quantity prices
    for (const qp of quantityPrices) {
      if (!qp.quantityId || !qp.price || qp.price <= 0) {
        return NextResponse.json(
          { error: 'All quantity prices must have valid quantity and positive price' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Verify category exists and belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      createdBy: user.userId,
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Verify quantities exist and belong to user
    const quantityIds = quantityPrices.map(qp => qp.quantityId);
    const quantities = await Quantity.find({
      _id: { $in: quantityIds },
      createdBy: user.userId,
    });

    if (quantities.length !== quantityIds.length) {
      return NextResponse.json(
        { error: 'One or more quantities not found' },
        { status: 404 }
      );
    }

    // Check if item with same name exists for this outlet
    const existingItem = await Item.findOne({
      name: name.trim(),
      outletId,
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item with this name already exists' },
        { status: 409 }
      );
    }

    // Create item
    const item = await Item.create({
      name: name.trim(),
      description: description.trim(),
      image: image || '',
      categoryId,
      outletId,
      createdBy: user.userId,
      isVeg: isVeg !== undefined ? isVeg : true,
      quantityPrices,
    });

    // Populate the created item
    const populatedItem = await Item.findById(item._id)
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description');

    return NextResponse.json(
      { message: 'Item created successfully', item: populatedItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}