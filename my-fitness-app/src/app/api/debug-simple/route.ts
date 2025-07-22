import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG-SIMPLE] Starting simple debug...');
    
    // 1. Verificar workouts no banco
    const workouts = await sql`
      SELECT 
        w.workout_id,
        w.title,
        w.program_id,
        w.created_at,
        p.title as program_title
      FROM workouts w
      LEFT JOIN programs p ON w.program_id = p.program_id
      ORDER BY w.created_at DESC
      LIMIT 10
    `;
    
    // 2. Verificar programas no banco
    const programs = await sql`
      SELECT program_id, title, trainer_id, created_at
      FROM programs
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    // 3. Verificar usuários no banco
    const users = await sql`
      SELECT user_id, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    // 4. Verificar headers da requisição
    const headers = Object.fromEntries(request.headers.entries());
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        database_status: {
          workouts_count: workouts.length,
          programs_count: programs.length,
          users_count: users.length
        },
        workouts: workouts.map(w => ({
          workout_id: w.workout_id,
          title: w.title,
          program_id: w.program_id,
          program_title: w.program_title,
          created_at: w.created_at
        })),
        programs: programs.map(p => ({
          program_id: p.program_id,
          title: p.title,
          trainer_id: p.trainer_id,
          created_at: p.created_at
        })),
        users: users.map(u => ({
          user_id: u.user_id,
          email: u.email,
          role: u.role,
          created_at: u.created_at
        })),
        request_info: {
          has_x_user_id: !!headers['x-user-id'],
          x_user_id: headers['x-user-id'],
          has_authorization: !!headers['authorization'],
          authorization_preview: headers['authorization'] ? 
            headers['authorization'].substring(0, 20) + '...' : null,
          user_agent: headers['user-agent'],
          origin: headers['origin']
        }
      }
    });
    
  } catch (error) {
    console.error('🔍 [DEBUG-SIMPLE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}
