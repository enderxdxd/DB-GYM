import { NextRequest, NextResponse } from 'next/server';
import { TrainerService } from '@/lib/services/trainer.service';

const trainerService = new TrainerService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trainer = await trainerService.findById(parseInt(params.id));
    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }
    return NextResponse.json(trainer);
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
    const trainer = await trainerService.update(parseInt(params.id), updateData);
    return NextResponse.json(trainer);
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
    await trainerService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}