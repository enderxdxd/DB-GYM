import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';
import { sql } from '@/lib/database/neon';

const workoutService = new WorkoutService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');

    if (programId) {
      const result = await sql`
        SELECT * FROM workouts 
        WHERE program_id = ${parseInt(programId)}
        ORDER BY sequence_order ASC
      `;
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    const result = await sql`SELECT * FROM workouts ORDER BY sequence_order ASC`;
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/workouts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const workoutData = await request.json();
    
    if (!workoutData.program_id) {
      return NextResponse.json(
        { success: false, error: 'Program ID is required' },
        { status: 400 }
      );
    }
    
    if (!workoutData.title || !workoutData.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO workouts (program_id, title, description, sequence_order)
      VALUES (
        ${workoutData.program_id}, 
        ${workoutData.title}, 
        ${workoutData.description || null}, 
        ${workoutData.sequence_order || 0}
      )
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workouts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}