// ================================
// src/lib/types/workout.types.ts
// ================================

export interface Workout {
  workout_id: number;
  program_id: number;
  title: string;
  description?: string;
  sequence_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWorkoutData {
  program_id: number;
  title: string;
  description?: string;
  sequence_order?: number;
}

export interface Exercise {
  exercise_id: number;
  workout_id: number;
  name: string;
  description: string;
  video_url?: string;
  default_sets: number;
  default_reps: number;
  default_duration_sec?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExerciseData {
  workout_id: number;
  name: string;
  description: string;
  video_url?: string;
  default_sets: number;
  default_reps: number;
  default_duration_sec?: number;
}
