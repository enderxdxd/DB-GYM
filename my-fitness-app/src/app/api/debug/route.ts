import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';
import { getAuthContext } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Starting workout debug...');
    
    const userId = request.headers.get('x-user-id');
    console.log('🔍 [DEBUG] User ID from header:', userId);
    
    // 1. Verificar se há workouts no banco
    const allWorkouts = await sql`SELECT * FROM workouts ORDER BY created_at DESC LIMIT 5`;
    console.log('🔍 [DEBUG] Sample workouts:', allWorkouts.length);
    
    // 2. Verificar se há programas no banco
    const allPrograms = await sql`SELECT * FROM programs LIMIT 3`;
    console.log('🔍 [DEBUG] Sample programs:', allPrograms.length);
    
    // 3. Verificar informações do usuário
    let userInfo = null;
    let authContext = null;
    
    if (userId) {
      try {
        const userResult = await sql`SELECT * FROM users WHERE user_id = ${parseInt(userId)}`;
        userInfo = userResult[0] || null;
        console.log('🔍 [DEBUG] User found:', !!userInfo);
        
        if (userInfo) {
          authContext = await getAuthContext(userId);
          console.log('🔍 [DEBUG] Auth context created:', !!authContext);
        }
      } catch (error) {
        console.error('🔍 [DEBUG] Error getting user info:', error);
      }
    }
    
    // 4. Testar query de workouts para trainers
    let trainerWorkouts = [];
    try {
      trainerWorkouts = await sql`
        SELECT 
          w.workout_id,
          w.title,
          w.created_at,
          p.title as program_title
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        ORDER BY w.created_at DESC
        LIMIT 5
      `;
      console.log('🔍 [DEBUG] Trainer query result:', trainerWorkouts.length);
    } catch (error) {
      console.error('🔍 [DEBUG] Error in trainer query:', error);
    }
    
    return NextResponse.json({
      success: true,
      debug_info: {
        request: {
          userId,
          hasUserIdHeader: !!userId,
          allHeaders: Object.fromEntries(request.headers.entries())
        },
        database: {
          total_workouts: allWorkouts.length,
          total_programs: allPrograms.length,
          sample_workouts: allWorkouts.map(w => ({
            workout_id: w.workout_id,
            title: w.title,
            program_id: w.program_id,
            created_at: w.created_at
          })),
          sample_programs: allPrograms.map(p => ({
            program_id: p.program_id,
            title: p.title,
            trainer_id: p.trainer_id
          }))
        },
        user: {
          found: !!userInfo,
          info: userInfo ? {
            user_id: userInfo.user_id,
            email: userInfo.email,
            role: userInfo.role
          } : null,
          auth_context: authContext ? {
            isTrainer: authContext.isTrainer,
            isClient: authContext.isClient
          } : null
        },
        queries: {
          trainer_workouts_count: trainerWorkouts.length,
          trainer_workouts: trainerWorkouts
        }
      }
    });
    
  } catch (error) {
    console.error('🔍 [DEBUG] Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
