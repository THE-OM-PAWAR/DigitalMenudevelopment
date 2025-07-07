import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const success = await deleteFromCloudinary(publicId);

    if (success) {
      return NextResponse.json(
        { message: 'Image deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to delete image from Cloudinary' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}