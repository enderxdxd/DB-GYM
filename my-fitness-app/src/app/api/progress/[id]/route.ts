// ================================
// src/app/api/progress/[id]/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/lib/services/progress.service';

const progressService = new ProgressService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const progress = await progressService.findById(parseInt(params.id));
    if (!progress) {
      return NextResponse.json({ error: 'Progress log not found' }, { status: 404 });
    }
    return NextResponse.json(progress);
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
    const progress = await progressService.update(parseInt(params.id), updateData);
    return NextResponse.json(progress);
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
    await progressService.delete(parseInt(params.id));
    return NextResponse.json({ message: 'Progress log deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 