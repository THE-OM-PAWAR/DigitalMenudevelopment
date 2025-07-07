import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
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

    const category = await Category.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
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
    const { name, description, image } = body;

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: 'Category name must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: 'Description must be less than 200 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the category
    const category = await Category.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category with same name exists for this outlet (excluding current category)
    const existingCategory = await Category.findOne({
      name: name.trim(),
      outletId: category.outletId,
      _id: { $ne: params.id },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    // If image is being changed, delete the old one from Cloudinary
    if (category.image && image !== category.image) {
      try {
        const publicId = extractPublicId(category.image);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with update even if old image deletion fails
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        description: description?.trim() || '',
        image: image || '',
      },
      { new: true }
    );

    return NextResponse.json(
      { message: 'Category updated successfully', category: updatedCategory },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update category error:', error);
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

    // Find the category
    const category = await Category.findOne({
      _id: params.id,
      createdBy: user.userId,
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (category.image) {
      try {
        const publicId = extractPublicId(category.image);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with category deletion even if image deletion fails
      }
    }

    // Delete the category
    await Category.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}