import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import Category from '@/models/Category';
import Quantity from '@/models/Quantity';
import { getAuthUser } from '@/lib/auth';
import { extractPublicId, deleteFromCloudinary } from '@/lib/cloudinary';

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

    const item = await Item.findOne({
      _id: params.id,
      createdBy: user.userId,
    })
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description');

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
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
    const { 
      name, 
      description, 
      image, 
      categoryId, 
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

    // Find the item
    const item = await Item.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

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

    // Check if item with same name exists for this outlet (excluding current item)
    const existingItem = await Item.findOne({
      name: name.trim(),
      outletId: item.outletId,
      _id: { $ne: params.id },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item with this name already exists' },
        { status: 409 }
      );
    }

    // If image is being changed, delete the old one from Cloudinary
    if (item.image && image !== item.image) {
      try {
        const publicId = extractPublicId(item.image);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with update even if old image deletion fails
      }
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        description: description.trim(),
        image: image || '',
        categoryId,
        isVeg: isVeg !== undefined ? isVeg : true,
        quantityPrices,
      },
      { new: true }
    )
      .populate('categoryId', 'name')
      .populate('quantityPrices.quantityId', 'value description');

    return NextResponse.json(
      { message: 'Item updated successfully', item: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update item error:', error);
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

    // Find the item
    const item = await Item.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (item.image) {
      try {
        const publicId = extractPublicId(item.image);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with item deletion even if image deletion fails
      }
    }

    // Delete the item
    await Item.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: 'Item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}