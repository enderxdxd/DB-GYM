import { NextRequest, NextResponse } from 'next/server';
import { TrainerService } from '@/lib/services/trainer.service';

const trainerService = new TrainerService();

export async function GET() {
  try {
    const trainers = await trainerService.getAll();
    return NextResponse.json(trainers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const trainerData = await request.json();
    const trainer = await trainerService.create(trainerData);
    return NextResponse.json(trainer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}