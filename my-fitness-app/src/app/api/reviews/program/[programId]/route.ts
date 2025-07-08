// ================================
// src/app/api/reviews/program/[programId]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/lib/services/review.service';

const reviewService = new ReviewService();

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const reviews = await reviewService.getByProgramId(parseInt(params.programId));
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 