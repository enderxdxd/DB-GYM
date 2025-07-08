// ================================
// src/app/api/reviews/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/lib/services/review.service';

const reviewService = new ReviewService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const trainerId = searchParams.get('trainer_id');

    const filters = {
      programId: programId ? parseInt(programId) : undefined,
      trainerId: trainerId ? parseInt(trainerId) : undefined
    };

    const reviews = await reviewService.getAll(filters);
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const reviewData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await reviewService.create({
      ...reviewData,
      user_id: parseInt(userId)
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 