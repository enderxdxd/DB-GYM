import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/lib/services/exercise.service';

const exerciseService = new ExerciseService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workout_id');

    if (workoutId) {
      const exercises = await exerciseService.getByWorkoutId(parseInt(workoutId));
      return NextResponse.json(exercises);
    }

    const exercises = await exerciseService.getAll();
    return NextResponse.json(exercises);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const exerciseData = await request.json();
    const exercise = await exerciseService.create(exerciseData);
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}