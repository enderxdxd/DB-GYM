import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';

const workoutService = new WorkoutService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');

    if (programId) {
      const workouts = await workoutService.getByProgramId(parseInt(programId));
      return NextResponse.json(workouts);
    }

    const workouts = await workoutService.getAll();
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const workoutData = await request.json();
    const workout = await workoutService.create(workoutData);
    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}