// ================================
// src/app/api/workouts/[id]/exercises/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/lib/services/exercise.service';

const exerciseService = new ExerciseService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exercises = await exerciseService.getByWorkoutId(parseInt(params.id));
    return NextResponse.json(exercises);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}