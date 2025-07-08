// ================================
// src/app/api/progress/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/lib/services/progress.service';

const progressService = new ProgressService();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workout_id');
    const exerciseId = searchParams.get('exercise_id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = {
      userId: parseInt(userId),
      workoutId: workoutId ? parseInt(workoutId) : undefined,
      exerciseId: exerciseId ? parseInt(exerciseId) : undefined
    };

    const progress = await progressService.getByUser(filters);
    return NextResponse.json(progress);
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
    const progressData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await progressService.create({
      ...progressData,
      user_id: parseInt(userId)
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 