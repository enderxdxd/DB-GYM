import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program.service';

const programService = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const program = await programService.findById(parseInt(params.id));
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    return NextResponse.json(program);
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
    const program = await programService.update(parseInt(params.id), updateData);
    return NextResponse.json(program);
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
    await programService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}