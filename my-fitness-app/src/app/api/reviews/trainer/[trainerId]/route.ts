// ================================
// src/app/api/reviews/trainer/[trainerId]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/lib/services/review.service';

const reviewService = new ReviewService();

export async function GET(
  request: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  try {
    const reviews = await reviewService.getByTrainerId(parseInt(params.trainerId));
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 