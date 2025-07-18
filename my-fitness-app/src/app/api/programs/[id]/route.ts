// ================================
// src/app/api/programs/[id]/route.ts - VERSÃO CORRIGIDA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program.service';

const programService = new ProgramService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔵 [PROGRAM_ID] GET request for program ID:', params.id);

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

    console.log('✅ [PROGRAM_ID] Program found:', program.title);
    
    return NextResponse.json({ 
      success: true, 
      data: program 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [PROGRAM_ID] Error in GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch program',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔵 [PROGRAM_ID] PUT request for program ID:', params.id);

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

    const updateData = await request.json();
    console.log('🔵 [PROGRAM_ID] Update data:', updateData);

    // Validações básicas
    if (updateData.title !== undefined && !updateData.title?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Title cannot be empty' 
        }, 
        { status: 400 }
      );
    }

    if (updateData.category !== undefined) {
      const validCategories = ['Strength', 'Yoga', 'Cardio', 'HIIT', 'Pilates', 'Other'];
      if (!validCategories.includes(updateData.category)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
          }, 
          { status: 400 }
        );
      }
    }

    if (updateData.difficulty_level !== undefined) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(updateData.difficulty_level)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}` 
          }, 
          { status: 400 }
        );
      }
    }

    if (updateData.duration_weeks !== undefined && updateData.duration_weeks !== null) {
      const duration = parseInt(updateData.duration_weeks);
      if (isNaN(duration) || duration <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Duration weeks must be a positive number' 
          }, 
          { status: 400 }
        );
      }
    }

    if (updateData.price !== undefined && updateData.price !== null) {
      const price = parseFloat(updateData.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Price must be a non-negative number' 
          }, 
          { status: 400 }
        );
      }
    }

    const updatedProgram = await programService.update(programId, updateData);
    
    console.log('✅ [PROGRAM_ID] Program updated successfully:', updatedProgram.title);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedProgram,
      message: 'Program updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [PROGRAM_ID] Error in PUT:', error);
    
    let errorMessage = 'Failed to update program';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'Program not found';
        statusCode = 404;
      } else if (error.message.includes('Invalid')) {
        errorMessage = error.message;
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔵 [PROGRAM_ID] DELETE request for program ID:', params.id);

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

    await programService.delete(programId);
    
    console.log('✅ [PROGRAM_ID] Program deleted successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Program deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [PROGRAM_ID] Error in DELETE:', error);
    
    let errorMessage = 'Failed to delete program';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'Program not found';
        statusCode = 404;
      } else if (error.message.includes('active subscriptions')) {
        errorMessage = 'Cannot delete program with active subscriptions';
        statusCode = 400;
      } else if (error.message.includes('Invalid')) {
        errorMessage = error.message;
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
    );
  }
}