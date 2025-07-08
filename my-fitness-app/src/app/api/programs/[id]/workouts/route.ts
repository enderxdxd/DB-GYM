// ================================
// src/app/api/programs/[id]/workouts/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';

const workoutService = new WorkoutService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workouts = await workoutService.getByProgramId(parseInt(params.id));
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}