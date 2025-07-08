import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/lib/services/exercise.service';

const exerciseService = new ExerciseService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exercise = await exerciseService.findById(parseInt(params.id));
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    return NextResponse.json(exercise);
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
    const exercise = await exerciseService.update(parseInt(params.id), updateData);
    return NextResponse.json(exercise);
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
    await exerciseService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}