import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/lib/services/workout.service';
import { sql } from '@/lib/database/neon';

const workoutService = new WorkoutService();

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
      SELECT * FROM workouts WHERE workout_id = ${workoutId}
    `;
    
    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result[0] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/workouts/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const updateData = await request.json();
    
    // Validar datos mínimos
    if (!updateData.title || !updateData.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE workouts
      SET 
        title = ${updateData.title},
        description = ${updateData.description || null},
        sequence_order = ${updateData.sequence_order || 0}
      WHERE workout_id = ${workoutId}
      RETURNING *
    `;
    
    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result[0] }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/workouts/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    await sql`DELETE FROM workouts WHERE workout_id = ${workoutId}`;
    
    return NextResponse.json(
      { success: true, message: 'Workout deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/workouts/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}