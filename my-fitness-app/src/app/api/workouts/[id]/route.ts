import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';

const workoutService = new WorkoutService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workout = await workoutService.findById(parseInt(params.id));
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    return NextResponse.json(workout);
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
    const workout = await workoutService.update(parseInt(params.id), updateData);
    return NextResponse.json(workout);
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
    await workoutService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}