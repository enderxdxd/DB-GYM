// ================================
// src/app/api/reviews/[id]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/lib/services/review.service';

const reviewService = new ReviewService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await reviewService.findById(parseInt(params.id));
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    const review = await reviewService.update(parseInt(params.id), updateData);
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await reviewService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 