// ================================
// src/app/api/progress/stats/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/lib/services/progress.service';

const progressService = new ProgressService();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await progressService.getStats(parseInt(userId));
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 