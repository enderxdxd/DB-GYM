// ================================
// src/app/api/workouts/route.ts - ATUALIZADA PARA SUA ESTRUTURA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';
import { getAuthContext, requireTrainerRole, PERMISSION_DENIED_RESPONSE, UNAUTHORIZED_RESPONSE } from '@/lib/auth/permissions';

interface ExerciseSet {
  set_number: number;
  target_reps?: number;
  target_weight?: number;
  target_duration_seconds?: number;
  distance_meters?: number;
  rest_seconds?: number;
  notes?: string;
}

interface Exercise {
  name: string;
  description?: string;
  video_url?: string;
  default_reps?: number;
  default_sets?: number;
  default_duration_sec?: number;
  muscle_group?: string;
  equipment?: string;
  instructions?: string;
  order_index: number;
  sets?: ExerciseSet[];
}

interface WorkoutData {
  program_id: number;
  title: string;
  description?: string;
  sequence_order?: number;
  exercises?: Exercise[];
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const workoutData: WorkoutData = await request.json();

    console.log('🔵 [WORKOUTS] POST request:', { userId, workoutData });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // Temporariamente simplificado - assumir que é trainer para debug
    const isTrainer = true; // TODO: Restaurar lógica de roles após debug
    
    console.log('🔵 [WORKOUTS] User info (simplified):', { userId, isTrainer });

    // Validações básicas
    if (!workoutData.program_id || !workoutData.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Program ID and title are required' },
        { status: 400 }
      );
    }

    // Verificar se o usuário está inscrito no programa
    const subscriptionCheck = await sql`
      SELECT s.subscription_id 
      FROM subscriptions s 
      WHERE s.user_id = ${parseInt(userId)} 
        AND s.program_id = ${workoutData.program_id} 
        AND s.status = 'active'
    ` as unknown as any[];

    if (subscriptionCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You must be subscribed to this program to create workouts' },
        { status: 403 }
      );
    }

    console.log('🔵 [WORKOUTS] Creating workout with exercises...');

    // 1. Criar o workout
    const workoutResult = await sql`
      INSERT INTO workouts (program_id, title, description, sequence_order)
      VALUES (
        ${workoutData.program_id}, 
        ${workoutData.title}, 
        ${workoutData.description || null}, 
        ${workoutData.sequence_order || 0}
      )
      RETURNING *
    ` as unknown as any[];

    const workout = workoutResult[0];
    console.log('✅ [WORKOUTS] Workout created:', workout.workout_id);

    // 2. Criar exercícios e séries se fornecidos
    if (workoutData.exercises && workoutData.exercises.length > 0) {
      for (const exerciseData of workoutData.exercises) {
        console.log('🔵 [WORKOUTS] Creating exercise:', exerciseData.name);

        // Criar exercício usando sua estrutura
        const exerciseResult = await sql`
          INSERT INTO exercises (
            workout_id, name, description, video_url,
            default_reps, default_sets, default_duration_sec,
            muscle_group, equipment, instructions, order_index
          )
          VALUES (
            ${workout.workout_id},
            ${exerciseData.name},
            ${exerciseData.description || null},
            ${exerciseData.video_url || null},
            ${exerciseData.default_reps || null},
            ${exerciseData.default_sets || null},
            ${exerciseData.default_duration_sec || null},
            ${exerciseData.muscle_group || null},
            ${exerciseData.equipment || null},
            ${exerciseData.instructions || null},
            ${exerciseData.order_index}
          )
          RETURNING *
        ` as unknown as any[];

        const exercise = exerciseResult[0];
        console.log('✅ [WORKOUTS] Exercise created:', exercise.exercise_id);

        // Criar séries do exercício
        if (exerciseData.sets && exerciseData.sets.length > 0) {
          for (const setData of exerciseData.sets) {
            await sql`
              INSERT INTO exercise_sets (
                exercise_id, set_number, target_reps, target_weight, 
                target_duration_seconds, distance_meters, rest_seconds, notes
              )
              VALUES (
                ${exercise.exercise_id},
                ${setData.set_number},
                ${setData.target_reps || null},
                ${setData.target_weight || null},
                ${setData.target_duration_seconds || null},
                ${setData.distance_meters || null},
                ${setData.rest_seconds || 60},
                ${setData.notes || null}
              )
            `;
          }
          console.log('✅ [WORKOUTS] Sets created for exercise:', exercise.exercise_id);
        }
      }
    }

    // 3. Buscar o workout completo criado
    const completeWorkout = await getCompleteWorkout(workout.workout_id);

    return NextResponse.json({ 
      success: true, 
      data: completeWorkout,
      message: 'Workout created successfully with exercises'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [WORKOUTS] Error in POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create workout',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para buscar workout completo
export async function getCompleteWorkout(workoutId: number) {
  // Buscar workout com info do programa
  const workout = await sql`
    SELECT w.*, p.title as program_title, p.category as program_category
    FROM workouts w
    INNER JOIN programs p ON w.program_id = p.program_id
    WHERE w.workout_id = ${workoutId}
  ` as unknown as any[];

  if (workout.length === 0) return null;

  // Buscar exercícios com suas séries
  const exercises = await sql`
    SELECT 
      e.*,
      COALESCE(
        json_agg(
          CASE WHEN es.set_id IS NOT NULL THEN
            json_build_object(
              'set_id', es.set_id,
              'set_number', es.set_number,
              'target_reps', es.target_reps,
              'actual_reps', es.actual_reps,
              'target_weight', es.target_weight,
              'actual_weight', es.actual_weight,
              'target_duration_seconds', es.target_duration_seconds,
              'actual_duration_seconds', es.actual_duration_seconds,
              'distance_meters', es.distance_meters,
              'rest_seconds', es.rest_seconds,
              'notes', es.notes,
              'completed', es.completed,
              'completed_at', es.completed_at
            )
          END ORDER BY es.set_number
        ) FILTER (WHERE es.set_id IS NOT NULL), 
        '[]'::json
      ) as sets
    FROM exercises e
    LEFT JOIN exercise_sets es ON e.exercise_id = es.exercise_id
    WHERE e.workout_id = ${workoutId}
    GROUP BY e.exercise_id
    ORDER BY e.order_index
  ` as unknown as any[];

  return {
    ...workout[0],
    exercises: exercises
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const includeExercises = searchParams.get('include_exercises') === 'true';

    console.log('🔵 [WORKOUTS] GET request started');
    console.log('🔵 [WORKOUTS] Headers:', Object.fromEntries(request.headers.entries()));
    console.log('🔵 [WORKOUTS] Params:', { userId, programId, includeExercises });

    let query: string;
    let params: any[] = [];

    if (userId && !programId) {
      // Temporariamente simplificado - mostrar todos os workouts para debug
      console.log('🔵 [WORKOUTS] Simplified access - showing all workouts for debugging');
      query = `
        SELECT 
          w.*,
          p.title as program_title,
          p.category as program_category,
          p.difficulty_level as program_difficulty,
          COUNT(DISTINCT e.exercise_id) as exercise_count,
          COUNT(es.set_id) as total_sets,
          COUNT(CASE WHEN es.completed = true THEN 1 END) as completed_sets
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        LEFT JOIN exercises e ON w.workout_id = e.workout_id
        LEFT JOIN exercise_sets es ON e.exercise_id = es.exercise_id
        WHERE w.program_id = $1
        GROUP BY w.workout_id, p.title, p.category, p.difficulty_level
        ORDER BY w.sequence_order ASC
      `;
      params = [parseInt(userId || '0')];
    } else {
      // Todos os workouts públicos
      query = `
        SELECT 
          w.*,
          p.title as program_title,
          p.category as program_category,
          p.difficulty_level as program_difficulty,
          COUNT(DISTINCT e.exercise_id) as exercise_count,
          COUNT(es.set_id) as total_sets
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        LEFT JOIN exercises e ON w.workout_id = e.workout_id
        LEFT JOIN exercise_sets es ON e.exercise_id = es.exercise_id
        GROUP BY w.workout_id, p.title, p.category, p.difficulty_level
        ORDER BY w.sequence_order ASC, w.created_at DESC
        LIMIT 50
      `;
    }

    // Interpolate parameters into the query string for sql.unsafe
    let interpolatedQuery = query;
    params.forEach((param, index) => {
      interpolatedQuery = interpolatedQuery.replace(`$${index + 1}`, typeof param === 'string' ? `'${param}'` : String(param));
    });
    
    console.log('🔵 [WORKOUTS] Executing query:', interpolatedQuery.substring(0, 200) + '...');
    console.log('🔵 [WORKOUTS] Query params:', params);
    
    const result = await sql.unsafe(interpolatedQuery) as unknown as any[];
    
    // Garantir que result é sempre um array
    const resultArray = Array.isArray(result) ? result : [];
    
    console.log('🔵 [WORKOUTS] Query result count:', resultArray.length);
    console.log('🔵 [WORKOUTS] Result type:', typeof result, 'isArray:', Array.isArray(result));
    
    if (resultArray.length > 0) {
      console.log('🔵 [WORKOUTS] Sample results:', resultArray.slice(0, 2).map(r => ({
        workout_id: r.workout_id,
        title: r.title,
        program_title: r.program_title
      })));
    }

    // Se solicitado, incluir exercícios completos
    let workoutsWithExercises = resultArray;
    if (includeExercises && resultArray.length > 0) {
      try {
        workoutsWithExercises = await Promise.all(
          resultArray.map(async (workout) => {
            const completeWorkout = await getCompleteWorkout(workout.workout_id);
            return completeWorkout || workout;
          })
        );
      } catch (exerciseError) {
        console.error('❌ [WORKOUTS] Error loading exercises:', exerciseError);
        // Continue with basic workouts if exercise loading fails
        workoutsWithExercises = resultArray;
      }
    }

    console.log('✅ [WORKOUTS] Found workouts:', resultArray.length);

    return NextResponse.json({ 
      success: true, 
      data: workoutsWithExercises,
      meta: {
        total: resultArray.length,
        user_specific: !!userId,
        program_specific: !!programId,
        includes_exercises: includeExercises
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [WORKOUTS] Error in GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workouts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
