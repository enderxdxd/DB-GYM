// ================================
// src/app/api/workouts/[id]/exercises/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/lib/services/exercise.service';
import { sql } from '@/lib/database/neon';

const exerciseService = new ExerciseService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = parseInt(params.id);
    
    if (isNaN(workoutId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workout ID' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      SELECT * FROM exercises 
      WHERE workout_id = ${workoutId}
      ORDER BY order_index ASC
    `;
    
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/workouts/[id]/exercises:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}