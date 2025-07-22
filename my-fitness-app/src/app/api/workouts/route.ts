// ================================
// src/app/api/workouts/route.ts - CORRIGIDA
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database/neon';

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

// Função auxiliar para buscar workout completo
export async function getCompleteWorkout(workoutId: number) {
  try {
    console.log('🔵 [WORKOUTS] Getting complete workout:', workoutId);

    // Buscar workout com info do programa
    const workout = await sql`
      SELECT w.*, p.title as program_title, p.category as program_category
      FROM workouts w
      INNER JOIN programs p ON w.program_id = p.program_id
      WHERE w.workout_id = ${workoutId}
    ` as unknown as any[];

    if (workout.length === 0) {
      console.log('🔶 [WORKOUTS] Workout not found:', workoutId);
      return null;
    }

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
  } catch (error) {
    console.error('❌ [WORKOUTS] Error getting complete workout:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const includeExercises = searchParams.get('include_exercises') === 'true';

    console.log('🔵 [WORKOUTS] GET request started');
    console.log('🔵 [WORKOUTS] Params:', { userId, programId, includeExercises });

    let workouts: any[] = [];

    if (programId) {
      // Buscar workouts de um programa específico
      console.log('🔵 [WORKOUTS] Fetching workouts for program:', programId);
      
      workouts = await sql`
        SELECT 
          w.*,
          p.title as program_title,
          p.category as program_category
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        WHERE w.program_id = ${parseInt(programId)}
        ORDER BY w.sequence_order ASC, w.created_at DESC
      ` as unknown as any[];

    } else if (userId) {
      // Buscar todos os workouts do usuário baseado nas suas subscriptions
      console.log('🔵 [WORKOUTS] Fetching workouts for user:', userId);
      
      workouts = await sql`
        SELECT DISTINCT
          w.*,
          p.title as program_title,
          p.category as program_category
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        INNER JOIN subscriptions s ON s.program_id = p.program_id
        WHERE s.user_id = ${parseInt(userId)} 
          AND s.status = 'active'
        ORDER BY w.created_at DESC
      ` as unknown as any[];

    } else {
      // Fallback: buscar todos os workouts (para debug)
      console.log('🔵 [WORKOUTS] Fetching all workouts (fallback)');
      
      workouts = await sql`
        SELECT 
          w.*,
          p.title as program_title,
          p.category as program_category
        FROM workouts w
        INNER JOIN programs p ON w.program_id = p.program_id
        ORDER BY w.created_at DESC
        LIMIT 50
      ` as unknown as any[];
    }

    console.log('🔵 [WORKOUTS] Found workouts:', workouts.length);

    if (workouts.length > 0) {
      console.log('🔵 [WORKOUTS] Sample results:', workouts.slice(0, 2).map(w => ({
        workout_id: w.workout_id,
        title: w.title,
        program_title: w.program_title
      })));
    }

    // Se solicitado, incluir exercícios completos
    let workoutsWithExercises = workouts;
    if (includeExercises && workouts.length > 0) {
      console.log('🔵 [WORKOUTS] Including exercises for workouts');
      
      try {
        workoutsWithExercises = await Promise.all(
          workouts.map(async (workout) => {
            const completeWorkout = await getCompleteWorkout(workout.workout_id);
            return completeWorkout || workout;
          })
        );
      } catch (exerciseError) {
        console.error('❌ [WORKOUTS] Error loading exercises:', exerciseError);
        // Continue with basic workouts if exercise loading fails
        workoutsWithExercises = workouts;
      }
    }

    console.log('✅ [WORKOUTS] Successfully found workouts:', workoutsWithExercises.length);

    return NextResponse.json({ 
      success: true, 
      data: workoutsWithExercises,
      meta: {
        total: workoutsWithExercises.length,
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

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const workoutData: WorkoutData = await request.json();

    console.log('🔵 [WORKOUTS] POST request:', { userId, workoutData });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

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

    console.log('🔵 [WORKOUTS] Creating workout...');

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

        // Criar exercício
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

    console.log('✅ [WORKOUTS] Workout created successfully with ID:', workout.workout_id);

    return NextResponse.json({ 
      success: true, 
      data: completeWorkout,
      message: 'Workout created successfully'
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