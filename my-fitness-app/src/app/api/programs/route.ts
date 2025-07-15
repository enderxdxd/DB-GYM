import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program.service';
import { sql } from '@/lib/database/neon';

const programService = new ProgramService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const trainerId = searchParams.get('trainer_id');

    // Build query parameters
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push(`p.category = $${params.length + 1}`);
      params.push(category);
    }

    if (difficulty) {
      conditions.push(`p.difficulty_level = $${params.length + 1}`);
      params.push(difficulty);
    }

    if (trainerId) {
      conditions.push(`p.trainer_id = $${params.length + 1}`);
      params.push(parseInt(trainerId));
    }

    // Build the WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Execute the query properly
    try {
      const result = await sql`
        SELECT p.*, t.first_name as trainer_first_name, t.last_name as trainer_last_name
        FROM programs p
        LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
        ${sql.unsafe(whereClause)}
        ORDER BY p.created_at DESC
      `;
      
      console.log('Programs result:', result);
      
      // If no programs found, create a test program
      if (!result || result.length === 0) {
        console.log('No programs found, creating a test program...');
        
        const testProgram = {
          title: "Test Fitness Program",
          description: "A test program created for demonstration purposes",
          category: "Strength",
          difficulty_level: "beginner",
          duration_weeks: 4,
          price: 0
        };
        
        const insertResult = await sql`
          INSERT INTO programs (title, description, category, difficulty_level, duration_weeks, price)
          VALUES (${testProgram.title}, ${testProgram.description}, ${testProgram.category}, 
                  ${testProgram.difficulty_level}, ${testProgram.duration_weeks}, ${testProgram.price})
          RETURNING *
        `;
        
        console.log('Created test program:', insertResult);
        
        return NextResponse.json({ success: true, data: insertResult }, { status: 200 });
      }
      
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error) {
      console.error('Error executing SQL query:', error);
      return NextResponse.json(
        { success: false, error: 'Database query error', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/programs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const programData = await request.json();
    
    const result = await sql`
      INSERT INTO programs (title, description, category, difficulty_level, duration_weeks, price)
      VALUES (${programData.title}, ${programData.description || null}, ${programData.category},
              ${programData.difficulty_level}, ${programData.duration_weeks || null}, ${programData.price || 0})
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/programs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}