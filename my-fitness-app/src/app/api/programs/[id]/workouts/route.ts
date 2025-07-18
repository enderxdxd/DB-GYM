// ================================
// src/app/api/programs/[id]/workouts/route.ts
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program.service';

const programService = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔵 [PROGRAM_WORKOUTS] GET request for program ID:', params.id);

    const programId = parseInt(params.id);
    if (isNaN(programId) || programId <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid program ID. Must be a positive number.' 
        }, 
        { status: 400 }
      );
    }

    // Verificar se o programa existe
    const program = await programService.findById(programId);
    if (!program) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Program not found' 
        }, 
        { status: 404 }
      );
    }

    // Buscar os workouts do programa
    const workouts = await programService.getWorkouts(programId);
    
    console.log('✅ [PROGRAM_WORKOUTS] Found workouts:', workouts.length);
    
    return NextResponse.json({ 
      success: true, 
      data: workouts 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [PROGRAM_WORKOUTS] Error in GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch program workouts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}