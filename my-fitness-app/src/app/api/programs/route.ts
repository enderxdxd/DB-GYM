import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program.service';

const programService = new ProgramService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const trainerId = searchParams.get('trainer_id');

    const programs = await programService.getAll({
      category,
      difficulty,
      trainerId: trainerId ? parseInt(trainerId) : undefined
    });

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const programData = await request.json();
    const program = await programService.create(programData);
    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}